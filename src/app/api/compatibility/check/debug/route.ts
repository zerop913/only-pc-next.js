import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, categories } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { components } = await request.json();

    if (!components || !Array.isArray(components) || components.length === 0) {
      return NextResponse.json(
        { error: "Необходимо предоставить массив компонентов для проверки" },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      components.map(async (component) => {
        const { slug, categorySlug } = component;

        // Найти категорию
        const category = await db.query.categories.findFirst({
          where: eq(categories.slug, categorySlug),
        });

        // Найти продукт
        const product = category
          ? await db.query.products.findFirst({
              where: and(
                eq(products.slug, slug),
                eq(products.categoryId, category.id)
              ),
            })
          : null;

        return {
          input: { slug, categorySlug },
          found: {
            category: category
              ? { id: category.id, name: category.name }
              : null,
            product: product
              ? {
                  id: product.id,
                  title: product.title,
                  categoryId: product.categoryId,
                }
              : null,
          },
          success: Boolean(category && product),
        };
      })
    );

    return NextResponse.json({
      results,
      summary: {
        total: components.length,
        found: results.filter((r) => r.success).length,
        notFound: results.filter((r) => !r.success).length,
      },
    });
  } catch (error) {
    console.error("Error debugging compatibility check:", error);
    return NextResponse.json(
      { error: "Ошибка при отладке проверки совместимости" },
      { status: 500 }
    );
  }
}
