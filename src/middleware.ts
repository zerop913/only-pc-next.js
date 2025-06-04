import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Функция для создания ответа с CSP заголовками
function createResponseWithCSP(response: NextResponse): NextResponse {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com https://www.recaptcha.net",
    "frame-src 'self' https://www.google.com https://recaptcha.google.com https://www.recaptcha.net",
    "connect-src 'self' https://www.google.com https://www.gstatic.com https://www.recaptcha.net http://77.232.138.175:5000",
    "img-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "object-src 'none'",
    "base-uri 'self'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);
  return response;
}

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
    const redirectResponse = NextResponse.redirect(
      new URL("/api/auth/logout", request.url)
    );
    return createResponseWithCSP(redirectResponse);
  }

  // Если пользователь авторизован и пытается зайти на страницу входа/регистрации
  if (isPublicAuthRoute && token) {
    try {
      // Проверяем валидность токена
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || "default_secret"
      );
      await jwtVerify(token, secret);

      const redirectResponse = NextResponse.redirect(new URL("/", request.url));
      return createResponseWithCSP(redirectResponse);
    } catch (error) {
      console.error("Auth middleware error:", error);
      // В случае ошибки разрешаем доступ к маршрутам входа/регистрации
    }
  }

  // Если пользователь пытается зайти на защищенный маршрут без авторизации
  if (isProtectedRoute && !token) {
    const redirectResponse = NextResponse.redirect(
      new URL("/login", request.url)
    );
    return createResponseWithCSP(redirectResponse);
  }

  // Обработка админ-маршрутов
  if (path.startsWith("/admin")) {
    try {
      if (!token) {
        const redirectResponse = NextResponse.redirect(
          new URL("/login", request.url)
        );
        return createResponseWithCSP(redirectResponse);
      }

      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || "default_secret"
      );
      const { payload } = await jwtVerify(token, secret);

      // Проверяем роль администратора
      if ((payload as any).roleId !== 1) {
        const redirectResponse = NextResponse.redirect(
          new URL("/", request.url)
        );
        return createResponseWithCSP(redirectResponse);
      }

      // Проверяем наличие admin_access cookie для защищенных маршрутов
      const adminAccess = request.cookies.get("admin_access")?.value;
      if (!adminAccess && path !== "/admin/verify") {
        const redirectResponse = NextResponse.redirect(
          new URL("/profile", request.url)
        );
        return createResponseWithCSP(redirectResponse);
      }

      const nextResponse = NextResponse.next();
      return createResponseWithCSP(nextResponse);
    } catch (error) {
      console.error("Admin middleware error:", error);
      const redirectResponse = NextResponse.redirect(
        new URL("/login", request.url)
      );
      return createResponseWithCSP(redirectResponse);
    }
  }

  // Обработка маршрутов менеджера
  if (path.startsWith("/manager")) {
    try {
      if (!token) {
        const redirectResponse = NextResponse.redirect(
          new URL("/login", request.url)
        );
        return createResponseWithCSP(redirectResponse);
      }

      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || "default_secret"
      );
      const { payload } = await jwtVerify(token, secret);

      // Проверяем роль менеджера
      if ((payload as any).roleId !== 3) {
        const redirectResponse = NextResponse.redirect(
          new URL("/", request.url)
        );
        return createResponseWithCSP(redirectResponse);
      }

      // Проверяем наличие manager_access cookie для защищенных маршрутов
      const managerAccess = request.cookies.get("manager_access")?.value;
      if (!managerAccess && path !== "/manager/verify") {
        const redirectResponse = NextResponse.redirect(
          new URL("/profile", request.url)
        );
        return createResponseWithCSP(redirectResponse);
      }

      const nextResponse = NextResponse.next();
      return createResponseWithCSP(nextResponse);
    } catch (error) {
      console.error("Manager middleware error:", error);
      const redirectResponse = NextResponse.redirect(
        new URL("/login", request.url)
      );
      return createResponseWithCSP(redirectResponse);
    }
  }

  const finalResponse = NextResponse.next();
  return createResponseWithCSP(finalResponse);
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
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
