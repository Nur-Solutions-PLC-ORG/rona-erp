import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app/modules/app.module';
import { DEFAULT_PORT } from '@rona/config/server';
import { DEFAULT_CLIENT_URL } from '@rona/config/client';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CLIENT_URL ?? DEFAULT_CLIENT_URL,
    credentials: true,
  });

  app.use(cookieParser());

  await app.listen(process.env.PORT ?? DEFAULT_PORT);
}

// starts server
bootstrap();
