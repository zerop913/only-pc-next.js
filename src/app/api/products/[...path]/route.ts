import { NextRequest, NextResponse } from "next/server";
import {
  getProductsByCategory,
  getProductsBySubcategory,
  getProductDetails,
} from "@/services/productService";
import { getCategoryFilters } from "@/services/filterService";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ProductFilters } from "@/services/filterService";

export async function GET(request: NextRequest) {
  try {
    // Получаем путь из URL
    const pathname = new URL(request.url).pathname;
    const pathSegments = pathname
      .split("/")
      .filter(
        (segment) =>
          segment !== "" && segment !== "api" && segment !== "products"
      );

    // Получаем параметры фильтрации из URL
    const url = new URL(request.url);
    const filters: ProductFilters = {};

    // Парсим диапазон цен
    const priceMin = url.searchParams.get("priceMin");
    const priceMax = url.searchParams.get("priceMax");
    if (priceMin) filters.priceMin = Number(priceMin);
    if (priceMax) filters.priceMax = Number(priceMax);

    // Парсим бренды (могут быть указаны несколько)
    const brands = url.searchParams.getAll("brand");
    if (brands.length > 0) filters.brands = brands;

    // Парсим характеристики
    // Формат: char[slug]=value1&char[slug]=value2
    const characteristics: Record<string, string[]> = {};
    for (const [key, value] of url.searchParams.entries()) {
      if (key.startsWith("char[") && key.endsWith("]")) {
        const charSlug = key.slice(5, -1);
        if (!characteristics[charSlug]) {
          characteristics[charSlug] = [];
        }
        characteristics[charSlug].push(value);
      }
    }

    if (Object.keys(characteristics).length > 0) {
      filters.characteristics = characteristics;
    }

    // Параметр для получения только фильтров
    const getFiltersOnly = url.searchParams.get("filters") === "true";

    if (getFiltersOnly) {
      // Если запрос на получение только фильтров
      if (pathSegments.length === 0) {
        return NextResponse.json(
          { error: "Category is required" },
          { status: 400 }
        );
      }

      let categoryId: number;

      if (pathSegments.length === 1) {
        // Получаем ID категории
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

        categoryId = category[0].id;
      } else if (pathSegments.length === 2) {
        // Получаем ID подкатегории
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

        const subcategory = await db
          .select()
          .from(categories)
          .where(eq(categories.slug, pathSegments[1]))
          .limit(1);

        if (!subcategory.length) {
          return NextResponse.json(
            { error: "Subcategory not found" },
            { status: 404 }
          );
        }

        categoryId = subcategory[0].id;
      } else {
        return NextResponse.json({ error: "Invalid path" }, { status: 400 });
      }

      const filterOptions = await getCategoryFilters(categoryId);
      return NextResponse.json(filterOptions);
    }

    // Обычные запросы на получение продуктов
    if (pathSegments.length === 1) {
      const products = await getProductsByCategory(
        pathSegments[0],
        Object.keys(filters).length > 0 ? filters : undefined
      );
      return NextResponse.json(products);
    }

    if (pathSegments.length === 2) {
      try {
        const product = await getProductDetails(
          pathSegments[0],
          pathSegments[1]
        );
        return NextResponse.json(product);
      } catch (error) {
        const products = await getProductsBySubcategory(
          pathSegments[0],
          pathSegments[1],
          Object.keys(filters).length > 0 ? filters : undefined
        );
        return NextResponse.json(products);
      }
    }

    if (pathSegments.length === 3) {
      const product = await getProductDetails(
        pathSegments[0],
        pathSegments[2],
        pathSegments[1]
      );
      return NextResponse.json(product);
    }

    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  } catch (error) {
    console.error("Products fetch error:", error);
    if (error instanceof Error && error.message.includes("not found")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
