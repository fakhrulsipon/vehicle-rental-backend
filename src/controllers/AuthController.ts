import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);

      res.status(200).json({
        message: 'Login successful',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        message: error.message || 'Login failed',
      });
    }
  };
}