import express, { type Request, type Response } from 'express';
import { prisma } from '../config/database';
import { BOMCalculator } from '../services/manufacturing/bomCalculator';
import { ProductionCostService } from '../services/manufacturing/productionCost';

const router = express.Router();

router.get('/boms', async (req: Request, res: Response) => {
  try {
    const companyId = String(req.query.companyId || 'company-1');
    const boms = await prisma.bom.findMany({
      where: { companyId },
      include: { product: true, items: { include: { rawMaterial: true } }, operations: true },
    });
    res.json(boms);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/boms/:id/cost', async (req: Request, res: Response) => {
  try {
    const bomId = String(req.params.id);
    const result = await BOMCalculator.calculateTotalBOMCost(bomId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/work-orders', async (req: Request, res: Response) => {
  try {
    const companyId = String(req.query.companyId || 'company-1');
    const workOrders = await prisma.workOrder.findMany({
      where: { companyId },
      include: { product: true, bom: true, costs: true },
      orderBy: { startDate: 'desc' },
    });
    res.json(workOrders);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/work-orders', async (req: Request, res: Response) => {
  try {
    const { number, productId, bomId, quantity, startDate, companyId, status = 'PLANNED' } = req.body;

    const workOrder = await prisma.workOrder.create({
      data: {
        number,
        productId,
        bomId,
        quantity: Number(quantity),
        startDate: new Date(startDate),
        status,
        companyId,
      },
      include: { costs: true },
    });

    const cost = await ProductionCostService.createCostForWorkOrder(workOrder.id);
    res.status(201).json({ workOrder, cost });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
