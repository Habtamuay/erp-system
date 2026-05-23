import express, { type Request, type Response } from 'express';
import { FinancialStatementService } from '../services/financial/financialStatements';
import { CashFlowEngine } from '../services/financial/cashFlowEngine';
import { ReportGenerator } from '../services/reporting/reportGenerator';
import { PdfExport } from '../services/reporting/pdfExport';
import { NoteGenerator } from '../services/financial/noteGenerator';
import { prisma } from '../config/database';

const router = express.Router();
const DEFAULT_COMPANY = 'company-1';

router.get('/dashboard-kpi', async (req: Request, res: Response) => {
  try {
    const companyId = String(req.query.companyId || DEFAULT_COMPANY);
    const data = await ReportGenerator.generateDashboardKpi(companyId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/monthly-trends', async (req: Request, res: Response) => {
  try {
    const companyId = String(req.query.companyId || DEFAULT_COMPANY);
    const data = await ReportGenerator.generateMonthlyTrends(companyId);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/balance-sheet', async (req: Request, res: Response) => {
  try {
    const { companyId = DEFAULT_COMPANY, period } = req.query;
    const result = await FinancialStatementService.generateBalanceSheet({
      companyId: String(companyId),
      period: String(period || getDefaultPeriod()),
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/income-statement', async (req: Request, res: Response) => {
  try {
    const { companyId = DEFAULT_COMPANY, period } = req.query;
    const result = await FinancialStatementService.generateIncomeStatement({
      companyId: String(companyId),
      period: String(period || getDefaultPeriod()),
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/cash-flow', async (req: Request, res: Response) => {
  try {
    const companyId = String(req.query.companyId || DEFAULT_COMPANY);
    const currentPeriod = String(req.query.currentPeriod || getDefaultPeriod());
    const previousPeriod = String(req.query.previousPeriod || getPreviousPeriod(currentPeriod));

    const result = await CashFlowEngine.generate(companyId, currentPeriod, previousPeriod);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/balance-sheet/export', async (req: Request, res: Response) => {
  try {
    const companyId = String(req.query.companyId || DEFAULT_COMPANY);
    const period = String(req.query.period || getDefaultPeriod());
    const balanceSheet = await FinancialStatementService.generateBalanceSheet({ companyId, period });
    const company = await prisma.company.findUnique({ where: { id: companyId } });
    const pdfBuffer = await PdfExport.createBalanceSheetPdf(balanceSheet, company?.name ?? 'ERP Company');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="balance-sheet-${period}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/account/:accountId/transactions', async (req: Request, res: Response) => {
  try {
    const accountId = String(req.params.accountId);
    const companyId = String(req.query.companyId || DEFAULT_COMPANY);
    const period = String(req.query.period || '');
    const dateFilter = period
      ? {
          gte: new Date(`${period}-01`),
          lt: new Date(`${period}-01T23:59:59`),
        }
      : undefined;

    const entries = await prisma.journalLine.findMany({
      where: {
        accountId,
        entry: {
          companyId,
          date: dateFilter,
        },
      },
      include: { entry: true },
      orderBy: { entry: { date: 'desc' } },
    });

    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/notes/:noteNumber', async (req: Request, res: Response) => {
  try {
    const noteNumber = String(req.params.noteNumber);
    const companyId = String(req.query.companyId || DEFAULT_COMPANY);
    const period = String(req.query.period || getDefaultPeriod());

    const noteData = await NoteGenerator.buildNoteContent(noteNumber, companyId, period);
    if (!noteData) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ noteNumber, period, data: noteData });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

function getDefaultPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getPreviousPeriod(current: string) {
  const [year, month] = current.split('-').map(Number);
  const priorDate = new Date(year, month - 2, 1);
  return `${priorDate.getFullYear()}-${String(priorDate.getMonth() + 1).padStart(2, '0')}`;
}

export default router;
