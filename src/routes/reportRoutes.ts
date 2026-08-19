import { Router, Request, Response, NextFunction } from 'express';
import db from '../config/database';
import { ReportRepository } from '../repositories/ReportRepository';
import { ReportService } from '../services/ReportService';
import { ReportController } from '../controllers/ReportController';
import { authenticateJWT } from '../middlewares/authMiddleware';
import { monthlyReportQuerySchema } from '../validations/reportValidation';

const router = Router();

const reportRepository = new ReportRepository(db);
const reportService = new ReportService(reportRepository);
const reportController = new ReportController(reportService);

const validateQuery = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.query);
    if (error) {
      res.status(400).json({ message: error.details[0].message });
      return;
    }
    next();
  };
};

// All report routes protected by JWT
router.use(authenticateJWT);

router.get('/monthly', validateQuery(monthlyReportQuerySchema), reportController.getMonthlyReport);

export default router;