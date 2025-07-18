import { NextRequest, NextResponse } from "next/server";
import {
  getFilteredProducts,
  getProductDetails,
  getProductsByCategory,
  getProductsBySubcategory,
} from "@/services/productService";
import {
  getCategoryFilters,
  getDynamicFilters,
} from "@/services/filterService";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { parseFilterParams } from "@/lib/utils/filterUtils";
import { ProductFilters } from "@/components/configurator/filters/types/filters";
import { Product } from "@/types/product";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const pathSegments = pathname
      .split("/")
      .filter(
        (segment) =>
          segment !== "" && segment !== "api" && segment !== "products"
      ); // Отладочные логи с более точной информацией
    console.log("API Debug: pathSegments", pathSegments);

    // Проверяем безопасность URL
    try {
      console.log("API Debug: url", url.toString());
    } catch (e) {
      console.error("API Debug: Invalid URL - ", e);
    }

    // Определяем тип запроса по последнему сегменту пути
    const lastSegment = pathSegments[pathSegments.length - 1];
    const isProductRequest = lastSegment && lastSegment.includes("-p-");
    const isFilterRequest = url.searchParams.get("filters") === "true";

    try {
      if (isFilterRequest) {
        return await handleFilterRequest(pathSegments, request);
      } else if (isProductRequest) {
        return await handleProductRequest(pathSegments);
      } else {
        return await handleProductListRequest(
          pathSegments,
          Math.max(1, Number(url.searchParams.get("page")) || 1),
          parseFilterParams(url.searchParams),
          request
        );
      }
    } catch (error: any) {
      console.error("Request handling error:", error);
      return NextResponse.json(
        { error: error.message || "Internal server error" },
        { status: error.status || 500 }
      );
    }
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Обработчики запросов
async function handleFilterRequest(
  pathSegments: string[],
  request: NextRequest
) {
  const categorySlug = pathSegments[0];
  const subcategorySlug = pathSegments[1];
  const url = new URL(request.url);

  // Проверяем запрашиваются ли динамические фильтры
  const isDynamic = url.searchParams.get("dynamic") === "true";
  let activeFilters: ProductFilters | undefined;

  // Если запрашиваются динамические фильтры, извлекаем данные о фильтрах
  if (isDynamic) {
    const filterDataParam = url.searchParams.get("filterData");
    if (filterDataParam) {
      try {
        activeFilters = JSON.parse(decodeURIComponent(filterDataParam));
      } catch (error) {
        console.error("Failed to parse filter data:", error);
      }
    }
  }

  const category = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, categorySlug))
    .limit(1);

  if (!category.length) {
    throw { message: "Category not found", status: 404 };
  }

  if (subcategorySlug) {
    const subcategory = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.slug, subcategorySlug),
          eq(categories.parentId, category[0].id)
        )
      )
      .limit(1);

    if (!subcategory.length) {
      throw { message: "Subcategory not found", status: 404 };
    }

    // Если запрашиваются динамические фильтры и есть данные о фильтрах, используем getDynamicFilters
    let filterOptions;
    if (isDynamic && activeFilters) {
      filterOptions = await getDynamicFilters(subcategory[0].id, activeFilters);
    } else {
      filterOptions = await getCategoryFilters(subcategory[0].id);
    }
    return NextResponse.json(filterOptions);
  }

  // Если запрашиваются динамические фильтры и есть данные о фильтрах, используем getDynamicFilters
  let filterOptions;
  if (isDynamic && activeFilters) {
    filterOptions = await getDynamicFilters(category[0].id, activeFilters);
  } else {
    filterOptions = await getCategoryFilters(category[0].id);
  }
  return NextResponse.json(filterOptions);
}

async function handleProductRequest(pathSegments: string[]) {
  try {
    const productSlug = pathSegments[pathSegments.length - 1];
    const categorySlug = pathSegments[0];
    const subcategorySlug =
      pathSegments.length === 3 ? pathSegments[1] : undefined;

    console.log("API: Processing request:", {
      productSlug,
      categorySlug,
      subcategorySlug,
      path: pathSegments,
    });

    const product = await getProductDetails(
      categorySlug,
      productSlug,
      subcategorySlug
    );

    if (!product || typeof product !== "object") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Проверяем обязательные поля
    const requiredFields = ["id", "title", "slug", "price"] as const;
    const missingFields = requiredFields.filter((field) => {
      const value = product[field];
      return (
        value === undefined ||
        value === null ||
        (typeof value === "string" && !value.trim()) ||
        (typeof value === "number" && isNaN(value))
      );
    });

    if (missingFields.length > 0) {
      console.error("API: Invalid product data:", { product, missingFields });
      return NextResponse.json(
        { error: `Missing or invalid fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    return NextResponse.json(product);
  } catch (error: any) {
    console.error("API: Product request error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch product" },
      { status: error.status || 500 }
    );
  }
}

async function handleProductListRequest(
  pathSegments: string[],
  page: number,
  filters?: ProductFilters,
  request?: Request
): Promise<NextResponse> {
  // Получаем sortOrder из URL параметров, явно указываем тип
  const url = new URL(request?.url || "");
  const sortOrder = (url.searchParams.get("sort") || "asc") as "asc" | "desc";

  if (pathSegments.length === 2) {
    const result = await getProductsBySubcategory(
      pathSegments[0],
      pathSegments[1],
      page,
      filters,
      sortOrder
    );
    return NextResponse.json(result);
  }

  if (pathSegments.length === 1) {
    const result = await getProductsByCategory(
      pathSegments[0],
      page,
      filters,
      sortOrder
    );
    return NextResponse.json(result);
  }

  throw { message: "Invalid path", status: 400 };
}
