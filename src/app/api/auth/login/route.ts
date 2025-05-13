import { NextRequest, NextResponse } from "next/server";
import { loginUser } from "@/services/authService";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Сначала проверяем каптчу через серверный API
    const captchaResponse = await fetch(
      `https://www.google.com/recaptcha/api/siteverify?secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${body.captchaToken}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const captchaData = await captchaResponse.json();

    if (!captchaData.success) {
      return NextResponse.json(
        { error: "Проверка на робота не пройдена. Попробуйте еще раз." },
        { status: 400 }
      );
    }

    // Если каптча прошла проверку, продолжаем процесс входа
    const { user, token } = await loginUser(body);

    if (!user.isActive) {
      return NextResponse.json(
        { error: "Аккаунт деактивирован. Обратитесь к администратору." },
        { status: 403 }
      );
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { updatedAt: true },
    });

    await db
      .update(users)
      .set({
        lastLoginAt: new Date().toISOString(),
        updatedAt: currentUser?.updatedAt,
      })
      .where(eq(users.id, user.id));

    // Устанавливаем токен в cookie с помощью NextResponse
    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          roleId: user.roleId,
        },
      },
      { status: 200 }
    );

    // Добавляем cookie в ответ
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60, // 7 дней в секундах
      path: "/",
      sameSite: "strict", // Повышаем безопасность
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
