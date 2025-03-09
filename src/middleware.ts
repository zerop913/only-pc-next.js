import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Middleware для проверки авторизации и перенаправления
export async function middleware(request: NextRequest) {
  // Маршруты, доступные только для неавторизованных пользователей
  const publicAuthPaths = ["/login", "/register"];
  // Маршруты, требующие авторизации
  const protectedPaths = ["/profile", "/admin"];
  // Добавляем маршрут /logout для обработки
  const specialPaths = ["/logout"];

  const token = request.cookies.get("token")?.value;
  const path = request.nextUrl.pathname;

  // Проверяем, является ли текущий путь маршрутом для неавторизованных пользователей
  const isPublicAuthRoute = publicAuthPaths.includes(path);
  // Проверяем, является ли текущий путь защищенным маршрутом
  const isProtectedRoute = protectedPaths.some((route) =>
    path.startsWith(route)
  );
  // Проверяем, является ли текущий путь специальным маршрутом
  const isSpecialPath = specialPaths.includes(path);

  // Обработка маршрута /logout
  if (path === "/logout") {
    // Если пользователь авторизован, перенаправляем на API для выхода
    // В противном случае перенаправляем на страницу входа
    return NextResponse.redirect(new URL("/api/auth/logout", request.url));
  }

  // Если пользователь авторизован и пытается зайти на страницу входа/регистрации
  if (isPublicAuthRoute && token) {
    try {
      // Проверяем валидность токена
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || "default_secret"
      );
      await jwtVerify(token, secret);

      return NextResponse.redirect(new URL("/", request.url));
    } catch (error) {
      console.error("Auth middleware error:", error);
      // В случае ошибки разрешаем доступ к маршрутам входа/регистрации
    }
  }

  // Если пользователь пытается зайти на защищенный маршрут без авторизации
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// Конфигурация путей для middleware
export const config = {
  matcher: [
    "/login",
    "/register",
    "/logout",
    "/profile/:path*",
    "/admin/:path*",
  ],
};
