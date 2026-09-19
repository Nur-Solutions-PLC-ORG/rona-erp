import {
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { TelegramService } from './telegram.service';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('webhook')
  async webhook(
    @Body() update: Record<string, any>,
    @Headers('x-telegram-bot-api-secret-token')
    secretToken: string | undefined,
  ) {
    const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (expectedSecret && secretToken !== expectedSecret) {
      throw new UnauthorizedException();
    }

    await this.telegramService.handleUpdate(update as never);
    return { ok: true };
  }
}
