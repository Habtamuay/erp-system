const { query } = require('../config/db');

async function health(_req, res) {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
}

async function apiHealth(_req, res) {
  res.json({
    status: 'healthy',
    message: 'ERP Backend API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
}

async function dbStatus(_req, res) {
  try {
    const now = await query('SELECT NOW() AS time');
    const users = await query('SELECT COUNT(*)::int AS count FROM users');
    const companies = await query('SELECT COUNT(*)::int AS count FROM companies');
    const tableExists = await query(`SELECT to_regclass('public.accounts') AS name`);
    let accountsCount = 0;

    if (tableExists.rows[0].name) {
      const accounts = await query('SELECT COUNT(*)::int AS count FROM accounts');
      accountsCount = accounts.rows[0].count;
    }

    res.json({
      connected: true,
      users: users.rows[0].count,
      companies: companies.rows[0].count,
      accounts: accountsCount,
      message: 'Database connection successful',
      timestamp: now.rows[0].time,
    });
  } catch (error) {
    res.json({ connected: false, error: error.message });
  }
}

function root(_req, res) {
  res.json({
    message: 'ERP System Backend API',
    version: '1.0.0',
    status: 'operational',
  });
}

module.exports = {
  health,
  apiHealth,
  dbStatus,
  root,
};
