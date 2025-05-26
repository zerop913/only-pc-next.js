import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { getUserDeliveryAddresses } from "@/services/orderService";

/**
 * Получение адресов доставки пользователя
 */
async function handler(
  request: NextRequest,
  context: { currentUserId: number }
) {
  try {
    const userId = context.currentUserId;
    const addresses = await getUserDeliveryAddresses(userId);

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error("Error fetching user delivery addresses:", error);
    return NextResponse.json(
      { error: "Ошибка при получении адресов доставки" },
      { status: 500 }
    );
  }
}

// Применяем middleware аутентификации
export const GET = withAuth(handler);
