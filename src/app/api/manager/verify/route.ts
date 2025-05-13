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

      if (!payload || (payload as any).roleId !== 3) {
        console.log("Debug: Invalid role:", (payload as any).roleId);
        return NextResponse.json(
          { error: "Недостаточно прав" },
          { status: 403 }
        );
      }

      const { password } = await request.json();
      console.log("Debug: Received password attempt:", password);

      const managerPassword =
        process.env.MANAGER_ACCESS_PASSWORD || "manager123";
      console.log("Debug: ENV password:", managerPassword);

      if (!password) {
        return NextResponse.json(
          { error: "Пароль не предоставлен" },
          { status: 400 }
        );
      }

      // Убираем пробелы и сравниваем
      const normalizedPassword = password.trim();
      const normalizedManagerPassword = managerPassword.trim();

      if (normalizedPassword !== normalizedManagerPassword) {
        console.log("Debug: Password mismatch");
        console.log("Debug: Normalized received:", normalizedPassword);
        console.log("Debug: Normalized expected:", normalizedManagerPassword);
        return NextResponse.json(
          { error: "Неверный пароль доступа" },
          { status: 403 }
        );
      }

      console.log("Debug: Password verified successfully");
      const response = NextResponse.json({ success: true });

      response.cookies.set({
        name: "manager_access",
        value: "true",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60,
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
