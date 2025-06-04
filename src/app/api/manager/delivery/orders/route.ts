import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/auth/_helpers/auth-helpers";
import { getAllOrders } from "@/services/orderService";

// Получение заказов в доставке (статусы 5-6: "Отправлен", "Доставлен")
async function handler(
  request: NextRequest,
  context: { currentUserId: number }
) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    // Получаем заказы со статусами доставки
    // ID 5 - "Отправлен", ID 6 - "Доставлен"
    const deliveryStatusIds = [5, 6];

    const { orders, total } = await getAllOrders(
      page,
      limit,
      deliveryStatusIds
    );

    return NextResponse.json({
      success: true,
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching delivery orders:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Ошибка при получении заказов в доставке",
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler, ["manager", "admin"]);
