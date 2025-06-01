import { NextRequest, NextResponse } from "next/server";
import { getBuildCompatibilityResult } from "@/services/compatibilityService";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ buildId: string }> }
) {
  try {
    const { buildId } = await context.params;
    const buildIdNum = parseInt(buildId);

    if (isNaN(buildIdNum)) {
      return NextResponse.json(
        { error: "Некорректный ID сборки" },
        { status: 400 }
      );
    }

    const result = await getBuildCompatibilityResult(buildIdNum);

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
