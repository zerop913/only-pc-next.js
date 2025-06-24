import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams;
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      {
        error: "Email parameter required",
        example: "/api/test/verification?email=test@example.com",
      },
      { status: 400 }
    );
  }

  try {
    // Тестируем прямой вызов API email
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
    const apiUrl = `${baseUrl}/api/email`;

    console.log(`[Test] Testing verification for ${email} using ${apiUrl}`);

    // Сначала попробуем получить код (если есть)
    const getResponse = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, code: "000000" }), // тестовый код
    });

    const getResult = await getResponse.json();

    // Теперь отправим новый код
    const sendResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const sendResult = await sendResponse.json();

    return NextResponse.json({
      email,
      apiUrl,
      baseUrl,
      environment: process.env.NODE_ENV,
      testCodeCheck: {
        status: getResponse.status,
        result: getResult,
      },
      sendNewCode: {
        status: sendResponse.status,
        result: sendResult,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Test] Verification test failed:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
        email,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        {
          error: "Email and code required",
        },
        { status: 400 }
      );
    }

    // Тестируем верификацию
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
    const apiUrl = `${baseUrl}/api/email`;

    console.log(
      `[Test] Testing code verification for ${email} using ${apiUrl}`
    );

    const response = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, code }),
    });

    const result = await response.json();

    return NextResponse.json({
      email,
      code,
      apiUrl,
      baseUrl,
      verification: {
        status: response.status,
        success: response.ok,
        result,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Test] Code verification test failed:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
