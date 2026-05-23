import { prisma } from '../../config/database';
import { Decimal } from '@prisma/client/runtime/library';

export class COGSEngine {
  
  static async calculateCOGS(companyId: string, period: string): Promise<{
    openingInventory: Decimal;
    productionCost: Decimal;
    closingInventory: Decimal;
    cogs: Decimal;
  }> {
    const opening = await this.getOpeningInventory(companyId, period);
    const production = await this.getProductionCost(companyId, period);
    const closing = await this.getClosingInventory(companyId, period);
    
    const cogs = opening.plus(production).minus(closing);
    
    return { openingInventory: opening, productionCost: production, closingInventory: closing, cogs };
  }

  private static async getOpeningInventory(companyId: string, period: string): Promise<Decimal> {
    const [year, month] = period.split('-');
    const previousMonth = `${year}-${String(parseInt(month) - 1).padStart(2, '0')}`;
    
    const closing = await prisma.stockLedger.aggregate({
      where: {
        companyId,
        transactionDate: { lt: new Date(parseInt(year), parseInt(month) - 1, 1) },
        item: { type: 'FINISHED_GOOD' },
      },
      _sum: { value: true },
    });
    
    return new Decimal(closing._sum.value || 0);
  }

  private static async getProductionCost(companyId: string, period: string): Promise<Decimal> {
    const startDate = new Date(parseInt(period.split('-')[0]), parseInt(period.split('-')[1]) - 1, 1);
    const endDate = new Date(parseInt(period.split('-')[0]), parseInt(period.split('-')[1]), 0);
    
    const production = await prisma.productionCost.aggregate({
      where: {
        workOrder: {
          companyId,
          endDate: { gte: startDate, lte: endDate },
        },
      },
      _sum: { totalCost: true },
    });
    
    return new Decimal(production._sum.totalCost || 0);
  }

  private static async getClosingInventory(companyId: string, period: string): Promise<Decimal> {
    const endDate = new Date(parseInt(period.split('-')[0]), parseInt(period.split('-')[1]), 0);
    
    const closing = await prisma.stockLedger.aggregate({
      where: {
        companyId,
        transactionDate: { lte: endDate },
        item: { type: 'FINISHED_GOOD' },
      },
      _sum: { value: true },
    });
    
    return new Decimal(closing._sum.value || 0);
  }
}