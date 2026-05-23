const express = require('express');
const cors = require('cors');
require('dotenv').config();

const statusRoutes = require('./routes/status.routes');
const authRoutes = require('./routes/auth.routes');
const companyRoutes = require('./routes/company.routes');
const accountingRoutes = require('./routes/accounting.routes');
const { requireAuth } = require('./middleware/auth.middleware');
const { pool } = require('./config/db');
const { ensureAccountingSchema } = require('./services/accounting.service');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/', statusRoutes);

app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);

app.use('/companies', companyRoutes);
app.use('/api/companies', requireAuth, companyRoutes);
app.use('/accounting', requireAuth, accountingRoutes);
app.use('/api/accounting', requireAuth, accountingRoutes);

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('Database connected successfully');
    await ensureAccountingSchema();
    console.log('Accounting schema ready');
  } catch (error) {
    console.error('Startup warning:', error.message);
  }

  app.listen(PORT, () => {
    console.log(`ERP Backend running on port ${PORT}`);
  });
}

start();

module.exports = app;
