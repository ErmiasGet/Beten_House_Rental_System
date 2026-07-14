import { Request, Response, NextFunction } from 'express';
import { ReportService } from '../services/report.service';

const reportService = new ReportService();

export class ReportController {
  async getIncomeReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      const report = await reportService.getIncomeReport(
        req.user!.userId,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  async getExpenseReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      const report = await reportService.getExpenseReport(
        req.user!.userId,
        new Date(startDate as string),
        new Date(endDate as string)
      );
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  async getOccupancyReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await reportService.getOccupancyReport(req.user!.userId);
      res.json({ success: true, data: report });
    } catch (error) {
      next(error);
    }
  }

  async exportPaymentsPDF(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      const report = await reportService.getIncomeReport(
        req.user!.userId,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=payment-report.pdf');
      await reportService.generatePaymentReportPDF(res, report.payments);
    } catch (error) {
      next(error);
    }
  }

  async exportExpensesPDF(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      const report = await reportService.getExpenseReport(
        req.user!.userId,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=expense-report.pdf');
      await reportService.generateExpenseReportPDF(res, report.expenses);
    } catch (error) {
      next(error);
    }
  }
}
