import { db } from "@/lib/db";
import {
  characteristicsTypes,
  categoryFilterCharacteristics,
  products,
  productCharacteristics,
} from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { redis } from "@/lib/redis";

const CACHE_TTL = 3600; // 1 час

export interface FilterOption {
  value: string;
  label: string;
  count: number;
}

export interface PriceRange {
  min: number;
  max: number;
}

export interface CategoryFilters {
  priceRange: PriceRange;
  brands: FilterOption[];
  characteristics: {
    id: number;
    name: string;
    slug: string;
    options: FilterOption[];
  }[];
}

// Получить все доступные фильтры для категории
export async function getCategoryFilters(
  categoryId: number
): Promise<CategoryFilters> {
  const cacheKey = `category_${categoryId}_filters`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  // Получаем все продукты в категории
  const categoryProducts = await db
    .select({
      id: products.id,
      price: products.price,
      brand: products.brand,
    })
    .from(products)
    .where(eq(products.categoryId, categoryId));

  // Извлекаем все уникальные бренды и считаем их количество
  const brandsMap = new Map<string, number>();
  let minPrice = Infinity;
  let maxPrice = 0;

  categoryProducts.forEach((product) => {
    // Подсчет брендов
    const brand = product.brand;
    brandsMap.set(brand, (brandsMap.get(brand) || 0) + 1);

    // Определение диапазона цен
    const price = Number(product.price);
    if (price < minPrice) minPrice = price;
    if (price > maxPrice) maxPrice = price;
  });

  const brands: FilterOption[] = Array.from(brandsMap.entries()).map(
    ([value, count]) => ({
      value,
      label: value,
      count,
    })
  );

  // Получаем характеристики для данной категории
  const categoryCharacteristics = await db
    .select({
      id: characteristicsTypes.id,
      name: characteristicsTypes.name,
      slug: characteristicsTypes.slug,
      position: categoryFilterCharacteristics.position,
    })
    .from(characteristicsTypes)
    .innerJoin(
      categoryFilterCharacteristics,
      eq(
        characteristicsTypes.id,
        categoryFilterCharacteristics.characteristicTypeId
      )
    )
    .where(eq(categoryFilterCharacteristics.categoryId, categoryId))
    .orderBy(categoryFilterCharacteristics.position);

  // Собираем доступные значения для каждой характеристики
  const characteristicsWithOptions = await Promise.all(
    categoryCharacteristics.map(async (characteristic) => {
      // Получаем все значения данной характеристики для продуктов в категории
      const productIds = categoryProducts.map((p) => p.id);

      const characteristicValues = await db
        .select({
          value: productCharacteristics.value,
          productId: productCharacteristics.productId,
        })
        .from(productCharacteristics)
        .where(
          and(
            eq(productCharacteristics.characteristicTypeId, characteristic.id),
            // Используем inArray вместо .in
            inArray(productCharacteristics.productId, productIds)
          )
        );

      // Создаем Map для подсчета количества каждого значения
      const valueCountMap = new Map<string, number>();
      characteristicValues.forEach((item) => {
        valueCountMap.set(item.value, (valueCountMap.get(item.value) || 0) + 1);
      });

      // Формируем опции для характеристики
      const options: FilterOption[] = Array.from(valueCountMap.entries()).map(
        ([value, count]) => ({
          value,
          label: value,
          count,
        })
      );

      return {
        id: characteristic.id,
        name: characteristic.name,
        slug: characteristic.slug,
        options,
      };
    })
  );

  const filters: CategoryFilters = {
    priceRange: {
      min: minPrice === Infinity ? 0 : minPrice,
      max: maxPrice,
    },
    brands: brands.sort((a, b) => b.count - a.count), // Сортируем бренды по популярности
    characteristics: characteristicsWithOptions.filter(
      (char) => char.options.length > 0
    ), // Показываем только характеристики с доступными значениями
  };

  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(filters));

  return filters;
}

// Интерфейс для фильтров, которые будут передаваться в запросе
export interface ProductFilters {
  priceMin?: number;
  priceMax?: number;
  brands?: string[];
  characteristics?: Record<string, string[]>; // Ключ - slug характеристики, значение - массив выбранных значений
}
