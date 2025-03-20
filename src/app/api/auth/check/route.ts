import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/services/authService";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { jwtVerify } from "jose";
import { redis } from "@/lib/redis";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      );
    }

    // Декодируем токен для получения userId
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "default_secret"
    );
    const { payload } = await jwtVerify(token, secret);
    const userId = (payload as any).userId;

    if (userId) {
      // Обновляем статус онлайн в Redis с TTL 5 минут
      await redis.set(`user:${userId}:online`, "true", "EX", 300);

      // Сначала получаем текущее значение updatedAt
      const currentUser = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { updatedAt: true },
      });

      await db
        .update(users)
        .set({
          lastLoginAt: new Date().toISOString(),
          updatedAt: currentUser?.updatedAt,
        })
        .where(eq(users.id, userId));
    }

    const user = await getCurrentUser(token);

    if (!user) {
      return NextResponse.json(
        { authenticated: false, user: null },
        { status: 200 }
      );
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
    };

    return NextResponse.json(
      { authenticated: true, user: safeUser },
      { status: 200 }
    );
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 200 }
    );
  }
}
