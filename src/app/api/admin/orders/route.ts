import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/auth/_helpers/auth-helpers";
import { getAllOrders } from "@/services/orderService";

// Получение всех заказов (для админа/менеджера)
async function handler(
  request: NextRequest,
  context: { currentUserId: number }
) {
  try {
    // Получаем параметры запроса
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);

    // Получаем фильтры статусов
    const statusFilter = url.searchParams.get("status");
    const statusIds = statusFilter
      ? statusFilter.split(",").map((id) => parseInt(id, 10))
      : undefined;

    // Получаем заказы
    const { orders, total } = await getAllOrders(page, limit, statusIds);

    return NextResponse.json({ orders, total, page, limit });
  } catch (error) {
    console.error("Error fetching all orders:", error);
    return NextResponse.json(
      { error: "Ошибка при получении заказов" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler, ["admin", "manager"]);
