import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DEFAULT_PORT } from '@rona/config';
import helmet from 'helmet';
import cors from 'cors';
import express from 'express';
import { Request, Response, NextFunction } from 'express';
import { PlatformSettingsService } from './platform-settings/platform-settings.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  }));

  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8000'],
    credentials: true, }));
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  const platformSettingsService = app.get(PlatformSettingsService);
  app.use(async (req: Request, res: Response, next: NextFunction) => {
    const isMaintenance = await platformSettingsService.isMaintenanceMode();
    if (isMaintenance) {
      const message = await platformSettingsService.getMaintenanceMessage();
      res.status(503).json({
        statusCode: 503,
        message,
        data: null,
      });
      return;
    }
    next();
  });

  if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
      if (!req.secure && req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect(301, `https://${req.headers.host}${req.url}`);
      }
      next();
    });
  }

  (app as any).set('trust proxy', 1);

  await app.listen(process.env.PORT ?? DEFAULT_PORT);
}
bootstrap();
