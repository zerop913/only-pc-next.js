import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/auth/_helpers/auth-helpers";
import {
  getUserAddresses,
  createDeliveryAddress,
} from "@/services/orderService";
import { DeliveryAddress } from "@/types/order";

// Получение всех адресов пользователя
async function handler(
  request: NextRequest,
  context: { currentUserId: number }
) {
  try {
    const addresses = await getUserAddresses(context.currentUserId);
    return NextResponse.json({ addresses });
  } catch (error) {
    console.error("Error fetching user addresses:", error);
    return NextResponse.json(
      { error: "Ошибка при получении адресов" },
      { status: 500 }
    );
  }
}

// Создание нового адреса
async function postHandler(
  request: NextRequest,
  context: { currentUserId: number }
) {
  try {
    const data = await request.json();

    // Проверка обязательных полей
    const requiredFields = [
      "recipientName",
      "phoneNumber",
      "city",
      "postalCode",
      "streetAddress",
    ];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Поле ${field} обязательно для заполнения` },
          { status: 400 }
        );
      }
    }
    const addressData = {
      userId: context.currentUserId,
      recipientName: data.recipientName,
      phoneNumber: data.phoneNumber,
      country: data.country || "Россия",
      city: data.city,
      postalCode: data.postalCode,
      streetAddress: data.streetAddress,
      deliveryMethodId: data.deliveryMethodId || null,
      isDefault: data.isDefault || false,
    };

    const address = await createDeliveryAddress(
      context.currentUserId,
      addressData
    );

    return NextResponse.json({ address, success: true });
  } catch (error) {
    console.error("Error creating address:", error);
    return NextResponse.json(
      { error: "Ошибка при создании адреса" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);
export const POST = withAuth(postHandler);
