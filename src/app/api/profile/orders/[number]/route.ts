import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import {
  orders,
  orderStatuses,
  orderItems,
  orderHistory,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getOrderById } from "@/services/orderService";

/**
 * Получение информации о заказе по номеру для авторизованного пользователя
 */
async function handler(
  request: NextRequest,
  context: { currentUserId: number; params: Promise<{ number: string }> }
) {
  try {
    const userId = context.currentUserId;
    const { number } = await context.params;

    if (!number) {
      return NextResponse.json(
        { success: false, error: "Номер заказа не указан" },
        { status: 400 }
      );
    } // Получаем базовую информацию о заказе по номеру (нечувствительно к регистру)
    const orderData = await db
      .select({
        id: orders.id,
      })
      .from(orders)
      .where(eq(orders.orderNumber, number.toUpperCase()))
      .limit(1);

    if (orderData.length === 0) {
      return NextResponse.json(
        { success: false, error: "Заказ не найден" },
        { status: 404 }
      );
    }

    const orderId = orderData[0].id;

    // Получаем полную информацию о заказе по ID
    const order = await getOrderById(orderId);

    if (!order) {
      return NextResponse.json(
        { success: false, error: "Заказ не найден" },
        { status: 404 }
      );
    }

    // Проверяем, принадлежит ли заказ текущему пользователю
    if (order.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Доступ запрещен" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { order },
    });
  } catch (error) {
    console.error("Error fetching order by number:", error);
    return NextResponse.json(
      { success: false, error: "Ошибка при получении информации о заказе" },
      { status: 500 }
    );
  }
}

// Применяем middleware аутентификации
export const GET = withAuth(handler);
