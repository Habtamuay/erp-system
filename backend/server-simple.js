const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'ERP Backend API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Database status endpoint (mock for now)
app.get('/api/db-status', (req, res) => {
  res.json({ 
    connected: true, 
    users: 1,
    companies: 1,
    accounts: 8,
    message: 'Database connection successful (mock data)',
    timestamp: new Date().toISOString()
  });
});

// Auth routes (mock for testing)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'admin@hilinafoods.com' && password === 'admin123') {
    const token = Buffer.from(`admin:${Date.now()}`).toString('base64');
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: '1',
        email: 'admin@hilinafoods.com',
        name: 'System Administrator',
        role: 'ADMIN'
      }
    });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/api/auth/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  res.json({ 
    user: {
      id: '1',
      email: 'admin@hilinafoods.com',
      name: 'System Administrator',
      role: 'ADMIN'
    }
  });
});

// Companies endpoint
app.get('/api/companies', (req, res) => {
  res.json([
    { id: '1', name: 'Hilina Enriched Foods PLC', code: 'HILINA001', currency: 'ETB' }
  ]);
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'ERP System Backend API',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      health: '/health',
      api: '/api/health',
      db: '/api/db-status',
      companies: '/api/companies',
      login: '/api/auth/login'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ERP Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 API: http://localhost:${PORT}/api`);
});

module.exports = app;
