import { NextRequest, NextResponse } from "next/server";
import { checkComponentsCompatibility } from "@/services/compatibilityService";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq, or, sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId1, productId2 } = body;

    if (!productId1 || !productId2) {
      return NextResponse.json(
        { error: "Требуются идентификаторы обоих продуктов" },
        { status: 400 }
      );
    }

    // Проверяем, существуют ли оба продукта
    const productsExist = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(or(eq(products.id, productId1), eq(products.id, productId2)));

    if (parseInt(productsExist[0].count.toString()) !== 2) {
      return NextResponse.json(
        { error: "Один или оба продукта не найдены" },
        { status: 404 }
      );
    }

    // Получаем категории и слаги продуктов
    const product1 = await db.query.products.findFirst({
      where: eq(products.id, productId1),
      with: { category: true },
    });

    const product2 = await db.query.products.findFirst({
      where: eq(products.id, productId2),
      with: { category: true },
    });

    if (!product1 || !product2) {
      return NextResponse.json(
        { error: "Один или оба продукта не найдены" },
        { status: 404 }
      );
    }

    // Создаем массив компонентов в формате, который ожидает checkComponentsCompatibility
    const components = [
      {
        categorySlug: product1.category.slug,
        slug: product1.slug,
      },
      {
        categorySlug: product2.category.slug,
        slug: product2.slug,
      },
    ];

    // Используем сервис совместимости
    const result = await checkComponentsCompatibility(components);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error checking compatibility:", error);
    return NextResponse.json(
      { error: "Ошибка при проверке совместимости" },
      { status: 500 }
    );
  }
}
