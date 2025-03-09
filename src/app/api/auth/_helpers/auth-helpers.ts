import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

interface JwtPayload {
  userId: number;
  email: string;
  roleId: number;
  exp: number;
}

// API route middleware для проверки авторизации
export async function authMiddleware(
  request: NextRequest,
  requiredRoles?: string[]
) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.json(
      { error: "Отсутствует токен авторизации" },
      { status: 401 }
    );
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "default_secret"
    );

    const { payload } = (await jwtVerify(token, secret)) as {
      payload: JwtPayload;
    };

    // Проверка срока действия токена
    if (payload.exp * 1000 < Date.now()) {
      return NextResponse.json({ error: "Токен истек" }, { status: 401 });
    }

    // Проверка ролей, если указаны
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = await checkUserRole(
        payload.roleId,
        requiredRoles
      );
      if (!hasRequiredRole) {
        return NextResponse.json(
          { error: "Недостаточно прав" },
          { status: 403 }
        );
      }
    }

    // Добавляем пользователя к запросу
    (request as any).user = payload;

    return null; // Нет ошибки
  } catch (error) {
    return NextResponse.json({ error: "Неверный токен" }, { status: 401 });
  }
}

async function checkUserRole(
  userRoleId: number,
  requiredRoles: string[]
): Promise<boolean> {
  const { db } = await import("@/lib/db");
  const { roles } = await import("@/lib/db/schema");
  const { eq, or } = await import("drizzle-orm");

  const roleMatches = await db
    .select()
    .from(roles)
    .where(or(...requiredRoles.map((roleName) => eq(roles.name, roleName))));

  return roleMatches.some((role) => role.id === userRoleId);
}

// Пример для использования в route handlers
export function withAuth(handler: any, requiredRoles?: string[]) {
  return async (request: NextRequest, context: { params: { id?: string } }) => {
    const authResult = await authMiddleware(request, requiredRoles);

    if (authResult !== null) {
      return authResult; // Возвращаем ошибку аутентификации
    }

    // Получаем userId из токена
    const user = (request as any).user as JwtPayload;

    // Добавляем currentUserId в контекст для последующих проверок
    return handler(request, {
      ...context,
      currentUserId: user.userId,
    });
  };
}
