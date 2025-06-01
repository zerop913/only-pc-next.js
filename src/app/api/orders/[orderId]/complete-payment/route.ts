import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { orders, orderHistory } from "@/lib/db/schema";

/**
 * Обновление статуса заказа после оплаты
 */
async function handler(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }>; currentUserId: number }
) {
  try {
    const userId = context.currentUserId;
    const { orderId } = await context.params;
    const orderIdNum = parseInt(orderId);
    const { statusId } = await request.json();

    if (isNaN(orderIdNum)) {
      return NextResponse.json(
        { error: "Некорректный идентификатор заказа" },
        { status: 400 }
      );
    }

    // Получаем заказ с учетом прав доступа (только свои заказы)
    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderIdNum), eq(orders.userId, userId)),
    });

    if (!order) {
      return NextResponse.json(
        { error: "Заказ не найден или у вас нет прав доступа к нему" },
        { status: 404 }
      );
    } // Создаем дату в московском времени
    const now = new Date();
    const moscowDate = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    // Для полей в БД, ожидающих строку, форматируем дату
    const moscowTimeString = moscowDate.toISOString().replace("Z", "+03:00"); // Обновляем статус заказа
    await db
      .update(orders)
      .set({
        statusId: statusId,
        updatedAt: moscowTimeString, // Используем строку для поля updatedAt
      })
      .where(eq(orders.id, orderIdNum));

    // Добавляем запись в историю заказа
    await db.insert(orderHistory).values({
      orderId: orderIdNum, // Используем число для orderId
      statusId,
      comment: "Заказ успешно оплачен.",
      userId,
      // Для timestamp поля используем объект Date
      createdAt: moscowDate,
    });

    return NextResponse.json({
      success: true,
      message: "Статус заказа обновлен",
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: "Ошибка при обновлении статуса заказа" },
      { status: 500 }
    );
  }
}

// Применяем middleware аутентификации
export const POST = withAuth(handler);
