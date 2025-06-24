import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET(request: NextRequest) {
  try {
    console.log("[Redis Status] Checking Redis status...");
    
    // Попробуем выполнить несколько команд
    const pingResult = await redis.ping();
    console.log("[Redis Status] Ping result:", pingResult);
    
    // Тест простой записи и чтения
    const testKey = 'health_check';
    const testValue = Date.now().toString();
    
    await redis.setex(testKey, 30, testValue);
    const retrievedValue = await redis.get(testKey);
    await redis.del(testKey);
    
    const isWorking = retrievedValue === testValue;
    
    return NextResponse.json({
      redis: {
        status: isWorking ? 'working' : 'failed',
        ping: pingResult,
        writeTest: isWorking,
        timestamp: new Date().toISOString()
      },
      environment: process.env.NODE_ENV,
      hasRedisUrl: !!process.env.REDIS_URL
    });
    
  } catch (error: any) {
    console.error("[Redis Status] Error:", error);
    return NextResponse.json({
      redis: {
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      },
      environment: process.env.NODE_ENV,
      hasRedisUrl: !!process.env.REDIS_URL
    }, { status: 500 });
  }
}
