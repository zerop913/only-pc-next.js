import { NextRequest, NextResponse } from "next/server";
import { loginUser } from "@/services/authService";

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
      maxAge: 24 * 60 * 60, // 24 часа в секундах
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
