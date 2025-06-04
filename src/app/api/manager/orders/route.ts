import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/auth/_helpers/auth-helpers";
import { getAllOrders } from "@/services/orderService";

// Получение всех заказов для менеджера
async function handler(
  request: NextRequest,
  context: { currentUserId: number }
) {
  try {
    // Получаем параметры запроса
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "50", 10); // Увеличиваем лимит для менеджера
    const searchQuery = url.searchParams.get("search") || "";

    // Получаем фильтры статусов
    const statusFilter = url.searchParams.get("status");
    const statusIds = statusFilter
      ? statusFilter.split(",").map((id) => parseInt(id, 10))
      : undefined;    // Получаем заказы
    const { orders, total } = await getAllOrders(page, limit, statusIds);

    return NextResponse.json({ 
      orders, 
      total, 
      page, 
      limit,
      success: true 
    });
  } catch (error) {
    console.error("Error fetching orders for manager:", error);
    return NextResponse.json(
      { 
        error: "Ошибка при получении заказов",
        success: false 
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler, ["manager", "admin"]);
