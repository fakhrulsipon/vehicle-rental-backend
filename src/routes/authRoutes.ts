import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import db from '../config/database';
import { StaffRepository } from '../repositories/StaffRepository';
import { AuthService } from '../services/AuthService';
import { AuthController } from '../controllers/AuthController';
import { loginSchema } from '../validations/authValidation';

const router = Router();

// Rate limiter for authentication login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { message: 'Too many login attempts from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Dependency Injection Setup
const staffRepository = new StaffRepository(db);
const authService = new AuthService(staffRepository);
const authController = new AuthController(authService);

// Validation Middleware Helper
const validateBody = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);
    if (error) {
      res.status(400).json({ message: error.details[0].message });
      return;
    }
    next();
  };
};

// POST /auth/login
router.post('/login', loginLimiter, validateBody(loginSchema), authController.login);

export default router;
