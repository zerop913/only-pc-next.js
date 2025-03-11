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
} from "drizzle-orm";
import { redis } from "@/lib/redis";
import {
  type Product,
  type ProductCharacteristic,
  type CategoryResponse,
} from "@/types/product";
import { ProductFilters } from "./filterService";

const CACHE_TTL = 3600; // 1 час
const FILTERED_CACHE_TTL = 300; // 5 минут для отфильтрованных результатов
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
const mapProduct = (product: any): Product => ({
  id: product.id,
  slug: product.slug,
  title: product.title,
  price: Number(product.price),
  brand: product.brand,
  image: product.image,
  description: product.description,
  categoryId: product.categoryId,
  characteristics: [],
});

export async function getProductsByCategory(
  categorySlug: string,
  page: number = 1,
  filters?: ProductFilters
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
  return getFilteredProducts(category[0].id, page, filters);
}

export async function getProductsBySubcategory(
  categorySlug: string,
  subcategorySlug: string,
  page: number = 1,
  filters?: ProductFilters
): Promise<PaginatedProducts> {
  // Если нет фильтров, попытаемся использовать кеш
  const cacheKey = `products_subcategory_${categorySlug}_${subcategorySlug}`;
  const cachedData = !filters ? await redis.get(cacheKey) : null;

  if (cachedData) {
    return JSON.parse(cachedData);
  }

  // Находим категорию и подкатегорию
  const category = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, categorySlug))
    .limit(1);

  if (!category.length) {
    throw new Error("Category not found");
  }

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
    throw new Error("Subcategory not found");
  }

  // Заменяем старый вызов на новый
  return getFilteredProducts(subcategory[0].id, page, filters);
}

export async function getProductDetails(
  categorySlug: string,
  productSlug: string,
  subcategorySlug?: string
): Promise<Product> {
  const cacheKey = `product_details_${categorySlug}_${
    subcategorySlug || ""
  }_${productSlug}`;
  const cachedData = await redis.get(cacheKey);

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

  let targetCategoryId = category[0].id;

  // Если указана подкатегория, находим ее
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
      throw new Error("Subcategory not found");
    }

    targetCategoryId = subcategory[0].id;
  }

  // Получаем детали продукта
  const product = await db
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
    .where(
      and(
        eq(products.slug, productSlug),
        eq(products.categoryId, targetCategoryId)
      )
    )
    .limit(1);

  if (!product.length) {
    throw new Error("Product not found");
  }

  // Получаем характеристики продукта с правильной типизацией
  const characteristics = await db
    .select({
      type: characteristicsTypes.name,
      value: productCharacteristics.value,
    })
    .from(productCharacteristics)
    .leftJoin(
      characteristicsTypes,
      eq(productCharacteristics.characteristicTypeId, characteristicsTypes.id)
    )
    .where(
      and(
        eq(productCharacteristics.productId, product[0].id),
        isNotNull(characteristicsTypes.name)
      )
    );

  // Фильтруем и преобразуем характеристики с правильной типизацией
  const filteredCharacteristics: ProductCharacteristic[] = characteristics
    .filter(
      (char): char is { type: string; value: string } =>
        typeof char.type === "string" && char.type !== null
    )
    .map(({ type, value }) => ({
      type,
      value,
    }));

  const productWithCharacteristics: Product = {
    ...mapProduct(product[0]),
    characteristics: filteredCharacteristics,
  };

  await redis.setex(
    cacheKey,
    CACHE_TTL,
    JSON.stringify(productWithCharacteristics)
  );
  return productWithCharacteristics;
}

// Удаляем старую версию getFilteredProducts и оставляем только эту
export async function getFilteredProducts(
  categoryId: number,
  page: number = 1,
  filters?: ProductFilters
): Promise<PaginatedProducts> {
  const validPage = Math.max(1, page);
  const cacheKey = createFilterCacheKey(categoryId, filters, validPage);

  try {
    // Пытаемся получить данные из кеша
    const cachedData = await redis.get(cacheKey);
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
                .select({ productId: productCharacteristics.productId })
                .from(productCharacteristics)
                .where(
                  and(
                    eq(productCharacteristics.characteristicTypeId, charTypeId),
                    inArray(productCharacteristics.value, values)
                  )
                );

              if (matchingProductIds.length) {
                conditions.push(
                  inArray(
                    products.id,
                    matchingProductIds.map((p) => p.productId)
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
        // Добавляем стабильную сортировку по нескольким полям
        .orderBy(products.price, products.id),
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
              productId: productCharacteristics.productId,
              type: characteristicsTypes.name,
              value: productCharacteristics.value,
            })
            .from(productCharacteristics)
            .leftJoin(
              characteristicsTypes,
              eq(
                productCharacteristics.characteristicTypeId,
                characteristicsTypes.id
              )
            )
            .where(inArray(productCharacteristics.productId, productIds))
        : [];

    // Формируем результат
    const result: PaginatedProducts = {
      products: productsResult.map((product) => ({
        ...mapProduct(product),
        characteristics: characteristics
          .filter((c) => c.productId === product.id)
          .map(({ type, value }) => ({ type, value })),
      })),
      totalItems,
      totalPages,
      currentPage,
    };

    // Кешируем результат
    const cacheTTL = filters ? FILTERED_CACHE_TTL : CACHE_TTL;
    await redis.setex(cacheKey, cacheTTL, JSON.stringify(result));

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
