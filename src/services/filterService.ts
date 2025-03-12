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
  try {
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

    if (!categoryProducts.length) {
      // Возвращаем пустые фильтры, если продуктов нет
      return {
        priceRange: { min: 0, max: 0 },
        brands: [],
        characteristics: [],
      };
    }

    // Извлекаем все уникальные бренды и считаем их количество
    const brandsMap = new Map<string, number>();
    let minPrice = Infinity;
    let maxPrice = 0;

    categoryProducts.forEach((product) => {
      if (product.brand) {
        brandsMap.set(product.brand, (brandsMap.get(product.brand) || 0) + 1);
      }

      const price = Number(product.price);
      if (!isNaN(price)) {
        minPrice = Math.min(minPrice, price);
        maxPrice = Math.max(maxPrice, price);
      }
    });

    const brands: FilterOption[] = Array.from(brandsMap.entries())
      .filter(([brand]) => brand) // Исключаем пустые бренды
      .map(([value, count]) => ({
        value,
        label: value,
        count,
      }))
      .sort((a, b) => b.count - a.count);

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

    // Собираем значения характеристик
    const characteristicsWithOptions = await Promise.all(
      categoryCharacteristics.map(async (char) => {
        const values = await db
          .select({
            value: productCharacteristics.value,
          })
          .from(productCharacteristics)
          .where(
            and(
              eq(productCharacteristics.characteristic_type_id, char.id),
              inArray(
                productCharacteristics.product_id,
                categoryProducts.map((p) => p.id)
              )
            )
          );

        // Подсчитываем количество каждого значения
        const valueCountMap = new Map<string, number>();
        values.forEach(({ value }) => {
          if (value) {
            valueCountMap.set(value, (valueCountMap.get(value) || 0) + 1);
          }
        });

        return {
          id: char.id,
          name: char.name,
          slug: char.slug,
          options: Array.from(valueCountMap.entries())
            .map(([value, count]) => ({
              value,
              label: value,
              count,
            }))
            .sort((a, b) => b.count - a.count),
        };
      })
    );

    const filters: CategoryFilters = {
      priceRange: {
        min: minPrice === Infinity ? 0 : Math.floor(minPrice),
        max: Math.ceil(maxPrice),
      },
      brands,
      characteristics: characteristicsWithOptions.filter(
        (char) => char.options.length > 0
      ),
    };

    // Кешируем результат
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(filters));

    return filters;
  } catch (error) {
    console.error("Error getting category filters:", error);
    // Возвращаем пустые фильтры в случае ошибки
    return {
      priceRange: { min: 0, max: 0 },
      brands: [],
      characteristics: [],
    };
  }
}

// Интерфейс для фильтров, которые будут передаваться в запросе
export interface ProductFilters {
  priceMin?: number;
  priceMax?: number;
  brands?: string[];
  characteristics?: Record<string, string[]>; // Ключ - slug характеристики, значение - массив выбранных значений
}
