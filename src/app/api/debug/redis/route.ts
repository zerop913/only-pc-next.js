import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET(request: NextRequest) {
  // Только для development режима
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  try {
    // Тестируем подключение к Redis
    const pingResult = await redis.ping();

    // Получаем список всех ключей
    const keys = await redis.keys("email_verification:*");

    // Получаем информацию о каждом ключе
    const keysInfo = [];
    for (const key of keys) {
      const value = await redis.get(key);
      const ttl = await redis.ttl(key);
      keysInfo.push({
        key,
        value,
        ttl: ttl > 0 ? ttl : "expired",
      });
    }

    return NextResponse.json({
      redisStatus: "OK",
      ping: pingResult,
      totalKeys: keys.length,
      keys: keysInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Redis debug error:", error);
    return NextResponse.json(
      {
        redisStatus: "ERROR",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Только для development режима
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  try {
    const { action, email, code } = await request.json();

    if (action === "set" && email && code) {
      // Устанавливаем тестовый код
      await redis.set(`email_verification:${email}`, code, "EX", 300);
      const savedCode = await redis.get(`email_verification:${email}`);

      return NextResponse.json({
        message: "Test code set",
        email,
        originalCode: code,
        savedCode,
        match: String(code) === String(savedCode),
      });
    }

    if (action === "get" && email) {
      // Получаем код для email
      const storedCode = await redis.get(`email_verification:${email}`);
      const ttl = await redis.ttl(`email_verification:${email}`);

      return NextResponse.json({
        email,
        storedCode,
        ttl: ttl > 0 ? ttl : "expired",
      });
    }

    if (action === "clear") {
      // Очищаем все коды верификации
      const keys = await redis.keys("email_verification:*");
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return NextResponse.json({
        message: "All verification codes cleared",
        clearedCount: keys.length,
      });
    }

    return NextResponse.json(
      {
        error: "Invalid action. Use 'set', 'get', or 'clear'",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Redis debug operation error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
