import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = new URL(request.url).searchParams;
  const test = searchParams.get("test");

  // Простая проверка доступности
  const info = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    api_base_url: process.env.NEXT_PUBLIC_API_BASE_URL,
    has_redis_url: !!process.env.REDIS_URL,
    has_resend_key: !!process.env.RESEND_API_KEY,
    request_url: request.url,
    headers: {
      host: request.headers.get("host"),
      "x-forwarded-host": request.headers.get("x-forwarded-host"),
      "x-forwarded-proto": request.headers.get("x-forwarded-proto"),
    },
    server_status: "OK",
  };

  if (test === "error") {
    return NextResponse.json({ error: "Test error response" }, { status: 400 });
  }

  return NextResponse.json(info);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    return NextResponse.json({
      received: body,
      timestamp: new Date().toISOString(),
      status: "POST OK",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Invalid JSON",
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    );
  }
}
