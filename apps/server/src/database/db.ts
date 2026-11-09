import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  host: process.env.PGHOST ?? 'localhost',
  user: process.env.PGUSER ?? 'root',
  password: process.env.PGPASSWORD ?? '12345678',
  database: process.env.PGDATABASE ?? 'justsearch',
  port: Number(process.env.PGPORT) ?? 5432,
});

export const db = drizzle(pool, { schema });
