import express, { type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { prisma } from './config/database';

// Routes
import authRoutes from './routes/auth.routes';
import accountingRoutes from './routes/accounting.routes';
import reportingRoutes from './routes/reporting.routes';
import manufacturingRoutes from './routes/manufacturing.routes';
import inventoryRoutes from './routes/inventory.routes';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use('/api', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/reporting', reportingRoutes);
app.use('/api/manufacturing', manufacturingRoutes);
app.use('/api/inventory', inventoryRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`ERP Server running on port ${PORT}`);
});