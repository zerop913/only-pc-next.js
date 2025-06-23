import { db } from "@/lib/db";
import {
  products,
  categories,
  productCharacteristics,
  characteristicsTypes,
} from "@/lib/db/schema";
import {
  eq,
  and,
  isNotNull,
  desc,
  between,
  inArray,
  or,
  sql,
  asc,
} from "drizzle-orm";
import { redis } from "@/lib/redis";
import {
  type Product,
  type ProductCharacteristic,
  type SimpleProductCharacteristic,
  type CategoryResponse,
} from "@/types/product";
import { ProductFilters } from "@/components/configurator/filters/types/filters";

const CACHE_TTL = 900; // 15 минут
const FILTERED_CACHE_TTL = 120; // 2 минуты для отфильтрованных результатов
const PAGE_SIZE = 30;

export interface PaginatedProducts {
  products: Product[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

// Обновляем функцию createFilterCacheKey, объединяя обе версии
const createFilterCacheKey = (
  categoryId: number,
  filters?: ProductFilters,
  page: number = 1
): string => {
  const baseKey = `products_category_${categoryId}_page_${page}`;

  if (!filters || Object.keys(filters).length === 0) {
    return baseKey;
  }

  const filterKey = JSON.stringify({
    priceMin: filters.priceMin,
    priceMax: filters.priceMax,
    brands: filters.brands?.sort(),
    characteristics: Object.entries(filters.characteristics || {}).sort(),
  });

  return `${baseKey}_filters_${Buffer.from(filterKey).toString("base64")}`;
};

// Обновляем маппинг продукта
const mapProduct = (product: any): Omit<Product, "characteristics"> => ({
  id: product.id,
  slug: product.slug,
  title: product.title,
  price: Number(product.price),
  brand: product.brand || "",
  image: product.image,
  description: product.description,
  categoryId: product.categoryId,
  createdAt: product.createdAt
    ? new Date(product.createdAt).toISOString()
    : new Date().toISOString(),
  category: product.category
    ? {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
      }
    : undefined,
});

// Исправляем маппинг характеристик
const mapCharacteristics = (chars: any[]): SimpleProductCharacteristic[] => {
  return chars
    .filter((char) => char.type && char.value) // Фильтруем null значения
    .map(({ type, value }) => ({
      type: String(type),
      value: String(value),
    }));
};

export async function getProductsByCategory(
  categorySlug: string,
  page: number = 1,
  filters?: ProductFilters,
  sortOrder: "asc" | "desc" = "asc"
): Promise<PaginatedProducts | CategoryResponse> {
  // Если нет фильтров, попытаемся использовать кеш
  const cacheKey = `products_category_${categorySlug}`;
  const cachedData = !filters ? await redis.get(cacheKey) : null;

  if (cachedData) {
    return JSON.parse(cachedData);
  }

  // Находим категорию
  const category = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, categorySlug))
    .limit(1);

  if (!category.length) {
    throw new Error("Category not found");
  }

  // Проверяем наличие подкатегорий
  const subcategories = await db
    .select()
    .from(categories)
    .where(eq(categories.parentId, category[0].id));

  if (subcategories.length > 0) {
    const result: CategoryResponse = {
      hasSubcategories: true,
      subcategories: subcategories.map((sub) => ({
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
        icon: sub.icon,
      })),
    };

    // Кешируем только если нет фильтров
    if (!filters) {
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
    }

    return result;
  }

  // Заменяем старый вызов на новый
  return getFilteredProducts(category[0].id, page, filters, sortOrder);
}

