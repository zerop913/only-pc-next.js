import { NextRequest, NextResponse } from "next/server";
import { verifyCode } from "@/services/emailService";
import { loginUserByEmail } from "@/services/authService";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    console.log("Verifying code:", { email, code });

    const isValid = await verifyCode(email, code, request.nextUrl.origin);
    console.log("Code validation result:", isValid);

    if (!isValid) {
      return NextResponse.json(
        { error: "Неверный код подтверждения" },
        { status: 400 }
      );
    }

    // Пытаемся войти в систему по email (пароль уже проверен на этапе отправки кода)
    let authResult;
    try {
      authResult = await loginUserByEmail(email);
      console.log("Login successful for user:", authResult.user.email);
    } catch (loginError) {
      console.error("Login error:", loginError);
      return NextResponse.json(
        {
          error:
            loginError instanceof Error ? loginError.message : "Ошибка входа",
        },
        { status: 401 }
      );
    }

    const { user, token } = authResult;

    // lastLoginAt уже обновлен в функции loginUserByEmail

    // Создаем ответ
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

    // Устанавливаем cookie с токеном
    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60, // 7 дней в секундах
      path: "/",
      sameSite: "strict",
    });

    return response;
  } catch (error) {
    console.error("Error verifying code:", error);
    return NextResponse.json(
      { error: "Ошибка проверки кода" },
      { status: 500 }
    );
  }
}
