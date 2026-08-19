import { ReportRepository, IMonthlyReportParams, IMonthlyReportResult } from '../repositories/ReportRepository';

export class ReportService {
  private reportRepository: ReportRepository;

  constructor(reportRepository: ReportRepository) {
    this.reportRepository = reportRepository;
  }

  async generateMonthlyReport(params: IMonthlyReportParams): Promise<IMonthlyReportResult> {
    return await this.reportRepository.getMonthlyReport(params);
  }
}