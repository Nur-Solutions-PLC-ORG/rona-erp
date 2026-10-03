import { Injectable, Logger } from '@nestjs/common';
import {
  AI_DAILY_LIMIT_DEFAULT,
  AI_LIMIT_KEY_PREFIX,
  AI_LIMIT_WINDOW_SECONDS,
} from '@rona/config/ai';
import { redisClient } from '@/redis';
import { AiQuotaExhaustedException } from './ai.exception.js';

@Injectable()
export class AiLimitService {
  private readonly logger = new Logger(AiLimitService.name);

  private key(organizationId: string): string {
    return `${AI_LIMIT_KEY_PREFIX}${organizationId}`;
  }

  async consume(organizationId: string): Promise<void> {
    const key = this.key(organizationId);
    const script = `
local current = redis.call('GET', KEYS[1])
if not current then
  redis.call('SET', KEYS[1], ARGV[1], 'EX', ARGV[2])
  current = ARGV[1]
end
if tonumber(current) <= 0 then return -1 end
return redis.call('DECR', KEYS[1])`;

    let remaining: number;
    try {
      remaining = Number(
        await redisClient.eval<string[], number>(
          script,
          [key],
          [String(AI_DAILY_LIMIT_DEFAULT), String(AI_LIMIT_WINDOW_SECONDS)],
        ),
      );
    } catch (error) {
      this.logger.warn(
        `AI limiter unavailable, allowing request: ${String(error)}`,
      );
      return;
    }

    if (remaining < 0) {
      throw new AiQuotaExhaustedException(await this.safeTtl(organizationId));
    }
  }

  private async safeTtl(organizationId: string): Promise<number> {
    try {
      const ttl = await redisClient.ttl(this.key(organizationId));
      return ttl >= 0 ? Math.max(1, ttl) : AI_LIMIT_WINDOW_SECONDS;
    } catch {
      return AI_LIMIT_WINDOW_SECONDS;
    }
  }
}
