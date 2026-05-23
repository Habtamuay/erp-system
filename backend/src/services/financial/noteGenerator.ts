import { prisma } from '../../config/database';
import { Decimal } from '@prisma/client/runtime/library';

export class NoteGenerator {
  static async buildNoteContent(noteNumber: string, companyId: string, period: string) {
    const note = await prisma.noteDefinition.findFirst({
      where: { noteNumber, companyId },
      include: { lines: true },
    });

    if (!note) {
      return null;
    }

    const content = [] as Array<{ label: string; amount: number; order: number }>;

    for (const line of note.lines) {
      let amount = line.amount ? new Decimal(line.amount) : new Decimal(0);

      if (line.accountFilter && typeof line.accountFilter === 'object' && line.accountFilter !== null) {
        const accountFilter = line.accountFilter as Record<string, unknown>;
        const accounts = await prisma.account.findMany({
          where: { companyId, ...accountFilter },
          include: { trialBalances: { where: { period } } },
        });

        amount = accounts.reduce((sum, account) => {
          const tb = account.trialBalances[0];
          return sum.plus(tb ? new Decimal(tb.balance) : new Decimal(0));
        }, new Decimal(0));
      }

      content.push({
        label: line.label,
        amount: Number(amount),
        order: line.order,
      });
    }

    return content.sort((a, b) => a.order - b.order);
  }
}
