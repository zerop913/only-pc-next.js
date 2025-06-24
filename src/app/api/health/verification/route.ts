import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { getInMemoryStorage } from "@/lib/inMemoryStorage";

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    let result = {
      email,
      redisAvailable: false,
      inMemoryStats: null as any,
      storedCode: null as string | null,
      ttl: null as number | string | null,
      source: null as string | null,
      timestamp: new Date().toISOString(),
    };

    // Попробуем Redis
    try {
      await redis.ping();
      result.redisAvailable = true;

      const code = await redis.get(`email_verification:${email}`);
      const ttl = await redis.ttl(`email_verification:${email}`);

      result.storedCode = code;
      result.ttl = ttl > 0 ? ttl : "expired";
      result.source = "redis";
    } catch (redisError) {
      console.log("Redis not available, checking in-memory storage");
      result.redisAvailable = false;

      // Проверяем in-memory storage
      const inMemory = getInMemoryStorage();
      const code = await inMemory.get(email);
      const stats = inMemory.getStats();

      result.storedCode = code;
      result.source = "in-memory";
      result.inMemoryStats = stats;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Health check error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, email, code } = await request.json();

    if (action === "test-flow" && email) {
      // Тестируем полный поток верификации
      const testCode = Math.floor(100000 + Math.random() * 900000).toString();

      let setResult, getResult, deleteResult;

      try {
        // Тестируем сохранение
        const setResponse = await fetch(new URL("/api/email", request.url), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        setResult = {
          status: setResponse.status,
          ok: setResponse.ok,
          data: await setResponse.json(),
        };

        // Ждем немного
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Тестируем получение с неправильным кодом
        const wrongVerifyResponse = await fetch(
          new URL("/api/email", request.url),
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, code: "000000" }),
          }
        );

        const wrongResult = {
          status: wrongVerifyResponse.status,
          ok: wrongVerifyResponse.ok,
          data: await wrongVerifyResponse.json(),
        };

        return NextResponse.json({
          testFlow: "completed",
          email,
          results: {
            codeGeneration: setResult,
            wrongCodeVerification: wrongResult,
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        return NextResponse.json({
          testFlow: "failed",
          email,
          error: error instanceof Error ? error.message : String(error),
          partialResults: { setResult, getResult, deleteResult },
          timestamp: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json(
      {
        error: "Invalid action. Use 'test-flow' with email parameter",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Health check POST error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
