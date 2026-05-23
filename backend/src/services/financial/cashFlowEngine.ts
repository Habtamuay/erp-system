import { prisma } from '../../config/database';
import { Decimal } from '@prisma/client/runtime/library';

interface CashFlowResult {
  operating: Decimal;
  investing: Decimal;
  financing: Decimal;
  netCashFlow: Decimal;
  beginningCash: Decimal;
  endingCash: Decimal;
}

export class CashFlowEngine {
  
  static async generate(companyId: string, currentPeriod: string, previousPeriod: string): Promise<CashFlowResult> {
    const currentTB = await prisma.trialBalance.findMany({
      where: { companyId, period: currentPeriod },
      include: { account: true },
    });

    const previousTB = await prisma.trialBalance.findMany({
      where: { companyId, period: previousPeriod },
      include: { account: true },
    });

    const mappings = await prisma.cashFlowMapping.findMany({
      where: { companyId },
      include: { account: true },
    });

    const changes = this.calculateChanges(currentTB, previousTB);
    
    const operating = await this.calculateOperatingCF(changes, mappings);
    const investing = await this.calculateInvestingCF(changes, mappings);
    const financing = await this.calculateFinancingCF(changes, mappings);
    
    const beginningCash = this.getBeginningCashBalance(previousTB);
    const netCashFlow = new Decimal(operating).plus(investing).plus(financing);
    const endingCash = new Decimal(beginningCash).plus(netCashFlow);

    return {
      operating: new Decimal(operating),
      investing: new Decimal(investing),
      financing: new Decimal(financing),
      netCashFlow,
      beginningCash: new Decimal(beginningCash),
      endingCash,
    };
  }

  private static calculateChanges(current: any[], previous: any[]): Record<string, Decimal> {
    const changes: Record<string, Decimal> = {};
    
    current.forEach(c => {
      const prev = previous.find(p => p.accountId === c.accountId);
      const prevBalance = prev ? new Decimal(prev.balance) : new Decimal(0);
      changes[c.accountId] = new Decimal(c.balance).minus(prevBalance);
    });
    
    return changes;
  }

  private static async calculateOperatingCF(changes: Record<string, Decimal>, mappings: any[]): Promise<Decimal> {
    let operating = new Decimal(0);
    const profitBeforeTax = await this.getProfitBeforeTax(changes);
    operating = operating.plus(profitBeforeTax);

    mappings
      .filter(m => m.activity === 'OPERATING')
      .forEach(m => {
        const change = changes[m.accountId] || new Decimal(0);
        
        if (m.type === 'NON_CASH') {
          operating = operating.plus(change);
        } else if (m.type === 'WORKING_CAPITAL') {
          const adjustment = m.direction === 'INCREASE' 
            ? change.negated() 
            : change;
          operating = operating.plus(adjustment);
        }
      });

    return operating;
  }

  private static async calculateInvestingCF(changes: Record<string, Decimal>, mappings: any[]): Promise<Decimal> {
    let investing = new Decimal(0);
    
    mappings
      .filter(m => m.activity === 'INVESTING')
      .forEach(m => {
        investing = investing.plus(changes[m.accountId] || new Decimal(0));
      });
    
    return investing;
  }

  private static async calculateFinancingCF(changes: Record<string, Decimal>, mappings: any[]): Promise<Decimal> {
    let financing = new Decimal(0);
    
    mappings
      .filter(m => m.activity === 'FINANCING')
      .forEach(m => {
        financing = financing.plus(changes[m.accountId] || new Decimal(0));
      });
    
    return financing;
  }

  private static async getProfitBeforeTax(changes: Record<string, Decimal>): Promise<Decimal> {
    // Simplified - should come from income statement
    return new Decimal(0);
  }

  private static getBeginningCashBalance(previousTB: any[]): Decimal {
    const cashAccount = previousTB.find(t => t.account.type === 'ASSET' && t.account.category === 'CASH');
    return cashAccount ? new Decimal(cashAccount.balance) : new Decimal(0);
  }
}