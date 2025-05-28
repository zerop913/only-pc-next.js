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
    
    // Проверяем наличие элементов корзины
    if (!orderData.cartItems || !Array.isArray(orderData.cartItems) || orderData.cartItems.length === 0) {
      return NextResponse.json(
        { error: "Корзина пуста или имеет неверный формат" },
        { status: 400 }
      );
    }

    // Проверяем, оплачен ли заказ
    const isPaid = orderData.paidAt && orderData.paymentStatus === "paid";

    // Устанавливаем статус заказа в зависимости от оплаты
    const initialStatusId = isPaid ? 3 : 1; // 3 - Оплачен, 1 - Новый

    // Создаем заказ с указанным статусом
    const result = await createOrder(userId, {
      ...orderData,
      statusId: initialStatusId,
    });

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
