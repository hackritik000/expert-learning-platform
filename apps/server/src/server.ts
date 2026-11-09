import { app } from './app';
import { ENV } from './config/env';

async function bootstrap() {
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
