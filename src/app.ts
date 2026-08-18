import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';

dotenv.config();

const app: Application = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Server is running smoothly' });
});

// API Routes
app.use('/auth', authRoutes);

export default app;