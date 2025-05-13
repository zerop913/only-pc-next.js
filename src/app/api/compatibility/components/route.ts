import { NextRequest, NextResponse } from "next/server";
import { checkComponentsCompatibility } from "@/services/compatibilityService";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categorySlug = searchParams.get("category");
    const components = searchParams.get("components");

    if (!categorySlug || !components) {
      return NextResponse.json(
        { error: "Требуются параметры category и components" },
        { status: 400 }
      );
    }

    // Парсим JSON со списком компонентов
    let componentsObj: Record<string, string>;
    try {
      componentsObj = JSON.parse(components);
    } catch (e) {
      return NextResponse.json(
        { error: "Неверный формат components, ожидается JSON объект" },
        { status: 400 }
      );
    }

    // Формируем массив компонентов для проверки
    const componentsArray = Object.entries(componentsObj).map(
      ([catSlug, productSlug]) => ({
        categorySlug: catSlug,
        slug: productSlug,
      })
    );

    const result = await checkComponentsCompatibility(componentsArray);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error checking component compatibility:", error);
    return NextResponse.json(
      { error: "Ошибка при проверке совместимости" },
      { status: 500 }
    );
  }
}
