import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { db } from '@/db';
import { authCodes, users } from '@/db/schemas/auth';
import { eq } from 'drizzle-orm';
import {
  sendTelegramMessageToChat,
  telegramCodeMessage,
} from '@/emails/telegram';

const DEFAULT_BOT_USERNAME = 'ronaerpbot';

interface TelegramUpdate {
  update_id: number;
  message?: {
    chat?: { id: number; type?: string };
    text?: string;
  };
}

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private botUsername = DEFAULT_BOT_USERNAME;
  private pollTimer: NodeJS.Timeout | undefined;
  private pollOffset = 0;
  private polling = false;

  async onModuleInit() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return;

    await this.refreshBotUsername();

    const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
    if (webhookUrl) {
      await this.registerWebhook(webhookUrl);
    } else {
      this.startPolling();
    }
  }

  private get botToken(): string | undefined {
    return process.env.TELEGRAM_BOT_TOKEN;
  }

  private async refreshBotUsername() {
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.botToken}/getMe`,
      );
      const data = (await response.json()) as {
        ok: boolean;
        result?: { username?: string };
      };
      if (data.ok && data.result?.username) {
        this.botUsername = data.result.username;
      }
    } catch (error) {
      this.logger.warn(`Telegram getMe failed: ${String(error)}`);
    }
  }

  private async registerWebhook(url: string) {
    try {
      const body: Record<string, string> = { url };
      const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
      if (secret) body.secret_token = secret;

      const response = await fetch(
        `https://api.telegram.org/bot${this.botToken}/setWebhook`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
      const data = (await response.json()) as { ok: boolean };
      this.logger.log(
        `Telegram webhook ${data.ok ? 'registered' : 'registration failed'} for ${url}`,
      );
    } catch (error) {
      this.logger.warn(`Telegram setWebhook failed: ${String(error)}`);
    }
  }

  private startPolling() {
    this.pollTimer = setInterval(() => void this.pollOnce(), 5000);
    this.logger.log('Telegram polling started (no webhook URL configured)');
  }

  private async pollOnce() {
    if (this.polling || !this.botToken) return;
    this.polling = true;
    try {
      const response = await fetch(
        `https://api.telegram.org/bot${this.botToken}/getUpdates`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            offset: this.pollOffset,
            timeout: 5,
          }),
        },
      );
      const data = (await response.json()) as {
        ok: boolean;
        result?: TelegramUpdate[];
      };
      if (data.ok && data.result?.length) {
        for (const update of data.result) {
          this.pollOffset = Math.max(this.pollOffset, update.update_id + 1);
          await this.handleUpdate(update);
        }
      }
    } catch (error) {
      this.logger.warn(`Telegram poll failed: ${String(error)}`);
    } finally {
      this.polling = false;
    }
  }

  async handleUpdate(update: TelegramUpdate) {
    const message = update.message;
    if (!message?.text || message.chat?.type !== 'private') return;

    const chatId = String(message.chat.id);
    const parts = message.text.trim().split(/\s+/);
    const command = parts[0];
    const payload = parts[1];

    if (command !== '/start') return;

    if (!payload) {
      await sendTelegramMessageToChat(
        chatId,
        'Welcome to Rona ERP! To receive your one-time codes here, open a Reset or Verify link from the app and press Start.',
      );
      return;
    }

    if (payload.startsWith('code_')) {
      await this.handleCodeToken(chatId, payload.slice('code_'.length));
      return;
    }

    if (payload.startsWith('bind_')) {
      const email = decodeURIComponent(payload.slice('bind_'.length));
      await this.handleBind(chatId, email);
      return;
    }

    await sendTelegramMessageToChat(
      chatId,
      'Welcome to Rona ERP! To receive your one-time codes here, open a Reset or Verify link from the app and press Start.',
    );
  }

  private async handleCodeToken(chatId: string, token: string) {
    const [row] = await db
      .select({
        email: authCodes.email,
        code: authCodes.code,
        purpose: authCodes.purpose,
        expiresAt: authCodes.expiresAt,
      })
      .from(authCodes)
      .where(eq(authCodes.telegramToken, token))
      .limit(1);

    if (!row) {
      await sendTelegramMessageToChat(
        chatId,
        'This link is invalid or has already been used. Please request a new code from the app.',
      );
      return;
    }

    if (row.expiresAt.getTime() < Date.now()) {
      await db.delete(authCodes).where(eq(authCodes.telegramToken, token));
      await sendTelegramMessageToChat(
        chatId,
        'This code has expired. Please request a new one from the app.',
      );
      return;
    }

    await db
      .update(authCodes)
      .set({ telegramChatId: chatId })
      .where(eq(authCodes.telegramToken, token));

    await db
      .update(users)
      .set({ telegramChatId: chatId })
      .where(eq(users.email, row.email));

    const purpose = row.purpose === 'reset' ? 'reset' : 'login';
    await sendTelegramMessageToChat(
      chatId,
      telegramCodeMessage(row.code, purpose),
    );
  }

  private async handleBind(chatId: string, email: string) {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      await sendTelegramMessageToChat(
        chatId,
        'No Rona ERP account matches that email. Please check the link from the app and try again.',
      );
      return;
    }

    await db
      .update(users)
      .set({ telegramChatId: chatId })
      .where(eq(users.id, user.id));

    await sendTelegramMessageToChat(
      chatId,
      'Your Rona ERP account is now linked to this Telegram chat. Future codes will be sent here automatically.',
    );
  }

  isConfigured(): boolean {
    return Boolean(process.env.TELEGRAM_BOT_TOKEN);
  }

  getTelegramUrl(payload: string): string {
    return `https://t.me/${this.botUsername}?start=${payload}`;
  }

  async sendCodeToChat(
    chatId: string | number,
    code: string,
    purpose: 'login' | 'reset',
  ) {
    return sendTelegramMessageToChat(
      chatId,
      telegramCodeMessage(code, purpose),
    );
  }
}
