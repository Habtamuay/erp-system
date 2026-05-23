import { prisma } from '../../config/database';
import { BOMCalculator } from './bomCalculator';
import { Decimal } from '@prisma/client/runtime/library';

export class ProductionCostService {
  static async createCostForWorkOrder(workOrderId: string) {
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      include: { bom: true },
    });

    if (!workOrder || !workOrder.bom) {
      throw new Error('Work order or BOM not found');
    }

    const materialCost = await BOMCalculator.calculateMaterialCost(workOrder.bomId);
    const operationCost = await BOMCalculator.calculateOperationCost(workOrder.bomId);
    const totalCost = materialCost.plus(operationCost);

    return prisma.productionCost.upsert({
      where: { workOrderId },
      update: {
        materialCost,
        laborCost: operationCost,
        overheadCost: new Decimal(0),
        totalCost,
      },
      create: {
        workOrderId,
        materialCost,
        laborCost: operationCost,
        overheadCost: new Decimal(0),
        totalCost,
      },
    });
  }
}
