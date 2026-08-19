import express, { Application, Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './docs/swagger';
import authRoutes from './routes/authRoutes';
import vehicleRoutes from './routes/vehicleRoutes';
import rentalRoutes from './routes/rentalRoutes';
import reportRoutes from './routes/reportRoutes';

dotenv.config();

const app: Application = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Uploaded Files Statically
const uploadPath = process.env.UPLOAD_PATH || 'uploads';
app.use(`/${uploadPath}`, express.static(path.join(__dirname, `../${uploadPath}`)));

// Swagger API Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Root Route
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to Vehicle Rental Management API',
    documentation: '/api-docs',
    endpoints: {
      health: '/health',
      auth: '/auth/login',
      vehicles: '/vehicles',
      rentals: '/rentals',
      reports: '/reports/monthly',
    },
  });
});

// Health Check Route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Server is running smoothly' });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/vehicles', vehicleRoutes);
app.use('/rentals', rentalRoutes);
app.use('/reports', reportRoutes);

export default app;