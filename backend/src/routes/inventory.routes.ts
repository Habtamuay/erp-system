import express, { type Request, type Response } from 'express';
import { prisma } from '../config/database';

const router = express.Router();

router.get('/items', async (req: Request, res: Response) => {
  try {
    const companyId = String(req.query.companyId || 'company-1');
    const items = await prisma.item.findMany({ where: { companyId }, orderBy: { code: 'asc' } });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/warehouses', async (req: Request, res: Response) => {
  try {
    const companyId = String(req.query.companyId || 'company-1');
    const warehouses = await prisma.warehouse.findMany({ where: { companyId }, orderBy: { name: 'asc' } });
    res.json(warehouses);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/stock-ledger', async (req: Request, res: Response) => {
  try {
    const companyId = String(req.query.companyId || 'company-1');
    const ledger = await prisma.stockLedger.findMany({
      where: { companyId },
      include: { item: true, warehouse: true },
      orderBy: { transactionDate: 'desc' },
    });
    res.json(ledger);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
