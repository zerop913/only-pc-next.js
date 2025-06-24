import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET(request: NextRequest) {
  const results = {
    redisTest: null as any,
    environment: process.env.NODE_ENV,
    hasRedisUrl: !!process.env.REDIS_URL,
    redisUrlMasked: process.env.REDIS_URL ? process.env.REDIS_URL.replace(/:[^:@]*@/, ':***@') : 'Not set',
  };

  try {
    console.log("[Redis Test] Starting Redis connection test");
    
    // Тест ping
    console.log("[Redis Test] Testing ping...");
    const pingResult = await redis.ping();
    console.log("[Redis Test] Ping result:", pingResult);
    
    // Тест записи и чтения
    const testKey = `test:${Date.now()}`;
    const testValue = `test-value-${Math.random()}`;
    
    console.log("[Redis Test] Setting test key:", testKey, "with value:", testValue);
    
    // Пробуем разные способы записи
    let setResult;
    try {
      setResult = await redis.setex(testKey, 60, testValue); // TTL 60 секунд
      console.log("[Redis Test] SETEX result:", setResult);
    } catch (setError) {
      console.log("[Redis Test] SETEX failed, trying SET with EX:", setError);
      setResult = await redis.set(testKey, testValue, "EX", 60);
      console.log("[Redis Test] SET EX result:", setResult);
    }
    
    // Небольшая задержка
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log("[Redis Test] Getting test key:", testKey);
    const retrievedValue = await redis.get(testKey);
    console.log("[Redis Test] Retrieved value:", retrievedValue);
    
    console.log("[Redis Test] Deleting test key:", testKey);
    const delResult = await redis.del(testKey);
    console.log("[Redis Test] Delete result:", delResult);
    
    results.redisTest = {
      ping: pingResult,
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
