import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/auth/_helpers/auth-helpers";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { and, lt, eq } from "drizzle-orm";

// Деактивация пользователей, не заходивших 90 дней
async function handler(request: NextRequest) {
  try {
    const INACTIVE_DAYS = 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - INACTIVE_DAYS);

    const result = await db
      .update(users)
      .set({
        isActive: false,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          lt(users.lastLoginAt, cutoffDate.toISOString()),
          eq(users.isActive, true),
          // Не деактивируем администраторов
          eq(users.roleId, 2)
        )
      )
      .returning();

    return NextResponse.json({
      deactivatedCount: result.length,
      message: `Деактивировано ${result.length} неактивных пользователей`,
    });
  } catch (error) {
    console.error("Error deactivating users:", error);
    return NextResponse.json(
      { error: "Failed to deactivate users" },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler, ["admin"]);
