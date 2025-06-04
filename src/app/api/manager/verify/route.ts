import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateAuthToken } from "@/services/authService";
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    console.log("Debug: Starting manager verification");

    if (!token) {
      console.log("Debug: No token found");
      return NextResponse.json(
        { error: "Необходима авторизация" },
        { status: 401 }
      );
    }

    try {
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || "default_secret"
      );
      const { payload } = await jwtVerify(token, secret);
      console.log("Debug: JWT payload:", payload);

      if (!payload) {
        console.log("Debug: No payload in token");
        return NextResponse.json(
          { error: "Недействительный токен" },
          { status: 401 }
        );
      }

      // Получаем актуальные данные пользователя из БД
      const user = await db.query.users.findFirst({
        where: eq(users.id, (payload as any).userId),
      });

      if (!user) {
        console.log("Debug: User not found in database");
        return NextResponse.json(
          { error: "Пользователь не найден" },
          { status: 404 }
        );
      }

      console.log("Debug: Database user role:", user.roleId);

      // Получаем пароль от менеджера
      const { password } = await request.json();
      console.log("Debug: Received password attempt");

      const managerPassword =
        process.env.MANAGER_ACCESS_PASSWORD || "manager123";

      if (!password) {
        return NextResponse.json(
          { error: "Пароль не предоставлен" },
          { status: 400 }
        );
      }

      // Убираем пробелы и сравниваем
      const normalizedPassword = password.trim();
      const normalizedManagerPassword = managerPassword.trim();

      console.log("Debug: Comparing passwords:");
      console.log("Debug: Normalized received:", normalizedPassword);
      console.log(
        "Debug: Manager password from env:",
        process.env.MANAGER_ACCESS_PASSWORD
      );
      console.log("Debug: Default manager password:", "manager123");
      console.log(
        "Debug: Final manager password used:",
        normalizedManagerPassword
      );

      if (normalizedPassword !== normalizedManagerPassword) {
        console.log("Debug: Password mismatch");
        return NextResponse.json(
          { error: "Неверный пароль доступа" },
          { status: 401 }
        );
      }

      console.log("Debug: Password verified successfully");

      // Проверяем роль пользователя
      if (user.roleId !== 3) {
        console.log("Debug: User does not have manager role");
        return NextResponse.json(
          { error: "Недостаточно прав для доступа к панели менеджера" },
          { status: 403 }
        );
      }

      // Создаем новый токен с актуальной ролью, гарантируя boolean значение для isActive
      const newToken = generateAuthToken({
        id: user.id,
        email: user.email,
        roleId: user.roleId,
        isActive: user.isActive ?? true, // Используем true как значение по умолчанию, если isActive равно null
      });

      const response = NextResponse.json({ success: true });

      // Устанавливаем новый токен и cookie для доступа к панели менеджера
      response.cookies.set({
        name: "token",
        value: newToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/",
        sameSite: "lax",
      });

      response.cookies.set({
        name: "manager_access",
        value: "true",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60, // 1 hour
        path: "/",
        sameSite: "lax",
      });

      return response;
    } catch (jwtError) {
      console.error("Debug: JWT verification failed:", jwtError);
      return NextResponse.json(
        { error: "Недействительный токен" },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Debug: Manager verification error:", error);
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
