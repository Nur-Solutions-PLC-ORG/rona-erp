import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthModule } from '../../auth/module/auth.module';
import { AppController } from '../controllers/app.controller';
import { LoggerMiddleware } from '../middlewares/logger.middleware';
import { AppService } from '../services/app.service';

@Module({
  imports: [AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
