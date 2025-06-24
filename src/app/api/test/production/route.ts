import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const testType = searchParams.get("type") || "basic";

    const results = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      testType,
      baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
      hasRedis: !!process.env.REDIS_URL,
      hasResend: !!process.env.RESEND_API_KEY,
      tests: {} as any
    };

    // Базовая проверка переменных
    results.tests.environmentCheck = {
      nodeEnv: process.env.NODE_ENV,
      apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
      redisConfigured: !!process.env.REDIS_URL,
      resendConfigured: !!process.env.RESEND_API_KEY
    };

    // Проверка Redis если доступен
    if (process.env.REDIS_URL) {
      try {
        const { redis } = await import("@/lib/redis");
        const pingResult = await redis.ping();
        results.tests.redisCheck = {
          status: "success",
          ping: pingResult,
          connection: "OK"
        };
      } catch (redisError) {
        results.tests.redisCheck = {
          status: "error",
          error: redisError instanceof Error ? redisError.message : String(redisError)
        };
      }
    } else {
      results.tests.redisCheck = {
        status: "skipped",
        reason: "Redis URL not configured (will use in-memory fallback)"
      };
    }

    // Тест API маршрутизации
    if (testType === "full") {
      try {
        const { getApiUrl } = await import("@/utils/apiUtils");
        const testApiUrl = getApiUrl("/api/health");
        
        const response = await fetch(testApiUrl, {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        });

        results.tests.apiRoutingCheck = {
          status: response.ok ? "success" : "error",
          testUrl: testApiUrl,
          responseStatus: response.status,
          responseOk: response.ok
        };
      } catch (apiError) {
        results.tests.apiRoutingCheck = {
          status: "error",
          error: apiError instanceof Error ? apiError.message : String(apiError)
        };
      }
    }

    return NextResponse.json(results);

  } catch (error) {
    return NextResponse.json({
      error: "Test failed",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, email } = await request.json();

    if (action === "test-verification" && email) {
      // Тестируем полный цикл верификации
      const { getApiUrl } = await import("@/utils/apiUtils");
      const emailApiUrl = getApiUrl("/api/email");

      // 1. Отправляем код
      const sendResponse = await fetch(emailApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const sendResult = await sendResponse.json();

      // 2. Пробуем получить код (для теста)
      const testCode = sendResult.codeForDebug || "123456";
      const verifyResponse = await fetch(emailApiUrl, {
        method: "PUT", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: testCode })
      });

      const verifyResult = await verifyResponse.json();

      return NextResponse.json({
        testType: "verification-flow",
        email,
        sendEmail: {
          status: sendResponse.status,
          success: sendResponse.ok,
          result: sendResult
        },
        verifyCode: {
          status: verifyResponse.status,
          success: verifyResponse.ok,
          result: verifyResult,
          testCode
        },
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      error: "Invalid action. Use: test-verification with email"
    }, { status: 400 });

  } catch (error) {
    return NextResponse.json({
      error: "Test failed",
      details: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
