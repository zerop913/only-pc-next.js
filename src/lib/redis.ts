import { Redis } from "ioredis";

// Используем Redis только на стороне сервера
const getRedisInstance = () => {
  // Если мы на клиенте, возвращаем заглушку
  if (typeof window !== "undefined") {
    return {
      get: async () => null,
      set: async () => null,
      del: async () => null,
    } as unknown as Redis;
  }

  // Мы на сервере, создаем реальный экземпляр Redis
  const globalForRedis = globalThis as unknown as {
    redis: Redis | undefined;
  };

  if (!globalForRedis.redis) {
    globalForRedis.redis = new Redis(
      process.env.REDIS_URL || "redis://localhost:6379"
    );
  }

  return globalForRedis.redis;
};

export const redis = getRedisInstance();
