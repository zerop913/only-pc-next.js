// filepath: e:\Code\Project\Diplom\onlypc-frontend\src\app\api\user\delivery-addresses\route.ts
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { getUserDeliveryAddresses } from "@/services/orderService";

/**
 * Получение адресов доставки пользователя
 */
async function getHandler(
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

/**
 * Создание нового адреса доставки
 */
async function postHandler(
  request: NextRequest,
  context: { currentUserId: number }
) {
  try {
    const userId = context.currentUserId;
    const addressData = await request.json();

    // Здесь нужно реализовать создание адреса в базе данных
    // Это заглушка, которая возвращает успешный результат

    return NextResponse.json({
      success: true,
      addressId: 1, // Здесь должен быть ID созданного адреса
      message: "Адрес успешно добавлен",
    });
  } catch (error) {
    console.error("Error creating delivery address:", error);
    return NextResponse.json(
      { error: "Ошибка при создании адреса доставки" },
      { status: 500 }
    );
  }
}

// Применяем middleware аутентификации с корректными параметрами
export const GET = (request: NextRequest) => withAuth(getHandler)(request, { params: {} });
export const POST = (request: NextRequest) => withAuth(postHandler)(request, { params: {} });
