import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/auth/_helpers/auth-helpers";

async function handler(
  request: NextRequest,
  context: { currentUserId: number }
) {
  try {
    // В будущем здесь будет логика получения заказов из БД
    // Сейчас возвращаем заглушку с демо-данными
    const orders = [
      {
        id: 1,
        orderNumber: "ORD-001-2025",
        customerName: "Иван Петров",
        status: "pending",
        total: 89500,
        items: 3,
        date: "2025-05-05T10:30:00Z",
      },
      {
        id: 2,
        orderNumber: "ORD-002-2025",
        customerName: "Анна Сидорова",
        status: "processing",
        total: 125300,
        items: 5,
        date: "2025-05-06T14:15:00Z",
      },
      {
        id: 3,
        orderNumber: "ORD-003-2025",
        customerName: "Максим Иванов",
        status: "shipped",
        total: 45800,
        items: 2,
        date: "2025-05-07T09:45:00Z",
      },
    ];

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Ошибка при получении заказов" },
      { status: 500 }
    );
  }
}

// Защищаем маршрут авторизацией и проверкой роли менеджера
export const GET = withAuth(handler, ["manager"]);
