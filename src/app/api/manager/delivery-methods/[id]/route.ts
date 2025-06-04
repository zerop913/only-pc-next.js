import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/auth/_helpers/auth-helpers";
import { db } from "@/lib/db";
import { deliveryMethods } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Обновление способа доставки
async function putHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }>; currentUserId: number }
) {
  try {
    const { id } = await context.params;
    const methodId = parseInt(id, 10);

    if (isNaN(methodId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Неверный идентификатор способа доставки",
        },
        { status: 400 }
      );
    }

    const data = await request.json();
    const { name, description, price, estimatedDays, isActive } = data;

    // Проверяем существование способа доставки
    const existingMethod = await db.query.deliveryMethods.findFirst({
      where: eq(deliveryMethods.id, methodId),
    });

    if (!existingMethod) {
      return NextResponse.json(
        {
          success: false,
          error: "Способ доставки не найден",
        },
        { status: 404 }
      );
    }

    // Проверяем обязательные поля
    if (!name || !price) {
      return NextResponse.json(
        {
          success: false,
          error: "Название и цена являются обязательными полями",
        },
        { status: 400 }
      );
    }

    // Проверяем цену
    const priceNumber = parseFloat(price);
    if (isNaN(priceNumber) || priceNumber < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Цена должна быть положительным числом",
        },
        { status: 400 }
      );
    }

    // Обновляем способ доставки
    const [updatedMethod] = await db
      .update(deliveryMethods)
      .set({
        name: name.trim(),
        description: description?.trim() || null,
        price: priceNumber.toString(),
        estimatedDays: estimatedDays?.trim() || null,
        isActive: isActive !== false,
      })
      .where(eq(deliveryMethods.id, methodId))
      .returning();

    return NextResponse.json({
      success: true,
      deliveryMethod: {
        id: updatedMethod.id,
        name: updatedMethod.name,
        description: updatedMethod.description,
        price: updatedMethod.price.toString(),
        estimatedDays: updatedMethod.estimatedDays,
        isActive: updatedMethod.isActive === null ? true : updatedMethod.isActive,
      },
      message: "Способ доставки успешно обновлен",
    });
  } catch (error) {
    console.error("Error updating delivery method:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Ошибка при обновлении способа доставки",
      },
      { status: 500 }
    );
  }
}

// Удаление способа доставки
async function deleteHandler(
  request: NextRequest,
  context: { params: Promise<{ id: string }>; currentUserId: number }
) {
  try {
    const { id } = await context.params;
    const methodId = parseInt(id, 10);

    if (isNaN(methodId)) {
      return NextResponse.json(
        {
          success: false,
          error: "Неверный идентификатор способа доставки",
        },
        { status: 400 }
      );
    }

    // Проверяем существование способа доставки
    const existingMethod = await db.query.deliveryMethods.findFirst({
      where: eq(deliveryMethods.id, methodId),
    });

    if (!existingMethod) {
      return NextResponse.json(
        {
          success: false,
          error: "Способ доставки не найден",
        },
        { status: 404 }
      );
    }

    // TODO: Проверить, что способ доставки не используется в активных заказах
    // Пока просто деактивируем вместо удаления
    await db
      .update(deliveryMethods)
      .set({
        isActive: false,
      })
      .where(eq(deliveryMethods.id, methodId));

    return NextResponse.json({
      success: true,
      message: "Способ доставки успешно деактивирован",
    });
  } catch (error) {
    console.error("Error deleting delivery method:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Ошибка при удалении способа доставки",
      },
      { status: 500 }
    );
  }
}

export const PUT = withAuth(putHandler, ["manager", "admin"]);
export const DELETE = withAuth(deleteHandler, ["manager", "admin"]);
