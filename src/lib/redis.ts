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
      setex: async () => null,
      del: async () => null,
      ping: async () => "PONG",
    } as unknown as Redis;
  }

  // Мы на сервере, создаем пул соединений Redis
  const globalForRedis = globalThis as unknown as {
    redis: Redis | undefined;
    redisPool: Redis[] | undefined;
  };

  if (!globalForRedis.redisPool) {
    console.log("[Redis] Creating new Redis connection pool");
    try {      const redisInstances = Array.from(
        { length: REDIS_CONNECTION_POOL_SIZE },
        (_, index) => {
          const instance = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
            maxRetriesPerRequest: 2,
            enableReadyCheck: false,
            retryStrategy(times) {
              // Ограничиваем количество попыток переподключения
              if (times > 2) {
                console.log(`[Redis] Max retries reached for instance ${index}`);
                return null;
              }
              const delay = Math.min(times * 1000, 3000);
              return delay;
            },
            lazyConnect: true,
            connectTimeout: 10000, // 10 секунд таймаут
            commandTimeout: 5000, // 5 секунд на команду
            keepAlive: 30000, // 30 секунд keep-alive
            family: 4, // Используем IPv4
            enableOfflineQueue: false, // Отключаем очередь офлайн команд
          });

          // Добавляем обработчики ошибок для каждого экземпляра
          instance.on('error', (error) => {
            console.error(`[Redis] Instance ${index} error:`, error.message);
            // Не выбрасываем ошибку, просто логируем
          });

          instance.on('connect', () => {
            console.log(`[Redis] Instance ${index} connected`);
          });

          instance.on('ready', () => {
            console.log(`[Redis] Instance ${index} ready`);
          });

          instance.on('close', () => {
            console.log(`[Redis] Instance ${index} connection closed`);
          });

          instance.on('reconnecting', () => {
            console.log(`[Redis] Instance ${index} reconnecting...`);
          });

          return instance;
        }
      );
      
      globalForRedis.redisPool = redisInstances;

      // Используем первое соединение как основное
      globalForRedis.redis = globalForRedis.redisPool[0];
      console.log("[Redis] Redis connection pool created successfully");
    } catch (error) {
      console.error("[Redis] Failed to create Redis connection pool:", error);
      // Возвращаем заглушку в случае ошибки
      return {
        get: async () => null,
        set: async () => null,
        setex: async () => null,
        del: async () => null,
        ping: async () => "PONG",
      } as unknown as Redis;
    }
  }
  // Возвращаем случайное соединение из пула с обработкой ошибок
  try {
    const instance = globalForRedis.redisPool![
      Math.floor(Math.random() * REDIS_CONNECTION_POOL_SIZE)
    ];
    
    // Создаем обертку для безопасного использования Redis
    return new Proxy(instance, {
      get(target, prop) {
        const originalMethod = target[prop as keyof Redis];
        if (typeof originalMethod === 'function') {
          return async (...args: any[]) => {
            try {
              return await (originalMethod as any).apply(target, args);
            } catch (error) {
              console.error(`[Redis] Command ${String(prop)} failed:`, (error as Error).message);
              // Возвращаем null для get операций, иначе null
              return prop === 'get' ? null : null;
            }
          };
        }
        return originalMethod;
      }
    });
  } catch (error) {
    console.error("[Redis] Error getting Redis instance:", error);
    return {
      get: async () => null,
      set: async () => null,
      setex: async () => null,
      del: async () => null,
      ping: async () => "PONG",
    } as unknown as Redis;
  }
};

export const redis = getRedisInstance();
