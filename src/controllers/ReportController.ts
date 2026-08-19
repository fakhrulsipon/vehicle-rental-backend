import { Request, Response } from 'express';
import { ReportService } from '../services/ReportService';

export class ReportController {
  private reportService: ReportService;

  constructor(reportService: ReportService) {
    this.reportService = reportService;
  }

  getMonthlyReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const year = Number(req.query.year);
      const month = Number(req.query.month);

      const report = await this.reportService.generateMonthlyReport({ year, month });

      res.status(200).json({
        message: 'Monthly report generated successfully',
        year,
        month,
        data: report,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to generate report' });
    }
  };
}