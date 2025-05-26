import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/auth/_helpers/auth-helpers";
import { getOrdersStatistics } from "@/services/orderService";

// Получение статистики по заказам
async function handler(
  request: NextRequest,
  context: { currentUserId: number }
) {
  try {
    const statistics = await getOrdersStatistics();
    return NextResponse.json({ statistics });
  } catch (error) {
    console.error("Error fetching order statistics:", error);
    return NextResponse.json(
      { error: "Ошибка при получении статистики заказов" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler, ["admin", "manager"]);
