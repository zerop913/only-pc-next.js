import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "@/services/authService";
import { sendVerificationCode } from "@/services/emailService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Проверяем капчу
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

    // Регистрируем пользователя
    const { user } = await registerUser(body);

    // После успешной регистрации отправляем код подтверждения
    await sendVerificationCode(user.email, request.nextUrl.origin);

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          roleId: user.roleId,
        },
        message: "Регистрация успешна, проверьте почту для подтверждения",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка регистрации" },
      { status: 400 }
    );
  }
}
