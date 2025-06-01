import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderStatuses, orderItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Получение публичной информации о заказе по номеру заказа (для отслеживания)
export async function GET(
  request: NextRequest,
  context: { params: { number: string } }
) {
  try {
    const { params } = context;
    const orderNumber = params.number;
    if (!orderNumber) {
      return NextResponse.json(
        { error: "Номер заказа не указан" },
        { status: 400 }
      );
    }

    // Получаем базовую информацию о заказе
    const orderData = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        statusId: orders.statusId,
        totalPrice: orders.totalPrice,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        // Статус
        statusName: orderStatuses.name,
        statusColor: orderStatuses.color,
      })
      .from(orders)
      .leftJoin(orderStatuses, eq(orders.statusId, orderStatuses.id))
      .where(eq(orders.orderNumber, orderNumber))
      .limit(1);

    if (orderData.length === 0) {
      return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
    }

    // Получаем информацию о снапшоте первой сборки для отображения имени
    const [item] = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderData[0].id))
      .limit(1);

    const buildInfo = item?.buildSnapshot
      ? {
          name: (item.buildSnapshot as any).name,
          totalPrice: (item.buildSnapshot as any).totalPrice,
        }
      : null;

    // Формируем структуру для публичного просмотра
    const publicOrderInfo = {
      orderNumber: orderData[0].orderNumber,
      status: {
        id: orderData[0].statusId,
        name: orderData[0].statusName || "",
        color: orderData[0].statusColor,
      },
      totalPrice: orderData[0].totalPrice,
      createdAt: orderData[0].createdAt || new Date().toISOString(),
      updatedAt: orderData[0].updatedAt || new Date().toISOString(),
      build: buildInfo,
    };

    return NextResponse.json({ order: publicOrderInfo });
  } catch (error) {
    console.error("Error fetching public order info:", error);
    return NextResponse.json(
      { error: "Ошибка при получении информации о заказе" },
      { status: 500 }
    );
  }
}
