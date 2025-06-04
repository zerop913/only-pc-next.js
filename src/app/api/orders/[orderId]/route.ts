import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { getOrderById } from "@/services/orderService";

/**
 * Получение данных заказа по ID
 */
async function handler(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }>; currentUserId: number }
) {
  try {
    const { orderId } = await context.params;
    const userId = context.currentUserId;

    if (!orderId) {
      return NextResponse.json(
        { error: "ID заказа не указан" },
        { status: 400 }
      );
    }

    // Получаем данные заказа
    const order = await getOrderById(parseInt(orderId));
    
    if (!order) {
      return NextResponse.json(
        { error: "Заказ не найден" },
        { status: 404 }
      );
    }    // Проверим зашифрованный токен, чтобы получить roleId пользователя
    const token = request.cookies.get("token")?.value;
    let roleId = 2; // По умолчанию обычный пользователь (roleId=2)
    
    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET || "default_secret");
        const { jwtVerify } = await import("jose");
        const { payload } = await jwtVerify(token, secret);
        roleId = (payload as any).roleId || 2;
      } catch (error) {
        console.error("Error verifying token:", error);
      }
    }
    
    // Проверка доступа для обычных пользователей (только свои заказы)
    // Администраторы (roleId=1) и менеджеры (roleId=3) могут просматривать любые заказы
    const isAdminOrManager = roleId === 1 || roleId === 3;
    if (!isAdminOrManager && order.userId !== userId) {
      return NextResponse.json(
        { error: "Нет прав для просмотра этого заказа" },
        { status: 403 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Ошибка при получении данных заказа" },
      { status: 500 }
    );
  }
}

// Защищаем маршрут, разрешая доступ пользователям, админам и менеджерам
export const GET = withAuth(handler);
