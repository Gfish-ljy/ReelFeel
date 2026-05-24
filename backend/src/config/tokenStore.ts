import Redis from 'ioredis';
import { env } from './env.js';

export const REFRESH_PREFIX = 'refresh:';

const memory = new Map<string, { token: string; expires: number }>();

export const redis = new Redis(env.redisUrl, {
  maxRetriesPerRequest: 1,
  retryStrategy: () => null,
  lazyConnect: true,
});

let redisReady = false;

redis.on('ready', () => {
  redisReady = true;
});

redis.on('error', () => {
  redisReady = false;
});

redis.connect().catch(() => {
  redisReady = false;
  console.warn('[tokenStore] Redis 不可用，Refresh Token 将使用内存存储（仅适合本地开发）');
});

function memorySet(key: string, token: string, ttlSeconds: number) {
  memory.set(key, { token, expires: Date.now() + ttlSeconds * 1000 });
}

function memoryGet(key: string): string | null {
  const entry = memory.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    memory.delete(key);
    return null;
  }
  return entry.token;
}

export async function setRefreshToken(userId: string, token: string, ttlSeconds: number) {
  const key = `${REFRESH_PREFIX}${userId}`;
  if (redisReady) {
    try {
      await redis.setex(key, ttlSeconds, token);
      return;
    } catch {
      redisReady = false;
    }
  }
  memorySet(key, token, ttlSeconds);
}

export async function getRefreshToken(userId: string): Promise<string | null> {
  const key = `${REFRESH_PREFIX}${userId}`;
  if (redisReady) {
    try {
      return await redis.get(key);
    } catch {
      redisReady = false;
    }
  }
  return memoryGet(key);
}

export async function deleteRefreshToken(userId: string) {
  const key = `${REFRESH_PREFIX}${userId}`;
  memory.delete(key);
  if (redisReady) {
    try {
      await redis.del(key);
    } catch {
      redisReady = false;
    }
  }
}
