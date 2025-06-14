import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/auth/_helpers/auth-helpers";
import { db } from "@/lib/db";
import { products, categories } from "@/lib/db/schema";
import { eq, isNotNull, and, inArray, or } from "drizzle-orm";

async function handler(
  request: NextRequest,
  context: { params: Promise<{ categoryId: string }> }
) {
  if (request.method === "GET") {
    try {
      const { categoryId } = await context.params;
      const parsedCategoryId = parseInt(categoryId);

      if (isNaN(parsedCategoryId)) {
        return NextResponse.json(
          { error: "Invalid category ID" },
          { status: 400 }
        );
      }

      // Получаем информацию о категории
      const category = await db.query.categories.findFirst({
        where: eq(categories.id, parsedCategoryId),
      });

      if (!category) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }

      // Формируем массив ID категорий для поиска
      const categoryIds = [parsedCategoryId];

      // Если это подкатегория, добавляем также родительскую категорию
      if (category.parentId) {
        categoryIds.push(category.parentId);
      }

      // Если это родительская категория, добавляем все её подкатегории
      if (!category.parentId) {
        const subcategories = await db
          .select({ id: categories.id })
          .from(categories)
          .where(eq(categories.parentId, parsedCategoryId));

        categoryIds.push(...subcategories.map((sub) => sub.id));
      }

      const brandsQuery = await db
        .select({ brand: products.brand })
        .from(products)
        .where(
          and(
            inArray(products.categoryId, categoryIds),
            isNotNull(products.brand)
          )
        )
        .groupBy(products.brand);

      const brands = brandsQuery.map((b) => b.brand);

      return NextResponse.json(brands);
    } catch (error) {
      console.error("Error fetching brands:", error);
      return NextResponse.json(
        { error: "Failed to fetch brands" },
        { status: 500 }
      );
    }
  }
}

export const GET = withAuth(handler, ["admin"]);
