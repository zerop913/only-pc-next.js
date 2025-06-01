import { NextRequest, NextResponse } from "next/server";
import { getBuildCompatibilityResult } from "@/services/compatibilityService";

export async function GET(
  request: NextRequest,
  context: { params: { buildId: string } }
) {
  try {
    const { params } = context;
    const buildId = parseInt(params.buildId);

    if (isNaN(buildId)) {
      return NextResponse.json(
        { error: "Некорректный ID сборки" },
        { status: 400 }
      );
    }

    const result = await getBuildCompatibilityResult(buildId);

    if (!result) {
      return NextResponse.json(
        { error: "Результаты проверки не найдены" },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error getting build compatibility result:", error);
    return NextResponse.json(
      { error: "Ошибка при получении результатов проверки" },
      { status: 500 }
    );
  }
}
