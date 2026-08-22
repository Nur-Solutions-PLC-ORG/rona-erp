import { NestFactory } from '@nestjs/core';
import { DEFAULT_CLIENT_URL } from '@rona/config/client';
import { DEFAULT_PORT } from '@rona/config/server';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import { AppModule } from './modules/app/app.module';
import { GLOBAL_PREFIX } from './configs/route';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CLIENT_URL ?? DEFAULT_CLIENT_URL,
    credentials: true,
  });

  app.use(cookieParser());

  app.setGlobalPrefix(GLOBAL_PREFIX);

  await app.listen(process.env.PORT ?? DEFAULT_PORT);
}

// starts server
void bootstrap();
