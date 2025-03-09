import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/services/authService";

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

    // Если каптча прошла проверку, продолжаем процесс регистрации
    const { user } = await registerUser(body);

    // Проверяем, что roleId не null
    if (user.roleId === null) {
      return NextResponse.json(
        { error: "Не удалось назначить роль пользователю" },
        { status: 500 }
      );
    }

    // Возвращаем только безопасные данные пользователя
    const safeUser = {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
    };

    return NextResponse.json(
      { user: safeUser, message: "Регистрация успешна" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
