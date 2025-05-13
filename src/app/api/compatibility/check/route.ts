import { NextRequest, NextResponse } from "next/server";
import { checkComponentsCompatibility } from "@/services/compatibilityService";

export async function POST(request: NextRequest) {
  try {
    const { components } = await request.json();

    console.log("API получил компоненты для проверки:", components);

    if (!components || !Array.isArray(components) || components.length === 0) {
      return NextResponse.json(
        { error: "Необходимо предоставить массив компонентов для проверки" },
        { status: 400 }
      );
    }

    // Проверяем, что каждый компонент имеет необходимые поля
    for (const component of components) {
      if (
        (!component.slug && !component.productSlug) ||
        !component.categorySlug
      ) {
        return NextResponse.json(
          {
            error:
              "Каждый компонент должен иметь slug/productSlug и categorySlug",
          },
          { status: 400 }
        );
      }
    }

    // Преобразуем формат если используется productSlug вместо slug
    const normalizedComponents = components.map((component) => ({
      categorySlug: component.categorySlug,
      slug: component.slug || component.productSlug,
    }));

    // Выполняем проверку совместимости
    console.log(
      "Отправка компонентов в сервис для проверки:",
      normalizedComponents
    );
    const result = await checkComponentsCompatibility(normalizedComponents);
    console.log("Результат проверки совместимости:", result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Ошибка при проверке совместимости:", error);
    return NextResponse.json(
      { error: "Ошибка при проверке совместимости" },
      { status: 500 }
    );
  }
}
