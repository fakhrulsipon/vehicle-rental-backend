import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB: {
    HOST: process.env.DB_HOST || '127.0.0.1',
    PORT: Number(process.env.DB_PORT) || 5432,
    USER: process.env.DB_USER || 'postgres',
    PASSWORD: process.env.DB_PASSWORD || 'postgres',
    NAME: process.env.DB_NAME || 'vehicle_rental_db',
  },
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  UPLOAD_PATH: process.env.UPLOAD_PATH || 'uploads',
};
