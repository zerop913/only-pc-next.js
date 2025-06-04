import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";
import { logoutUser } from "@/services/authService";

export async function POST(request: NextRequest) {
  return handleLogout(request);
}

export async function GET(request: NextRequest) {
  return handleLogout(request);
}

// Общая функция для обработки выхода из системы
async function handleLogout(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;

    if (token) {
      try {
        // Расшифровываем токен
        const decoded = verify(
          token,
          process.env.JWT_SECRET || "default_secret"
        ) as { userId: number };

        // Удаляем пользователя из кеша
        await logoutUser(decoded.userId);
      } catch (error) {
        console.error("Error decoding token during logout:", error);
      }
    } // Создаем ответ с перенаправлением на страницу входа
    // Используем абсолютный URL с origin из переменной окружения или из запроса
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || request.nextUrl.origin;
    const loginUrl = `${baseUrl}/login`.replace(/([^:])\/\/+/g, "$1/");

    console.log("Redirecting to login URL:", loginUrl);
    const response = NextResponse.redirect(loginUrl);

    // Удаляем токен из cookie
    response.cookies.delete("token");

    return response;
  } catch (error) {
    console.error("Logout error:", error); // Даже в случае ошибки перенаправляем на страницу входа
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || request.nextUrl.origin;
    const loginUrl = `${baseUrl}/login`.replace(/([^:])\/\/+/g, "$1/");

    console.log("Error logout, redirecting to:", loginUrl);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("token");
    return response;
  }
}
