import express, { type Request, type Response } from 'express';
import { prisma } from '../config/database';
import { Decimal } from '@prisma/client/runtime/library';

const router = express.Router();

router.get('/accounts', async (req: Request, res: Response) => {
  try {
    const companyId = String(req.query.companyId || 'company-1');
    const accounts = await prisma.account.findMany({
      where: { companyId },
      orderBy: { code: 'asc' },
    });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/accounts/:id', async (req: Request, res: Response) => {
  try {
    const accountId = String(req.params.id);
    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account) return res.status(404).json({ error: 'Account not found' });
    res.json(account);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/journal-entries', async (req: Request, res: Response) => {
  try {
    const companyId = String(req.query.companyId || 'company-1');
    const entries = await prisma.journalEntry.findMany({
      where: { companyId },
      include: { lines: true },
      orderBy: { date: 'desc' },
    });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/journal-entries', async (req: Request, res: Response) => {
  try {
    const { date, description, reference, posted = false, createdBy, companyId, lines } = req.body;

    if (!date || !description || !createdBy || !companyId || !Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ error: 'Missing required journal entry fields' });
    }

    const entry = await prisma.journalEntry.create({
      data: {
        date: new Date(date),
        description,
        reference,
        posted,
        createdBy,
        companyId,
        lines: {
          create: lines.map((line: any) => ({
            accountId: line.accountId,
            debit: new Decimal(line.debit || 0),
            credit: new Decimal(line.credit || 0),
          })),
        },
      },
      include: { lines: true },
    });

    if (posted) {
      await Promise.all(entry.lines.map(async (line) => {
        await prisma.trialBalance.upsert({
          where: {
            period_accountId_companyId: {
              period: formatPeriod(new Date(entry.date)),
              accountId: line.accountId,
              companyId,
            },
          },
          update: {
            debit: { increment: line.debit },
            credit: { increment: line.credit },
            balance: { increment: line.debit.minus(line.credit) },
          },
          create: {
            period: formatPeriod(new Date(entry.date)),
            accountId: line.accountId,
            companyId,
            debit: line.debit,
            credit: line.credit,
            balance: line.debit.minus(line.credit),
          },
        });
      }));
    }

    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/trial-balance', async (req: Request, res: Response) => {
  try {
    const companyId = String(req.query.companyId || 'company-1');
    const period = String(req.query.period || formatPeriod(new Date()));
    const balances = await prisma.trialBalance.findMany({
      where: { companyId, period },
      include: { account: true },
    });
    res.json(balances);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

function formatPeriod(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export default router;
