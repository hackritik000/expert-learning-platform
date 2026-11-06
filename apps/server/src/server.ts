import { app } from './app';
import { ENV } from './config/env';
import { runMigrations } from './database/migrate';

async function bootstrap() {
  try {
    console.log('🚀 Checking database connection...');
    await runMigrations();
  } catch (err: any) {
    console.warn(
      '⚠️ Note: Database migration check failed on boot (PostgreSQL container may still be starting):',
      err.message,
    );
  }

  app.listen(ENV.PORT, '0.0.0.0', () => {
    console.log('\n=================================================');
    console.log('🎓 Expert Learning Platform API running!');
    console.log(`📡 URL: http://localhost:${ENV.PORT}`);
    console.log(`📚 Swagger Docs: http://localhost:${ENV.PORT}/api/docs`);
    console.log(`💚 Health check: http://localhost:${ENV.PORT}/health`);
    console.log('=================================================\n');
  });
}

bootstrap();
