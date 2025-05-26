import { NextRequest, NextResponse } from "next/server";
import { getDeliveryMethods } from "@/services/orderService";

/**
 * Получение методов доставки
 */
export async function GET(request: NextRequest) {
  try {
    const methods = await getDeliveryMethods();
    return NextResponse.json({
      deliveryMethods: methods.map((method) => ({
        id: method.id,
        name: method.name,
        description: method.description,
        price: method.price.toString(),
        estimatedDays: method.estimatedDays,
        isActive: method.isActive === null ? true : method.isActive,
      })),
    });
  } catch (error) {
    console.error("Error fetching delivery methods:", error);
    return NextResponse.json(
      { error: "Ошибка при получении методов доставки" },
      { status: 500 }
    );
  }
}
