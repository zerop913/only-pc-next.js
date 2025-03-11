import { NextRequest, NextResponse } from "next/server";
import {
  getFilteredProducts,
  getProductDetails,
  getProductsByCategory,
  getProductsBySubcategory,
} from "@/services/productService";
import { getCategoryFilters } from "@/services/filterService";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { parseFilterParams } from "@/lib/utils/filterUtils";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const pathSegments = pathname
      .split("/")
      .filter(
        (segment) =>
          segment !== "" && segment !== "api" && segment !== "products"
      );

    // Получаем и валидируем номер страницы
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const filters = parseFilterParams(url.searchParams);

    // Проверяем, запрашиваются ли детали продукта
    const lastSegment = pathSegments[pathSegments.length - 1];
    const isProductDetails = lastSegment?.includes("-p-");

    if (isProductDetails) {
      try {
        const categorySlug = pathSegments[0];
        const productSlug = lastSegment;
        const subcategorySlug =
          pathSegments.length === 3 ? pathSegments[1] : undefined;

        const product = await getProductDetails(
          categorySlug,
          productSlug,
          subcategorySlug
        );
        return NextResponse.json(product);
      } catch (error) {
        console.error("Product details error:", error);
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }
    }

    // Обработка запроса фильтров
    if (url.searchParams.get("filters") === "true") {
      if (pathSegments.length === 0) {
        return NextResponse.json(
          { error: "Category is required" },
          { status: 400 }
        );
      }

      // Сначала находим основную категорию
      const category = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, pathSegments[0]))
        .limit(1);

      if (!category.length) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }

      // Теперь проверяем, запрашиваются ли фильтры для подкатегории
      if (pathSegments.length === 2) {
        const subcategory = await db
          .select()
          .from(categories)
          .where(
            and(
              eq(categories.slug, pathSegments[1]),
              eq(categories.parentId, category[0].id)
            )
          )
          .limit(1);

        if (!subcategory.length) {
          return NextResponse.json(
            { error: "Subcategory not found" },
            { status: 404 }
          );
        }

        const filterOptions = await getCategoryFilters(subcategory[0].id);
        return NextResponse.json(filterOptions);
      }

      // Если это основная категория, возвращаем её фильтры
      const filterOptions = await getCategoryFilters(category[0].id);
      return NextResponse.json(filterOptions);
    }

    // Обработка запроса списка продуктов
    if (pathSegments.length === 2) {
      // Запрос продуктов подкатегории
      try {
        const result = await getProductsBySubcategory(
          pathSegments[0],
          pathSegments[1],
          page,
          filters
        );
        return NextResponse.json(result);
      } catch (error) {
        console.error("Error fetching subcategory products:", error);
        return NextResponse.json(
          { error: "Failed to fetch products" },
          { status: 500 }
        );
      }
    } else if (pathSegments.length === 1) {
      // Запрос продуктов категории
      try {
        const result = await getProductsByCategory(
          pathSegments[0],
          page,
          filters
        );
        return NextResponse.json(result);
      } catch (error) {
        console.error("Error fetching category products:", error);
        return NextResponse.json(
          { error: "Failed to fetch products" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
