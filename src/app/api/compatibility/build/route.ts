import { NextRequest, NextResponse } from "next/server";
import { checkBuildCompatibility } from "@/services/compatibilityService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { components } = body;

    if (!components || typeof components !== "object") {
      return NextResponse.json(
        { error: "Требуются компоненты сборки" },
        { status: 400 }
      );
    }

    // Используем сервис вместо прямого SQL запроса
    const result = await checkBuildCompatibility(components);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error checking build compatibility:", error);
    return NextResponse.json(
      { error: "Ошибка при проверке совместимости сборки" },
      { status: 500 }
    );
  }
}
