import knex, { Knex } from 'knex';
import knexConfig from '../knexfile';

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

if (!config) {
  throw new Error(`Knex configuration for environment '${environment}' was not found.`);
}

const db: Knex = knex(config);

export default db;
