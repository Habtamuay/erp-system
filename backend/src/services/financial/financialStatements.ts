import { prisma } from '../../config/database';
import { Decimal } from '@prisma/client/runtime/library';

interface FinancialStatementOptions {
  companyId: string;
  period: string;
  previousPeriod?: string;
}

export class FinancialStatementService {
  
  static async generateBalanceSheet({ companyId, period }: FinancialStatementOptions) {
    const tb = await prisma.trialBalance.findMany({
      where: { companyId, period },
      include: { account: true },
    });

    const assets = this.sumByType(tb, ['ASSET']);
    const liabilities = this.sumByType(tb, ['LIABILITY']);
    const equity = this.sumByType(tb, ['EQUITY']);

    return {
      period,
      assets: {
        current: this.sumByClassification(assets, 'CURRENT'),
        nonCurrent: this.sumByClassification(assets, 'NON_CURRENT'),
        total: assets.total,
      },
      liabilities: {
        current: this.sumByClassification(liabilities, 'CURRENT'),
        nonCurrent: this.sumByClassification(liabilities, 'NON_CURRENT'),
        total: liabilities.total,
      },
      equity: {
        total: equity.total,
      },
      totalEquityAndLiabilities: liabilities.total.plus(equity.total),
    };
  }

  static async generateIncomeStatement({ companyId, period }: FinancialStatementOptions) {
    const tb = await prisma.trialBalance.findMany({
      where: { companyId, period },
      include: { account: true },
    });

    const revenue = this.sumByType(tb, ['INCOME']);
    const expenses = this.sumByType(tb, ['EXPENSE']);

    const grossProfit = revenue.total.minus(this.getAccountBalance(tb, 'COST_OF_SALES'));
    const operatingProfit = grossProfit.minus(this.sumByClassification(expenses, 'OPERATING').total);
    const netProfit = operatingProfit.plus(this.sumByClassification(revenue, 'NON_OPERATING').total);

    return {
      period,
      revenue: revenue.total,
      costOfSales: this.getAccountBalance(tb, 'COST_OF_SALES'),
      grossProfit,
      operatingExpenses: this.sumByClassification(expenses, 'OPERATING').total,
      operatingProfit,
      otherIncome: this.sumByClassification(revenue, 'NON_OPERATING').total,
      otherExpenses: this.sumByClassification(expenses, 'NON_OPERATING').total,
      profitBeforeTax: operatingProfit.plus(this.sumByClassification(revenue, 'NON_OPERATING').total),
      tax: this.getAccountBalance(tb, 'TAX_EXPENSE'),
      netProfit,
    };
  }

  private static sumByType(tb: any[], types: string[]) {
    let total = new Decimal(0);
    const byClassification: Record<string, Decimal> = {};

    tb.filter(t => types.includes(t.account.type)).forEach(t => {
      total = total.plus(t.balance);
      const classKey = t.account.classification;
      byClassification[classKey] = (byClassification[classKey] || new Decimal(0)).plus(t.balance);
    });

    return { total, ...byClassification };
  }

  private static sumByClassification(data: any, classification: string) {
    let total = new Decimal(0);
    Object.entries(data).forEach(([key, value]) => {
      if (key === classification && value instanceof Decimal) {
        total = total.plus(value);
      }
    });
    return { total, [classification]: total };
  }

  private static getAccountBalance(tb: any[], accountCode: string): Decimal {
    const entry = tb.find(t => t.account.code === accountCode);
    return entry ? new Decimal(entry.balance) : new Decimal(0);
  }
}