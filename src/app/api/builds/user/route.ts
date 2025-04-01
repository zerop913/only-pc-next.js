import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pcBuilds } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { withAuth } from "@/app/api/auth/_helpers/auth-helpers";

async function handler(
  request: NextRequest,
  context: { currentUserId: number }
) {
  try {
    const builds = await db
      .select()
      .from(pcBuilds)
      .where(eq(pcBuilds.userId, context.currentUserId))
      .orderBy(pcBuilds.createdAt);

    return NextResponse.json({ builds });
  } catch (error) {
    console.error("Error fetching user builds:", error);
    return NextResponse.json(
      { error: "Ошибка при получении сборок" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