export async function getProductsBySubcategory(
  categorySlug: string,
  subcategorySlug: string,
  page: number = 1,
  filters?: ProductFilters,
  sortOrder: "asc" | "desc" = "asc"
): Promise<PaginatedProducts> {
  try {
    // Если нет фильтров, попытаемся использовать кеш
    const cacheKey = `products_subcategory_${categorySlug}_${subcategorySlug}`;
    const cachedData = !filters ? await redis.get(cacheKey) : null;

    if (cachedData) {
      return JSON.parse(cachedData);
    }

    // Находим категорию
    const category = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, categorySlug))
      .limit(1);

    if (!category.length) {
      throw new Error("Category not found");
    }

    // Находим подкатегорию
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

    // Используем ID основной категории, если подкатегория не найдена
    const targetCategoryId = subcategory.length
      ? subcategory[0].id
      : category[0].id;

    return getFilteredProducts(targetCategoryId, page, filters, sortOrder);
  } catch (error) {
    console.error("Error in getProductsBySubcategory:", error);
    throw error;
  }
}

export async function getProductDetails(
  categorySlug: string,
  productSlug: string,
  subcategorySlug?: string
): Promise<Product> {
  try {
    // Очищаем слаг от -p- и числа
    const cleanProductSlug = productSlug.split("-p-")[0];

    console.log("Service Debug: Product request", {
      originalSlug: productSlug,
      cleanSlug: cleanProductSlug,
      categorySlug,
      subcategorySlug,
    });

    // Получаем продукт без проверки категории
    const productQuery = await db
      .select()
      .from(products)
      .where(eq(products.slug, cleanProductSlug))
      .limit(1);

    if (!productQuery.length) {
      throw new Error(`Product not found: ${cleanProductSlug}`);
    }

    const rawProduct = productQuery[0];

    // Формируем результат
    const result: Product = {
      id: Number(rawProduct.id),
      slug: String(rawProduct.slug),
      title: String(rawProduct.title),
      price: Number(rawProduct.price),
      brand: String(rawProduct.brand || ""),
      image: rawProduct.image || null,
      description: rawProduct.description || null,
      categoryId: Number(rawProduct.categoryId),
      characteristics: [],
      createdAt: rawProduct.createdAt
        ? new Date(rawProduct.createdAt).toISOString()
        : new Date().toISOString(),
    };

    // Загружаем характеристики
    const characteristics = await db
      .select({
        type: characteristicsTypes.name,
        value: productCharacteristics.value,
      })
      .from(productCharacteristics)
      .leftJoin(
        characteristicsTypes,
        eq(
          productCharacteristics.characteristic_type_id,
          characteristicsTypes.id
        )
      )
      .where(eq(productCharacteristics.product_id, result.id));

    result.characteristics = characteristics
      .filter((char) => char.type && char.value)
      .map(({ type, value }) => ({
        type: String(type),
        value: String(value),
      }));

    return result;
  } catch (error) {
    console.error("Service Error in getProductDetails:", error);
    throw error;
  }
}

