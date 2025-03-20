import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/auth/_helpers/auth-helpers";
import { db } from "@/lib/db";
import { users, userProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

async function handler(request: NextRequest) {
  try {
    // Получаем пользователей вместе с их профилями
    const allUsers = await db.query.users.findMany({
      orderBy: (users, { desc }) => [desc(users.createdAt)],
      with: {
        profile: true,
      },
    });

    // Удаляем чувствительные данные перед отправкой
    const safeUsers = allUsers.map(({ password, ...user }) => ({
      ...user,
      firstName: user.profile?.firstName || null,
      lastName: user.profile?.lastName || null,
      phoneNumber: user.profile?.phoneNumber || null,
      city: user.profile?.city || null,
    }));

    return NextResponse.json(safeUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Ошибка при получении списка пользователей" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler, ["admin"]);
