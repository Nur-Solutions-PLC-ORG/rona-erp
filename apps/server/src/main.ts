import { NestFactory } from '@nestjs/core';
import { DEFAULT_CLIENT_URL } from '@rona/config/client';
import { DEFAULT_PORT } from '@rona/config/server';
import type { Express, NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import { AppModule } from './modules/app/app.module';
import { loadEnv } from './configs/env';
import { NestPinoLogger } from './logger/nest-logger';
import { logger } from './logger';
import {
  createRequestContext,
  runWithRequestContext,
} from './context/request-context';
import { GLOBAL_PREFIX } from './configs/route';

const env = loadEnv();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new NestPinoLogger(),
  });

  app.enableCors({
    origin: env.CLIENT_URL ?? DEFAULT_CLIENT_URL,
    credentials: true,
  });

  app.use(cookieParser());

  const expressInstance = app.getHttpAdapter().getInstance() as Express;
  expressInstance.set('trust proxy', true);

  app.use((req: Request, res: Response, next: NextFunction) => {
    const context = createRequestContext(req, res);
    runWithRequestContext(context, () => next());
  });

  app.setGlobalPrefix(GLOBAL_PREFIX);

  app.enableShutdownHooks();

  await app.listen(env.PORT ?? DEFAULT_PORT);
  logger.info({ port: env.PORT ?? DEFAULT_PORT }, 'Rona API started');
}

bootstrap().catch((error) => {
  logger.error({ error }, 'Rona API failed to start');
  process.exit(1);
});
