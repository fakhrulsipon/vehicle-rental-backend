import { Request, Response } from 'express';
import { ReportService } from '../services/ReportService';

export class ReportController {
  private reportService: ReportService;

  constructor(reportService: ReportService) {
    this.reportService = reportService;
  }

  getMonthlyReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const month = req.query.month as string;
      const vehicle_id = req.query.vehicle_id ? Number(req.query.vehicle_id) : undefined;

      const report = await this.reportService.generateMonthlyReport({ month, vehicle_id });

      res.status(200).json({
        message: 'Monthly rental report generated successfully',
        data: report,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to generate report' });
    }
  };
}