// Удаляем старую версию getFilteredProducts и оставляем только эту
export async function getFilteredProducts(
  categoryId: number,
  page: number = 1,
  filters?: ProductFilters,
  sortOrder: "asc" | "desc" = "asc"
): Promise<PaginatedProducts> {
  try {
    const validPage = Math.max(1, page);
    const cacheKey = createFilterCacheKey(categoryId, filters, validPage);

    // Отключаем кеширование при использовании сортировки для получения актуальных данных
    const cachedData = sortOrder === "asc" ? await redis.get(cacheKey) : null;

    // Добавляем проверку на существование категории
    const categoryExists = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1);

    if (!categoryExists.length) {
      return {
        products: [],
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
      };
    }

    // Пытаемся получить данные из кеша
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      if (parsed.products) return parsed;
    }

    // Базовый запрос с оптимизированной выборкой
    let query = db
      .select({
        id: products.id,
        slug: products.slug,
        title: products.title,
        price: products.price,
        brand: products.brand,
        image: products.image,
        description: products.description,
        categoryId: products.categoryId,
      })
      .from(products)
      .where(eq(products.categoryId, categoryId));

    // Добавляем условия фильтрации
    const conditions = [eq(products.categoryId, categoryId)];

    // Оптимизируем применение фильтров
    if (filters) {
      // Применяем фильтр по цене
      if (filters.priceMin !== undefined && filters.priceMax !== undefined) {
        conditions.push(
          between(
            products.price,
            filters.priceMin.toString(),
            filters.priceMax.toString()
          )
        );
      } else if (filters.priceMin !== undefined) {
        conditions.push(
          sql`${products.price} >= ${filters.priceMin.toString()}`
        );
      } else if (filters.priceMax !== undefined) {
        conditions.push(
          sql`${products.price} <= ${filters.priceMax.toString()}`
        );
      }

      // Применяем фильтр по бренду
      if (filters.brands?.length) {
        conditions.push(inArray(products.brand, filters.brands));
      }

      // Фильтрация по характеристикам
      if (filters.characteristics) {
        for (const [slug, values] of Object.entries(filters.characteristics)) {
          if (values.length) {
            const charType = await db
              .select()
              .from(characteristicsTypes)
              .where(eq(characteristicsTypes.slug, slug))
              .limit(1);

            if (charType.length) {
              const charTypeId = charType[0].id;
              const matchingProductIds = await db
                .select({ product_id: productCharacteristics.product_id })
                .from(productCharacteristics)
                .where(
                  and(
                    eq(
                      productCharacteristics.characteristic_type_id,
                      charTypeId
                    ), // Исправляем имя поля
                    inArray(productCharacteristics.value, values)
                  )
                );

              if (matchingProductIds.length) {
                conditions.push(
                  inArray(
                    products.id,
                    matchingProductIds.map((p) => p.product_id)
                  )
                );
              }
            }
          }
        }
      }
    }

    // Получаем общее количество товаров с оптимизированным запросом
    const [[{ count }], productsResult] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(and(...conditions)),
      db
        .select()
        .from(products)
        .where(and(...conditions))
        .limit(PAGE_SIZE)
        .offset((validPage - 1) * PAGE_SIZE)
        .orderBy(
          // Добавляем явную типизацию для price
          sortOrder === "asc"
            ? sql`CAST(${products.price} AS DECIMAL)`
            : sql`CAST(${products.price} AS DECIMAL) DESC`
        ),
    ]);

    const totalItems = Number(count);
    const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
    const currentPage = Math.min(validPage, totalPages);

    // Оптимизируем загрузку характеристик
    const productIds = productsResult.map((p) => p.id);
    const characteristics =
      productIds.length > 0
        ? await db
            .select({
              product_id: productCharacteristics.product_id,
              type: characteristicsTypes.name,
              value: productCharacteristics.value,
            })
            .from(productCharacteristics)
            .leftJoin(
              characteristicsTypes,
              eq(
                productCharacteristics.characteristic_type_id,
                characteristicsTypes.id
              )
            )
            .where(inArray(productCharacteristics.product_id, productIds))
        : [];

    // Формируем результат
    const result: PaginatedProducts = {
      products: productsResult.map((product) => ({
        ...mapProduct(product),
        characteristics: mapCharacteristics(
          characteristics.filter((c) => c.product_id === product.id)
        ),
      })),
      totalItems,
      totalPages,
      currentPage,
    };

    // Изменяем время кеширования и добавляем sortOrder в ключ кеша
    const cacheTTL = filters ? FILTERED_CACHE_TTL : CACHE_TTL;
    const cacheKeyWithSort = `${cacheKey}_sort_${sortOrder}`;
    await redis.setex(cacheKeyWithSort, cacheTTL, JSON.stringify(result));

    return result;
  } catch (error) {
    console.error("Error in getFilteredProducts:", error);
    return {
      products: [],
      totalItems: 0,
      totalPages: 1,
      currentPage: 1,
    };
  }
}

// Добавляем функцию для предварительной загрузки популярных комбинаций фильтров
export async function prefetchPopularFilters(
  categoryId: number,
  page: number = 1
) {
  const popularFilters: ProductFilters[] = [
    {}, // без фильтров
    { priceMin: 0, priceMax: 15000 }, // бюджетный сегмент
    { priceMin: 15000, priceMax: 50000 }, // средний сегмент
    { priceMin: 50000 }, // премиум сегмент
  ];

  await Promise.all(
    popularFilters.map((filters) =>
      getFilteredProducts(categoryId, page, filters)
    )
  );
}
