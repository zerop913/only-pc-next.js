import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/auth/_helpers/auth-helpers";
import { db } from "@/lib/db";
import { deliveryMethods } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Получение всех способов доставки для менеджера
async function getHandler(
  request: NextRequest,
  context: { currentUserId: number }
) {
  try {
    const allMethods = await db
      .select()
      .from(deliveryMethods)
      .orderBy(deliveryMethods.isActive, deliveryMethods.name);

    return NextResponse.json({
      success: true,
      deliveryMethods: allMethods.map((method) => ({
        id: method.id,
        name: method.name,
        description: method.description,
        price: method.price.toString(),
        estimatedDays: method.estimatedDays,
        isActive: method.isActive === null ? true : method.isActive,
      })),
    });
  } catch (error) {
    console.error("Error fetching delivery methods for manager:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Ошибка при получении способов доставки" 
      },
      { status: 500 }
    );
  }
}

// Создание нового способа доставки
async function postHandler(
  request: NextRequest,
  context: { currentUserId: number }
) {
  try {
    const data = await request.json();
    const { name, description, price, estimatedDays, isActive } = data;

    if (!name || !price) {
      return NextResponse.json(
        { 
          success: false,
          error: "Название и цена являются обязательными полями" 
        },
        { status: 400 }
      );
    }

    // Проверяем, что цена является положительным числом
    const priceNumber = parseFloat(price);
    if (isNaN(priceNumber) || priceNumber < 0) {
      return NextResponse.json(
        { 
          success: false,
          error: "Цена должна быть положительным числом" 
        },
        { status: 400 }
      );
    }

    const [newMethod] = await db
      .insert(deliveryMethods)
      .values({
        name: name.trim(),
        description: description?.trim() || null,
        price: priceNumber.toString(),
        estimatedDays: estimatedDays?.trim() || null,
        isActive: isActive !== false, // По умолчанию активный
      })
      .returning();

    return NextResponse.json({
      success: true,
      deliveryMethod: {
        id: newMethod.id,
        name: newMethod.name,
        description: newMethod.description,
        price: newMethod.price.toString(),
        estimatedDays: newMethod.estimatedDays,
        isActive: newMethod.isActive === null ? true : newMethod.isActive,
      },
      message: "Способ доставки успешно создан",
    });
  } catch (error) {
    console.error("Error creating delivery method:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Ошибка при создании способа доставки" 
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getHandler, ["manager", "admin"]);
export const POST = withAuth(postHandler, ["manager", "admin"]);
