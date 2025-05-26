import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { createOrder } from "@/services/orderService";

/**
 * Создание нового заказа
 */
async function handler(
  request: NextRequest,
  context: { currentUserId: number }
) {
  try {
    const userId = context.currentUserId;
    const orderData = await request.json();

    // Проверяем обязательные поля запроса
    if (
      !orderData.deliveryMethodId ||
      !orderData.paymentMethodId ||
      !orderData.deliveryAddressId
    ) {
      return NextResponse.json(
        { error: "Недостаточно данных для оформления заказа" },
        { status: 400 }
      );
    }

    // Создаем заказ
    const result = await createOrder(userId, orderData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message || "Ошибка при создании заказа" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      orderNumber: result.order.orderNumber,
      orderId: result.order.id,
      order: result.order,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Ошибка при создании заказа" },
      { status: 500 }
    );
  }
}

// Применяем middleware аутентификации
export const POST = withAuth(handler);
