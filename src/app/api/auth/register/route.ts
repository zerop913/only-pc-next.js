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

    try {
      const origin =
        process.env.NEXT_PUBLIC_API_BASE_URL || request.nextUrl.origin;
      console.log(
        "Sending verification code after registration, using origin:",
        origin
      );

      await sendVerificationCode(user.email, origin);

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
    } catch (emailError) {
      console.error("Error sending verification email:", emailError);
      // Даже если отправка письма не удалась, считаем регистрацию успешной
      return NextResponse.json(
        {
          user: {
            id: user.id,
            email: user.email,
            roleId: user.roleId,
          },
          message:
            "Регистрация успешна, но возникла проблема с отправкой письма. Попробуйте войти в систему.",
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Ошибка регистрации" },
      { status: 400 }
    );
  }
}
