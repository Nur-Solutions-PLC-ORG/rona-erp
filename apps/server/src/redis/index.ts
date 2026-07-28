import { Redis } from '@upstash/redis';

// initializing redisClient client
export const redisClient = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
