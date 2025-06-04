import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/auth/_helpers/auth-helpers";
import { updateOrderStatus } from "@/services/orderService";

// Обновление статуса заказа менеджером
async function handler(
  request: NextRequest,
  context: { params: Promise<{ id: string }>; currentUserId: number }
) {
  try {
    const { id } = await context.params;
    const { currentUserId } = context;
    const orderId = parseInt(id, 10);
    
    if (isNaN(orderId)) {
      return NextResponse.json(
        { 
          error: "Неверный идентификатор заказа",
          success: false 
        },
        { status: 400 }
      );
    }

    const data = await request.json();
    const { statusId, comment } = data;

    if (!statusId) {
      return NextResponse.json(
        { 
          error: "Не указан новый статус заказа",
          success: false 
        },
        { status: 400 }
      );
    }

    const result = await updateOrderStatus(orderId, currentUserId, {
      statusId,
      comment: comment || `Статус изменен менеджером`,
    });

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.message || "Ошибка при обновлении статуса заказа",
          success: false 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message || "Статус заказа успешно обновлен",
    });
  } catch (error) {
    console.error("Error updating order status by manager:", error);
    return NextResponse.json(
      { 
        error: "Ошибка при обновлении статуса заказа",
        success: false 
      },
      { status: 500 }
    );
  }
}

export const PATCH = withAuth(handler, ["manager", "admin"]);
