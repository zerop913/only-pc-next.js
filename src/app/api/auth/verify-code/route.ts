import { NextRequest, NextResponse } from "next/server";
import { verifyCode } from "@/services/emailService";
import { loginUserByEmail } from "@/services/authService";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    console.log("POST /api/auth/verify-code - Verifying code:", {
      email,
      code,
      codeType: typeof code,
      codeLength: code?.length,
    });

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email или код не предоставлены" },
        { status: 400 }
      );
    }

    // Проверяем код
    const isValid = await verifyCode(email, code, request.nextUrl.origin);
    console.log("Code validation result:", isValid);

    if (!isValid) {
      console.error("Code verification failed for email:", email);
      return NextResponse.json(
        { error: "Неверный код подтверждения" },
        { status: 400 }
      );
    }

    // Проверяем, что пользователь существует в базе данных
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!existingUser) {
      console.error("User not found in database:", email);
      return NextResponse.json(
        { error: "Пользователь не найден" },
        { status: 404 }
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

    console.log("Verification and login completed successfully for:", email);
    return response;
  } catch (error) {
    console.error("Error in verify-code API:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Ошибка проверки кода",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}
