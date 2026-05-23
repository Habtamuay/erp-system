import PDFDocument from 'pdfkit';

export class PdfExport {
  static async createBalanceSheetPdf(balanceSheet: any, companyName: string) {
    return new Promise<Buffer>((resolve) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const buffers: Uint8Array[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      doc.fontSize(18).text(`${companyName} – Balance Sheet`, { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Period: ${balanceSheet.period}`);
      doc.moveDown();

      const sections = [
        { label: 'Current Assets', value: balanceSheet.assets.current },
        { label: 'Non-Current Assets', value: balanceSheet.assets.nonCurrent },
        { label: 'Total Assets', value: balanceSheet.assets.total },
        { label: 'Current Liabilities', value: balanceSheet.liabilities.current },
        { label: 'Non-Current Liabilities', value: balanceSheet.liabilities.nonCurrent },
        { label: 'Total Liabilities', value: balanceSheet.liabilities.total },
        { label: 'Total Equity', value: balanceSheet.equity.total },
        { label: 'Total Liabilities & Equity', value: balanceSheet.totalEquityAndLiabilities },
      ];

      sections.forEach((section) => {
        doc.fontSize(12).text(`${section.label}: ETB ${Number(section.value).toLocaleString()}`);
      });

      doc.end();
    });
  }
}
