import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { updateOrderAfterPayment } from "@/services/paymentService";
import { getOrderById } from "@/services/orderService";

/**
 * Обновление статуса заказа после проверки платежа
 */
async function handler(
  request: NextRequest,
  context: { currentUserId: number }
) {
  try {
    const userId = context.currentUserId;
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Не указан ID заказа" },
        { status: 400 }
      );
    }

    // Проверяем, что заказ принадлежит текущему пользователю
    const orderDetails = await getOrderById(orderId);
    if (!orderDetails || orderDetails.userId !== userId) {
      return NextResponse.json(
        { error: "Заказ не найден или доступ запрещен" },
        { status: 403 }
      );
    }

    // Обновляем статус заказа на "Оплачен" (id=3)
    const result = await updateOrderAfterPayment(orderId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message || "Ошибка при обновлении статуса заказа" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Статус заказа успешно обновлен",
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
