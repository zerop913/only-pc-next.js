import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { getUserOrders } from "@/services/orderService";

/**
 * Получение всех заказов пользователя
 */
async function handler(
  request: NextRequest,
  context: { currentUserId: number }
) {
  try {
    const userId = context.currentUserId;
    const orders = await getUserOrders(userId);

    return NextResponse.json({
      success: true,
      data: { orders },
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Ошибка при получении заказов пользователя",
      },
      { status: 500 }
    );
  }
}

// Применяем middleware аутентификации
export const GET = withAuth(handler);
