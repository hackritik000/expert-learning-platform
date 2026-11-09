// drizzle.config.ts
import { defineConfig } from 'drizzle-kit';

console.log('DB User', process.env.PGUSER);
console.log('DB Password', process.env.PGPASSWORD);
console.log('DB Host', process.env.PGHOST);
console.log('DB Port', process.env.PGPORT);
console.log('DB Name', process.env.PGDATABASE);
export default defineConfig({
  schema: './src/database/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.PGHOST ?? 'localhost',
    user: process.env.PGUSER ?? 'myuser',
    password: process.env.PGPASSWORD ?? 'mypassword',
    database: process.env.PGDATABASE ?? 'mydb',
    port: Number(process.env.PGPORT) ?? 5432,
    ssl: false,
  },
});
