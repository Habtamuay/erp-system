const { query, withTransaction } = require('../config/db');

const DEFAULT_ACCOUNTS = [
  { code: '1000', name: 'Cash and Bank', type: 'ASSET' },
  { code: '1100', name: 'Accounts Receivable', type: 'ASSET' },
  { code: '1200', name: 'Inventory', type: 'ASSET' },
  { code: '2000', name: 'Accounts Payable', type: 'LIABILITY' },
  { code: '3000', name: 'Owner Equity', type: 'EQUITY' },
  { code: '4000', name: 'Sales Revenue', type: 'INCOME' },
  { code: '5000', name: 'Cost of Sales', type: 'EXPENSE' },
  { code: '6100', name: 'General Admin Expense', type: 'EXPENSE' },
];

async function ensureAccountingSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS accounts (
      id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      code VARCHAR(20) NOT NULL,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(20) NOT NULL CHECK (type IN ('ASSET','LIABILITY','EQUITY','INCOME','EXPENSE')),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (company_id, code)
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS journal_entries (
      id SERIAL PRIMARY KEY,
      company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      entry_number VARCHAR(40) NOT NULL UNIQUE,
      entry_date DATE NOT NULL,
      description TEXT NOT NULL,
      reference VARCHAR(100),
      status VARCHAR(20) NOT NULL DEFAULT 'POSTED',
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS journal_entry_lines (
      id SERIAL PRIMARY KEY,
      journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
      account_id INTEGER NOT NULL REFERENCES accounts(id),
      debit NUMERIC(18,2) NOT NULL DEFAULT 0,
      credit NUMERIC(18,2) NOT NULL DEFAULT 0,
      line_description VARCHAR(255),
      CHECK (debit >= 0),
      CHECK (credit >= 0)
    );
  `);

  const companies = await query('SELECT id FROM companies');
  for (const row of companies.rows) {
    for (const account of DEFAULT_ACCOUNTS) {
      await query(
        `
          INSERT INTO accounts (company_id, code, name, type)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (company_id, code) DO NOTHING
        `,
        [row.id, account.code, account.name, account.type],
      );
    }
  }
}

async function getAccounts(companyId) {
  const result = await query(
    `
      SELECT id, company_id, code, name, type, is_active, created_at
      FROM accounts
      WHERE company_id = $1
      ORDER BY code ASC
    `,
    [companyId],
  );
  return result.rows;
}

async function getJournalEntries(companyId) {
  const result = await query(
    `
      SELECT
        je.id,
        je.company_id,
        je.entry_number,
        je.entry_date,
        je.description,
        je.reference,
        je.status,
        je.created_by,
        je.created_at,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', jel.id,
              'account_id', jel.account_id,
              'account_code', a.code,
              'account_name', a.name,
              'debit', jel.debit,
              'credit', jel.credit,
              'line_description', jel.line_description
            )
            ORDER BY jel.id
          ) FILTER (WHERE jel.id IS NOT NULL),
          '[]'::json
        ) AS lines
      FROM journal_entries je
      LEFT JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
      LEFT JOIN accounts a ON a.id = jel.account_id
      WHERE je.company_id = $1
      GROUP BY je.id
      ORDER BY je.entry_date DESC, je.id DESC
      LIMIT 100
    `,
    [companyId],
  );

  return result.rows;
}

async function createJournalEntry(payload) {
  const {
    companyId,
    entryDate,
    description,
    reference,
    createdBy,
    lines,
  } = payload;

  if (!Array.isArray(lines) || lines.length < 2) {
    throw new Error('A journal entry requires at least 2 lines');
  }

  let totalDebit = 0;
  let totalCredit = 0;
  for (const line of lines) {
    totalDebit += Number(line.debit || 0);
    totalCredit += Number(line.credit || 0);
  }

  if (totalDebit <= 0 || totalCredit <= 0) {
    throw new Error('Journal entry must include both debit and credit amounts');
  }

  if (Math.abs(totalDebit - totalCredit) > 0.0001) {
    throw new Error('Total debit must equal total credit');
  }

  const entryNumber = `JE-${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}`;

  return withTransaction(async (client) => {
    const entryResult = await client.query(
      `
        INSERT INTO journal_entries (company_id, entry_number, entry_date, description, reference, created_by, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'POSTED')
        RETURNING *
      `,
      [companyId, entryNumber, entryDate, description, reference || null, createdBy || null],
    );

    const entry = entryResult.rows[0];

    for (const line of lines) {
      const debit = Number(line.debit || 0);
      const credit = Number(line.credit || 0);
      await client.query(
        `
          INSERT INTO journal_entry_lines (journal_entry_id, account_id, debit, credit, line_description)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [entry.id, Number(line.accountId), debit, credit, line.description || null],
      );
    }

    const withLines = await client.query(
      `
        SELECT
          je.*,
          COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'id', jel.id,
                'account_id', jel.account_id,
                'debit', jel.debit,
                'credit', jel.credit,
                'line_description', jel.line_description
              )
              ORDER BY jel.id
            ) FILTER (WHERE jel.id IS NOT NULL),
            '[]'::json
          ) AS lines
        FROM journal_entries je
        LEFT JOIN journal_entry_lines jel ON je.id = jel.journal_entry_id
        WHERE je.id = $1
        GROUP BY je.id
      `,
      [entry.id],
    );

    return withLines.rows[0];
  });
}

async function getTrialBalance(companyId) {
  const result = await query(
    `
      SELECT
        a.id AS account_id,
        a.code,
        a.name,
        a.type,
        COALESCE(SUM(jel.debit), 0)::numeric(18,2) AS total_debit,
        COALESCE(SUM(jel.credit), 0)::numeric(18,2) AS total_credit,
        (COALESCE(SUM(jel.debit), 0) - COALESCE(SUM(jel.credit), 0))::numeric(18,2) AS balance
      FROM accounts a
      LEFT JOIN journal_entry_lines jel ON jel.account_id = a.id
      LEFT JOIN journal_entries je ON je.id = jel.journal_entry_id
      WHERE a.company_id = $1
      GROUP BY a.id, a.code, a.name, a.type
      ORDER BY a.code
    `,
    [companyId],
  );
  return result.rows;
}

module.exports = {
  ensureAccountingSchema,
  getAccounts,
  getJournalEntries,
  createJournalEntry,
  getTrialBalance,
};
