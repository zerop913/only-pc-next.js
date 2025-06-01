import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/auth/_helpers/auth-helpers";
import { db } from "@/lib/db";
import {
  products,
  productCharacteristics,
  characteristicsTypes,
  categories,
} from "@/lib/db/schema";
import { eq, and, inArray, or } from "drizzle-orm";

async function handler(
  request: NextRequest,
  context: { params: { categoryId: string } }
) {
  if (request.method === "GET") {
    try {
      const { params } = context;
      const validParams = await Promise.resolve(params);
      const parsedCategoryId = parseInt(validParams.categoryId);

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

      // Формируем массив ID категорий для поиска (текущая + родительская, если есть)
      const categoryIds = [parsedCategoryId];
      if (category.parentId) {
        categoryIds.push(category.parentId);
      }

      // Получаем ID всех продуктов в категории и родительской категории
      const categoryProducts = await db
        .select({ id: products.id })
        .from(products)
        .where(inArray(products.categoryId, categoryIds));

      const productIds = categoryProducts.map((p) => p.id);

      if (productIds.length === 0) {
        return NextResponse.json([]);
      }

      // Получаем уникальные ID характеристик
      const usedCharacteristics = await db
        .select({
          characteristicTypeId: productCharacteristics.characteristic_type_id,
        })
        .from(productCharacteristics)
        .where(inArray(productCharacteristics.product_id, productIds))
        .groupBy(productCharacteristics.characteristic_type_id);

      const characteristicTypeIds = usedCharacteristics.map(
        (c) => c.characteristicTypeId
      );

      if (characteristicTypeIds.length === 0) {
        return NextResponse.json([]);
      }

      // Получаем характеристики
      const characteristics = await db
        .select({
          id: characteristicsTypes.id,
          name: characteristicsTypes.name,
          slug: characteristicsTypes.slug,
        })
        .from(characteristicsTypes)
        .where(inArray(characteristicsTypes.id, characteristicTypeIds))
        .orderBy(characteristicsTypes.id);

      return NextResponse.json(characteristics);
    } catch (error) {
      console.error("Error fetching characteristics:", error);
      return NextResponse.json(
        { error: "Failed to fetch characteristics" },
        { status: 500 }
      );
    }
  }
}

export const GET = withAuth(handler, ["admin"]);
