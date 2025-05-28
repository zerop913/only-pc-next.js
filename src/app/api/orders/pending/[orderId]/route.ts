import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import {
  orders,
  orderItems,
  deliveryMethods,
  paymentMethods,
  deliveryAddresses,
  pcBuilds,
} from "@/lib/db/schema";

/**
 * Получение данных незавершенного (ожидающего оплаты) заказа
 */
async function handler(
  request: NextRequest,
  context: { params: { orderId: string }; currentUserId: number }
) {
  try {
    const userId = context.currentUserId;
    const orderId = parseInt(context.params.orderId);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: "Некорректный идентификатор заказа" },
        { status: 400 }
      );
    }

    // Получаем заказ с учетом прав доступа
    const order = await db.query.orders.findFirst({
      where: and(eq(orders.id, orderId), eq(orders.userId, userId)),
      with: {
        deliveryMethod: true,
        paymentMethod: true,
        deliveryAddress: true,
        items: {
          with: {
            build: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Заказ не найден или у вас нет прав доступа к нему" },
        { status: 404 }
      );
    }

    // Конвертируем данные для фронтенда
    const items = order.items
      .map((item) => {
        if (item.build) {
          return {
            id: item.build.id,
            name: item.build.name,
            price: parseFloat(item.build.totalPrice),
            image: "/icons/case.svg",
            quantity: 1,
          };
        }
        return null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    // Используем сохраненные значения из заказа
    const orderData = {
      id: order.id,
      orderNumber: order.orderNumber,
      statusId: order.statusId,
      items: items,
      deliveryMethod: {
        id: order.deliveryMethod?.id,
        name: order.deliveryMethod?.name || "",
        price: order.deliveryMethod?.price || "0",
      },
      paymentMethod: {
        id: order.paymentMethod?.id,
        name: order.paymentMethod?.name || "",
      },
      deliveryPrice: order.deliveryPrice, // Используем сохраненную цену доставки
      totalPrice: order.totalPrice, // Используем сохраненную общую сумму
      deliveryAddress: order.deliveryAddress,
      createdAt: order.createdAt,
    };

    console.log("API /orders/pending/[orderId] - Формируемые данные заказа:", {
      orderId: order.id,
      deliveryMethodPrice: order.deliveryMethod?.price,
      orderDeliveryPrice: order.deliveryPrice,
      totalPrice: order.totalPrice,
      items,
    });

    return NextResponse.json({ order: orderData });
  } catch (error) {
    console.error("Error fetching pending order:", error);
    return NextResponse.json(
      { error: "Ошибка при получении данных заказа" },
      { status: 500 }
    );
  }
}

// Применяем middleware аутентификации
export const GET = withAuth(handler);
