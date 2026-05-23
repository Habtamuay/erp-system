import { prisma } from '../../config/database';
import { Decimal } from '@prisma/client/runtime/library';

export class BOMCalculator {
  
  static async calculateMaterialCost(bomId: string): Promise<Decimal> {
    const items = await prisma.bomItem.findMany({
      where: { bomId },
      include: { rawMaterial: true },
    });

    let total = new Decimal(0);
    
    for (const item of items) {
      const unitCost = item.rawMaterial.unitCost;
      const quantity = new Decimal(item.quantity);
      const cost = unitCost.times(quantity);
      
      // Add waste factor
      const wasteFactor = new Decimal(1).plus(new Decimal(item.wastePercent).dividedBy(100));
      total = total.plus(cost.times(wasteFactor));
    }
    
    return total;
  }

  static async calculateOperationCost(bomId: string): Promise<Decimal> {
    const operations = await prisma.bomOperation.findMany({
      where: { bomId },
    });

    let total = new Decimal(0);
    
    operations.forEach((op: any) => {
      total = total.plus(new Decimal(op.laborCost)).plus(new Decimal(op.machineCost));
    });
    
    return total;
  }

  static async calculateTotalBOMCost(bomId: string): Promise<{
    materialCost: Decimal;
    operationCost: Decimal;
    totalCost: Decimal;
  }> {
    const materialCost = await this.calculateMaterialCost(bomId);
    const operationCost = await this.calculateOperationCost(bomId);
    const totalCost = materialCost.plus(operationCost);
    
    return { materialCost, operationCost, totalCost };
  }
}