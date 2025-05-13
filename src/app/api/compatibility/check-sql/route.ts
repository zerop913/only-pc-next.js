import { NextRequest, NextResponse } from "next/server";
import { checkBuildCompatibilitySql } from "@/services/compatibilityService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { components } = body;

    if (!components || typeof components !== "object") {
      return NextResponse.json(
        { error: "Некорректный формат данных" },
        { status: 400 }
      );
    }

    // Проверяем совместимость через SQL-функцию
    const result = await checkBuildCompatibilitySql(components);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Ошибка при проверке совместимости через SQL:", error);
    return NextResponse.json(
      { error: "Ошибка при проверке совместимости" },
      { status: 500 }
    );
  }
}
