import dotenv from 'dotenv';
import path from 'path';
import type { Knex } from 'knex';

dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig: Knex.Config = {
  client: 'pg',
  connection: process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'vehicle_rental_db',
      },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: path.join(__dirname, 'database', 'migrations'),
    extension: 'ts',
  },
  seeds: {
    directory: path.join(__dirname, 'database', 'seeds'),
    extension: 'ts',
  },
};

const config: { [key: string]: Knex.Config } = {
  development: dbConfig,
  production: dbConfig,
};

export default config;
