import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { ENV } from '../config/env';
import * as schema from './schema';

// Connection pool configured for Bun runtime and PostgreSQL
export const sqlClient = postgres(ENV.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(sqlClient, { schema });
