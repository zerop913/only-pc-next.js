import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Middleware для проверки авторизации и перенаправления
export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (token) {
    try {
      // При каждой проверке токена обновляем lastLoginAt
      const response = await fetch(
        `${request.nextUrl.origin}/api/auth/update-last-login`,
        {
          method: "POST",
          headers: {
            Cookie: `token=${token}`,
          },
        }
      );
    } catch (error) {
      console.error("Error updating last login:", error);
    }
  }

  // Маршруты, доступные только для неавторизованных пользователей
  const publicAuthPaths = ["/login", "/register"];
  // Маршруты, требующие авторизации
  const protectedPaths = ["/profile", "/admin", "/manager"];
  // Добавляем маршрут /logout для обработки
  const specialPaths = ["/logout"];

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

  // Обработка админ-маршрутов
  if (path.startsWith("/admin")) {
    try {
      if (!token) {
        return NextResponse.redirect(new URL("/login", request.url));
      }

      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || "default_secret"
      );
      const { payload } = await jwtVerify(token, secret);

      // Проверяем роль администратора
      if ((payload as any).roleId !== 1) {
        return NextResponse.redirect(new URL("/", request.url));
      }

      // Проверяем наличие admin_access cookie для защищенных маршрутов
      const adminAccess = request.cookies.get("admin_access")?.value;
      if (!adminAccess && path !== "/admin/verify") {
        return NextResponse.redirect(new URL("/profile", request.url));
      }

      return NextResponse.next();
    } catch (error) {
      console.error("Admin middleware error:", error);
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Обработка маршрутов менеджера
  if (path.startsWith("/manager")) {
    try {
      if (!token) {
        return NextResponse.redirect(new URL("/login", request.url));
      }

      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || "default_secret"
      );
      const { payload } = await jwtVerify(token, secret);

      // Проверяем роль менеджера
      if ((payload as any).roleId !== 3) {
        return NextResponse.redirect(new URL("/", request.url));
      }

      // Проверяем наличие manager_access cookie для защищенных маршрутов
      const managerAccess = request.cookies.get("manager_access")?.value;
      if (!managerAccess && path !== "/manager/verify") {
        return NextResponse.redirect(new URL("/profile", request.url));
      }

      return NextResponse.next();
    } catch (error) {
      console.error("Manager middleware error:", error);
      return NextResponse.redirect(new URL("/login", request.url));
    }
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
    "/manager/:path*",
  ],
};
