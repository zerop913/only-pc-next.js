import { Redis } from "ioredis";
import IORedis from "ioredis";

const REDIS_CONNECTION_POOL_SIZE = 5;

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

  // Мы на сервере, создаем пул соединений Redis
  const globalForRedis = globalThis as unknown as {
    redis: Redis | undefined;
    redisPool: Redis[] | undefined;
  };

  if (!globalForRedis.redisPool) {
    globalForRedis.redisPool = Array.from(
      { length: REDIS_CONNECTION_POOL_SIZE },
      () =>
        new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
          maxRetriesPerRequest: 3,
          enableReadyCheck: false,
          retryStrategy(times) {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
        })
    );

    // Используем первое соединение как основное
    globalForRedis.redis = globalForRedis.redisPool[0];
  }

  // Возвращаем случайное соединение из пула
  return globalForRedis.redisPool[
    Math.floor(Math.random() * REDIS_CONNECTION_POOL_SIZE)
  ];
};

export const redis = getRedisInstance();
