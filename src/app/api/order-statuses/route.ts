import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { orderStatuses } from "@/lib/db/schema";

/**
 * Получение всех статусов заказов
 */
async function handler(
  request: NextRequest,
  context: { currentUserId: number; roleId: number }
) {
  try {
    // Получаем все статусы заказов из БД
    const allStatuses = await db.select().from(orderStatuses);
    
    return NextResponse.json({ statuses: allStatuses });
  } catch (error) {
    console.error("Error fetching order statuses:", error);
    return NextResponse.json(
      { error: "Ошибка при получении статусов заказов" },
      { status: 500 }
    );
  }
}

// Этот эндпоинт доступен для всех авторизованных пользователей
export const GET = withAuth(handler);
