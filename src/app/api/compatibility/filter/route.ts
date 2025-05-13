import { NextRequest, NextResponse } from "next/server";
import { getCompatibleComponents } from "@/services/compatibilityService";
import { db } from "@/lib/db";
import { products, categories } from "@/lib/db/schema";
import { inArray, eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categorySlug, buildComponents } = body;

    if (!categorySlug) {
      return NextResponse.json(
        { error: "Требуется slug категории" },
        { status: 400 }
      );
    }

    // Сначала получаем ID категории по slug
    const category = await db.query.categories.findFirst({
      where: eq(categories.slug, categorySlug),
    });

    if (!category) {
      return NextResponse.json(
        { error: "Категория не найдена" },
        { status: 404 }
      );
    }

    // Получаем совместимые компоненты
    const compatibleIds = await getCompatibleComponents(
      categorySlug,
      buildComponents || {}
    );

    // Если список пуст или нет совместимых компонентов, возвращаем все продукты в категории
    if (!compatibleIds.length) {
      const allCategoryProducts = await db.query.products.findMany({
        where: eq(products.categoryId, category.id),
        columns: {
          id: true,
          title: true,
          slug: true,
          price: true,
          image: true,
          brand: true,
          categoryId: true,
        },
      });

      return NextResponse.json(allCategoryProducts);
    }

    // Получаем информацию о совместимых продуктах
    const compatibleProducts = await db
      .select({
        id: products.id,
        title: products.title,
        slug: products.slug,
        price: products.price,
        image: products.image,
        brand: products.brand,
        categoryId: products.categoryId,
      })
      .from(products)
      .where(inArray(products.id, compatibleIds));

    return NextResponse.json(compatibleProducts);
  } catch (error) {
    console.error("Error getting compatible components:", error);
    return NextResponse.json(
      { error: "Ошибка при получении совместимых компонентов" },
      { status: 500 }
    );
  }
}
