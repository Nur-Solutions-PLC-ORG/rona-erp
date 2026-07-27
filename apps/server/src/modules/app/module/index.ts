import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from '../controller';
import { AppService } from '../service';
import { LoggerMiddleware } from '../middleware/logger';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
