import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { DEFAULT_PORT } from '@rona/config/server';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  await app.listen(process.env.PORT ?? DEFAULT_PORT);
}

// starts server
bootstrap();
