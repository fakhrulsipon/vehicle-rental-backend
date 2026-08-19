import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface DecodedToken {
  id: number;
  email: string;
  name: string;
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Authentication token missing or invalid' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET || 'default_jwt_secret';

  try {
    const decoded = jwt.verify(token, jwtSecret) as DecodedToken;
    req.user = decoded; // Extended Express Request property from Part 1
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
    return;
  }
};
