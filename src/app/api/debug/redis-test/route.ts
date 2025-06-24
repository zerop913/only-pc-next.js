import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import IORedis from "ioredis";

export async function GET(request: NextRequest) {
  const results = {
    redisTest: null as any,
    environment: process.env.NODE_ENV,
    hasRedisUrl: !!process.env.REDIS_URL,
    redisUrlMasked: process.env.REDIS_URL ? process.env.REDIS_URL.replace(/:[^:@]*@/, ':***@') : 'Not set',
  };

  try {
    console.log("[Redis Test] Starting Redis connection test");
    
    // Создаем отдельное подключение для тестирования
    const testRedis = new IORedis(process.env.REDIS_URL!, {
      tls: process.env.REDIS_URL?.includes('upstash.io') ? {} : undefined,
      connectTimeout: 15000,
      commandTimeout: 10000,
      lazyConnect: true,
    });
    
    // Тест ping с основным инстансом
    console.log("[Redis Test] Testing ping with main instance...");
    const mainPingResult = await redis.ping();
    console.log("[Redis Test] Main ping result:", mainPingResult);
    
    // Тест ping с тестовым инстансом
    console.log("[Redis Test] Testing ping with test instance...");
    const testPingResult = await testRedis.ping();
    console.log("[Redis Test] Test ping result:", testPingResult);
    
    // Тест записи и чтения с тестовым инстансом
    const testKey = `test:${Date.now()}`;
    const testValue = `test-value-${Math.random()}`;
    
    console.log("[Redis Test] Setting test key:", testKey, "with value:", testValue);
    
    const setResult = await testRedis.setex(testKey, 60, testValue);
    console.log("[Redis Test] SETEX result:", setResult);
    
    // Небольшая задержка
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log("[Redis Test] Getting test key:", testKey);
    const retrievedValue = await testRedis.get(testKey);
    console.log("[Redis Test] Retrieved value:", retrievedValue);
    
    console.log("[Redis Test] Deleting test key:", testKey);
    const delResult = await testRedis.del(testKey);
    console.log("[Redis Test] Delete result:", delResult);
    
    // Закрываем тестовое подключение
    await testRedis.disconnect();
    
    results.redisTest = {
      mainPing: mainPingResult,
      testPing: testPingResult,
      writeRead: {
        written: testValue,
        retrieved: retrievedValue,
        match: testValue === retrievedValue,
        setResult: setResult,
        delResult: delResult
      },
      success: true
    };
    
    console.log("[Redis Test] All tests completed");
    
  } catch (error: any) {
    console.error("[Redis Test] Error:", error);
    results.redisTest = {
      error: error.message,
      stack: error.stack,
      success: false
    };
  }

  return NextResponse.json(results, { 
    status: results.redisTest?.success ? 200 : 500 
  });
}
