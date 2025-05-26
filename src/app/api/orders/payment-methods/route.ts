import { NextRequest, NextResponse } from "next/server";
import { getPaymentMethods } from "@/services/orderService";

/**
 * Получение методов оплаты
 */
export async function GET(request: NextRequest) {
  try {
    const methods = await getPaymentMethods();
    return NextResponse.json({
      paymentMethods: methods.map((method) => ({
        id: method.id,
        name: method.name,
        description: method.description,
        isActive: method.isActive === null ? true : method.isActive,
      })),
    });
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    return NextResponse.json(
      { error: "Ошибка при получении методов оплаты" },
      { status: 500 }
    );
  }
}
