import { prisma } from '../../config/database';
import { Decimal } from '@prisma/client/runtime/library';

export class ReportGenerator {
  static async generateDashboardKpi(companyId: string) {
    const balances = await prisma.trialBalance.findMany({
      where: { companyId },
      include: { account: true },
    });

    const revenue = balances
      .filter((tb) => tb.account.type === 'INCOME')
      .reduce((sum, tb) => sum.plus(new Decimal(tb.balance)), new Decimal(0));

    const expenses = balances
      .filter((tb) => tb.account.type === 'EXPENSE')
      .reduce((sum, tb) => sum.plus(new Decimal(tb.balance)), new Decimal(0));

    const inventory = balances
      .filter((tb) => tb.account.type === 'ASSET' && tb.account.category === 'INVENTORY')
      .reduce((sum, tb) => sum.plus(new Decimal(tb.balance)), new Decimal(0));

    const activeWorkOrders = await prisma.workOrder.count({
      where: { companyId, status: { in: ['PLANNED', 'IN_PROGRESS'] } },
    });

    return {
      revenue: Number(revenue),
      netProfit: Number(revenue.minus(expenses)),
      inventory: Number(inventory),
      activeProjects: activeWorkOrders,
    };
  }

  static async generateMonthlyTrends(companyId: string) {
    const now = new Date();
    const months = [] as string[];

    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    }

    const balances = await prisma.trialBalance.findMany({
      where: { companyId, period: { in: months } },
      include: { account: true },
    });

    return {
      revenue: months.map((period) => {
        const totalRevenue = balances
          .filter((tb) => tb.period === period && tb.account.type === 'INCOME')
          .reduce((sum, tb) => sum.plus(new Decimal(tb.balance)), new Decimal(0));
        return { month: period, revenue: Number(totalRevenue) };
      }),
      performance: months.map((period) => {
        const totalRevenue = balances
          .filter((tb) => tb.period === period && tb.account.type === 'INCOME')
          .reduce((sum, tb) => sum.plus(new Decimal(tb.balance)), new Decimal(0));
        const totalExpenses = balances
          .filter((tb) => tb.period === period && tb.account.type === 'EXPENSE')
          .reduce((sum, tb) => sum.plus(new Decimal(tb.balance)), new Decimal(0));
        return { month: period, revenue: Number(totalRevenue), expenses: Number(totalExpenses) };
      }),
    };
  }
}
