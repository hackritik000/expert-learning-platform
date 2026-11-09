import { cleanEnv, num, str } from 'envalid';

export const ENV = cleanEnv(process.env, {
  PORT: num({
    default: 4000,
  }),
  JWT_SECRET: str({
    default: 'expert_learning_super_secret_jwt_key_2026',
  }),
  JWT_EXPIRES_IN: str({
    default: '7d',
  }),
  NODE_ENV: str({
    choices: ['development', 'test', 'production'],
    default: 'development',
  }),
  PGHOST: str(),
  PGPORT: num({
    default: 5432,
  }),
  PGUSER: str(),
  PGPASSWORD: str(),
  PGDATABASE: str(),
});
