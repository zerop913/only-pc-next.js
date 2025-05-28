import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/auth/_helpers/auth-helpers";
import {
  getUserDeliveryAddresses,
  createDeliveryAddress,
} from "@/services/orderService";
import { DeliveryAddress } from "@/types/order";

/**
 * Получение адресов доставки пользователя
 */
async function getHandler(
  request: NextRequest,
  context: { currentUserId: number }
) {
  try {
    const addresses = await getUserDeliveryAddresses(context.currentUserId);
    return NextResponse.json({
      addresses: addresses.map((address) => ({
        id: address.id,
        userId: address.userId,
        recipientName: address.recipientName,
        phoneNumber: address.phoneNumber,
        country: address.country,
        city: address.city,
        postalCode: address.postalCode,
        streetAddress: address.streetAddress,
        deliveryMethodId: address.deliveryMethodId,
        isDefault: address.isDefault,
      })),
    });
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
    const addressData = await request.json();

    // Валидация данных
    if (
      !addressData.recipientName ||
      !addressData.phoneNumber ||
      !addressData.city ||
      !addressData.postalCode ||
      !addressData.streetAddress
    ) {
      return NextResponse.json(
        { error: "Не все обязательные поля заполнены" },
        { status: 400 }
      );
    } // Создаем новый адрес доставки
    const address = await createDeliveryAddress(context.currentUserId, {
      userId: context.currentUserId,
      recipientName: addressData.recipientName,
      phoneNumber: addressData.phoneNumber,
      country: addressData.country || "Россия",
      city: addressData.city,
      postalCode: addressData.postalCode,
      streetAddress: addressData.streetAddress,
      deliveryMethodId: addressData.deliveryMethodId || null,
      isDefault: addressData.isDefault === true,
    });

    if (!address) {
      return NextResponse.json(
        { error: "Ошибка при создании адреса доставки" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      address: address,
    });
  } catch (error) {
    console.error("Error creating delivery address:", error);
    return NextResponse.json(
      { error: "Ошибка при создании адреса доставки" },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);
