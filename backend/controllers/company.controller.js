const { query } = require('../config/db');

async function getCompanies(_req, res) {
  try {
    const result = await query(
      `
        SELECT id, code, name, currency, is_active, created_at
        FROM companies
        WHERE is_active = true
        ORDER BY id
      `,
    );
    return res.json(result.rows);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getCompanies,
};
