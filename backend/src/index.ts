import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    service: 'ERP Backend'
  });
});

// API health endpoint (for nginx)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'ERP Backend API is running',
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'ERP System Backend Running',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      health: '/health',
      api: '/api/health',
      test: '/api/test',
      docs: '/api/docs'
    },
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    data: {
      sample: "This is a test response"
    }
  });
});

// Auth routes (migrated from server-simple.js)
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

// Database status endpoint (to check PostgreSQL connection)
app.get('/api/db-status', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'connected',
      database: 'PostgreSQL',
      message: 'Database connection is working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 API health: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
