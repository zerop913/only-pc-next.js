import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/auth/_helpers/auth-helpers";
import { getOrderById, updateOrderStatus } from "@/services/orderService";
import { UpdateOrderStatusRequest } from "@/types/order";

// Получение информации о заказе (для админа/менеджера)
async function handler(
  request: NextRequest,
  context: { params: { id: string }; currentUserId: number }
) {
  try {
    const { params, currentUserId } = context;
    const orderId = parseInt(params.id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: "Неверный идентификатор заказа" },
        { status: 400 }
      );
    }

    const order = await getOrderById(orderId);
    return NextResponse.json({ order });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Ошибка при получении информации о заказе" },
      { status: 500 }
    );
  }
}

// Обновление статуса заказа (для админа/менеджера)
async function patchHandler(
  request: NextRequest,
  context: { params: { id: string }; currentUserId: number }
) {
  try {
    const { params, currentUserId } = context;
    const orderId = parseInt(params.id, 10);
    if (isNaN(orderId)) {
      return NextResponse.json(
        { error: "Неверный идентификатор заказа" },
        { status: 400 }
      );
    }

    const data = await request.json();
    const updateData = data as UpdateOrderStatusRequest;

    const result = await updateOrderStatus(orderId, currentUserId, updateData);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message || "Ошибка при обновлении статуса заказа" },
        { status: 400 }
      );
    }

    // Получаем обновленный заказ
    const updatedOrder = await getOrderById(orderId);

    return NextResponse.json({
      order: updatedOrder,
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: "Ошибка при обновлении статуса заказа" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler, ["admin", "manager"]);
export const PATCH = withAuth(patchHandler, ["admin", "manager"]);
