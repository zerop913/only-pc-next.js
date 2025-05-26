import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/auth/_helpers/auth-helpers";
import { getOrderStatuses } from "@/services/orderService";

// Получение всех статусов заказов
async function handler(
  request: NextRequest,
  context: { currentUserId: number }
) {
  try {
    const statuses = await getOrderStatuses();
    return NextResponse.json({ statuses });
  } catch (error) {
    console.error("Error fetching order statuses:", error);
    return NextResponse.json(
      { error: "Ошибка при получении статусов заказов" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler, ["admin", "manager"]);
