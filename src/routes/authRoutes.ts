import { Router, Request, Response, NextFunction } from 'express';
import db from '../config/database';
import { StaffRepository } from '../repositories/StaffRepository';
import { AuthService } from '../services/AuthService';
import { AuthController } from '../controllers/AuthController';
import { loginSchema } from '../validations/authValidation';

const router = Router();

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
router.post('/login', validateBody(loginSchema), authController.login);

export default router;