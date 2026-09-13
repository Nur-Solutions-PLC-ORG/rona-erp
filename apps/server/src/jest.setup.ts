process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  'postgresql://postgres:postgres@localhost:5432/rona_test';
process.env.JWT_SECRET =
  process.env.JWT_SECRET ?? 'test-jwt-secret-value-at-least-16-chars';
process.env.UPSTASH_REDIS_REST_URL =
  process.env.UPSTASH_REDIS_REST_URL ?? 'https://localhost:6379';
process.env.UPSTASH_REDIS_REST_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN ?? 'test-redis-token';
