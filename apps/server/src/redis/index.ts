import { Redis } from '@upstash/redis';

export const redisClient = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<boolean> {
  try {
    const script = `
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
if current > tonumber(ARGV[2]) then
  return 0
end
return 1`;

    const allowed = await redisClient.eval<string[], number>(
      script,
      [key],
      [String(windowSeconds), String(limit)],
    );
    return allowed !== 0;
  } catch {
    return true;
  }
}
