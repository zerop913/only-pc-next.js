import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

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

    // Проверяем пароль перед отправкой кода
    if (password) {
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
      }
    } else {
      return NextResponse.json({ error: "Пароль не указан" }, { status: 400 });
    } // Вызываем API для отправки кода с использованием относительного пути
    const response = await fetch(`/api/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
      ...(typeof window === "undefined"
        ? {
            baseURL:
              process.env.NEXT_PUBLIC_API_BASE_URL || request.nextUrl.origin,
          }
        : {}),
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
