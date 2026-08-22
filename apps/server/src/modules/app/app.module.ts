import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AppController } from './app.controller';
import { LoggerMiddleware } from './middlewares/logger.middleware';
import { AppService } from './app.service';
import { AdminModule } from '../admin/admin.module';
import { RouterModule } from '@nestjs/core';
import { UsersModule } from '../features/admin/users/users.module';

@Module({
  imports: [
    AuthModule,
    AdminModule,
    RouterModule.register([
      {
        path: 'admin',
        module: AdminModule,
        children: [
          {
            path: 'users',
            module: UsersModule,
          },
        ],
      },
    ]),
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
