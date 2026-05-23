const accountingService = require('../services/accounting.service');

function resolveCompanyId(req) {
  const value = req.query.companyId || req.body.companyId;
  return Number(value || 1);
}

async function getAccounts(req, res) {
  try {
    const companyId = resolveCompanyId(req);
    const accounts = await accountingService.getAccounts(companyId);
    return res.json(accounts);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function getJournalEntries(req, res) {
  try {
    const companyId = resolveCompanyId(req);
    const entries = await accountingService.getJournalEntries(companyId);
    return res.json(entries);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

async function postJournalEntry(req, res) {
  try {
    const companyId = resolveCompanyId(req);
    const createdBy = req.user ? Number(req.user.userId) : null;

    const entry = await accountingService.createJournalEntry({
      companyId,
      entryDate: req.body.entryDate || new Date().toISOString().slice(0, 10),
      description: req.body.description,
      reference: req.body.reference,
      createdBy,
      lines: req.body.lines,
    });

    return res.status(201).json(entry);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

async function getTrialBalance(req, res) {
  try {
    const companyId = resolveCompanyId(req);
    const trialBalance = await accountingService.getTrialBalance(companyId);
    return res.json(trialBalance);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAccounts,
  getJournalEntries,
  postJournalEntry,
  getTrialBalance,
};
