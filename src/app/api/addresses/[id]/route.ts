import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/auth/_helpers/auth-helpers";
import {
  updateDeliveryAddress,
  deleteDeliveryAddress,
} from "@/services/orderService";

// Обновление адреса
async function patchHandler(
  request: NextRequest,
  { params, currentUserId }: { params: { id: string }; currentUserId: number }
) {
  try {
    // Используем await для получения params.id в Next.js 14+
    const id = await params.id;
    const addressId = parseInt(id, 10);
    if (isNaN(addressId)) {
      return NextResponse.json(
        { error: "Неверный идентификатор адреса" },
        { status: 400 }
      );
    }

    const data = await request.json();

    const addressData = {
      recipientName: data.recipientName,
      phoneNumber: data.phoneNumber,
      country: data.country,
      city: data.city,
      postalCode: data.postalCode,
      streetAddress: data.streetAddress,
      isDefault: data.isDefault,
    };

    const result = await updateDeliveryAddress(
      addressId,
      currentUserId,
      addressData
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.message || "Ошибка при обновлении адреса" },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating address:", error);
    return NextResponse.json(
      { error: "Ошибка при обновлении адреса" },
      { status: 500 }
    );
  }
}

// Удаление адреса
async function deleteHandler(
  request: NextRequest,
  { params, currentUserId }: { params: { id: string }; currentUserId: number }
) {
  try {
    // Используем await для получения params.id в Next.js 14+
    const id = await params.id;
    const addressId = parseInt(id, 10);
    if (isNaN(addressId)) {
      return NextResponse.json(
        { error: "Неверный идентификатор адреса" },
        { status: 400 }
      );
    }

    const result = await deleteDeliveryAddress(addressId, currentUserId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.message || "Ошибка при удалении адреса" },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json(
      { error: "Ошибка при удалении адреса" },
      { status: 500 }
    );
  }
}

export const PATCH = withAuth(patchHandler);
export const DELETE = withAuth(deleteHandler);
