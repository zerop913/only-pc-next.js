import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth } from "@/app/api/auth/_helpers/auth-helpers";

async function handler(
  request: NextRequest,
  context: { currentUserId: number }
) {
  try {
    // Сначала получаем текущее значение updatedAt
    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, context.currentUserId),
      columns: { updatedAt: true },
    });

    // Затем обновляем lastLoginAt, сохраняя текущий updatedAt
    await db
      .update(users)
      .set({
        lastLoginAt: new Date().toISOString(),
        updatedAt: currentUser?.updatedAt,
      })
      .where(eq(users.id, context.currentUserId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating last login:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const POST = withAuth(handler);
