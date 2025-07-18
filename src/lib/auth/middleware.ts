import { NextRequest, NextResponse } from "next/server";
import { verify } from "jsonwebtoken";

interface JwtPayload {
  userId: number;
  email: string;
  roleId: number;
  exp: number;
}

export function authMiddleware(requiredRoles?: string[]) {
  return async (request: NextRequest) => {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Отсутствует токен авторизации" },
        { status: 401 }
      );
    }

    try {
      const decoded = verify(
        token,
        process.env.JWT_SECRET || "default_secret"
      ) as JwtPayload;

      // Проверка срока действия токена
      if (decoded.exp * 1000 < Date.now()) {
        return NextResponse.json({ error: "Токен истек" }, { status: 401 });
      }

      // Проверка ролей, если указаны
      if (requiredRoles && requiredRoles.length > 0) {
        const hasRequiredRole = await checkUserRole(
          decoded.roleId,
          requiredRoles
        );
        if (!hasRequiredRole) {
          return NextResponse.json(
            { error: "Недостаточно прав" },
            { status: 403 }
          );
        }
      }

      // Прикрепляем информацию о пользователе к запросу
      (request as any).user = decoded;

      return NextResponse.next();
    } catch (error) {
      return NextResponse.json({ error: "Неверный токен" }, { status: 401 });
    }
  };
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

// Пример использования в route handlers
export function withAuth(handler: any, requiredRoles?: string[]) {
  return async (request: NextRequest, context?: any) => {
    const authResult = await authMiddleware(requiredRoles)(request);

    if (authResult.status !== 200) {
      return authResult;
    }

    // Получаем userId и roleId из токена
    const user = (request as any).user as JwtPayload;

    // Добавляем currentUserId и roleId в контекст для последующих проверок
    return handler(request, {
      ...context,
      currentUserId: user.userId,
      roleId: user.roleId,
    });
  };
}
