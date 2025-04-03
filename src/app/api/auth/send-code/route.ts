import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Проверяем существование пользователя
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return NextResponse.json(
        { error: "Пользователь с таким email не найден" },
        { status: 404 }
      );
    }

    // Вызываем API для отправки кода
    const response = await fetch(`${request.nextUrl.origin}/api/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Ошибка отправки кода подтверждения");
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error sending verification code:", error);
    return NextResponse.json(
      { error: `Ошибка отправки кода подтверждения: ${error.message}` },
      { status: 500 }
    );
  }
}
