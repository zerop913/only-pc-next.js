import { db } from "@/lib/db";
import {
  characteristicsTypes,
  categoryFilterCharacteristics,
  products,
  productCharacteristics,
} from "@/lib/db/schema";
import { eq, and, inArray, between, sql } from "drizzle-orm";
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
  categoryId: number,
  activeFilters?: ProductFilters
): Promise<CategoryFilters> {
  try {
    // Если нет активных фильтров, используем кеш
    if (!activeFilters || Object.keys(activeFilters).length === 0) {
      const cacheKey = `category_${categoryId}_filters`;
      const cached = await redis.get(cacheKey);

      if (cached) {
        return JSON.parse(cached);
      }
    } // Используем подход с условиями вместо цепочки .where()
    let conditions = [eq(products.categoryId, categoryId)];

    // Применяем активные фильтры к запросу продуктов
    if (activeFilters) {
      // Применяем фильтр по цене
      if (
        activeFilters.priceMin !== undefined &&
        activeFilters.priceMax !== undefined
      ) {
        conditions.push(
          between(
            products.price,
            activeFilters.priceMin.toString(),
            activeFilters.priceMax.toString()
          )
        );
      } else if (activeFilters.priceMin !== undefined) {
        conditions.push(
          sql`${products.price} >= ${activeFilters.priceMin.toString()}`
        );
      } else if (activeFilters.priceMax !== undefined) {
        conditions.push(
          sql`${products.price} <= ${activeFilters.priceMax.toString()}`
        );
      }

      // Применяем фильтр по бренду
      if (activeFilters.brands?.length) {
        conditions.push(inArray(products.brand, activeFilters.brands));
      } // Фильтрация по характеристикам
      if (activeFilters.characteristics) {
        for (const [slug, values] of Object.entries(
          activeFilters.characteristics
        )) {
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
                    ),
                    inArray(productCharacteristics.value, values)
                  )
                );

              if (matchingProductIds.length) {
                conditions.push(
                  inArray(
                    products.id,
                    matchingProductIds.map(
                      (p: { product_id: number }) => p.product_id
                    )
                  )
                );
              }
            }
          }
        }
      }
    }

    // Выполняем запрос с условиями, собранными выше
    const categoryProducts = await db
      .select({
        id: products.id,
        price: products.price,
        brand: products.brand,
      })
      .from(products)
      .where(and(...conditions));

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
    categoryProducts.forEach(
      (product: { brand: string; price: string; id: number }) => {
        if (product.brand) {
          brandsMap.set(product.brand, (brandsMap.get(product.brand) || 0) + 1);
        }

        const price = Number(product.price);
        if (!isNaN(price)) {
          minPrice = Math.min(minPrice, price);
          maxPrice = Math.max(maxPrice, price);
        }
      }
    );

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
      .orderBy(categoryFilterCharacteristics.position); // Собираем значения характеристик
    const characteristicsWithOptions = await Promise.all(
      categoryCharacteristics.map(async (char) => {
        // Получаем только уникальные базовые значения, без составных
        const allValues = await db
          .select({
            value: productCharacteristics.value,
          })
          .from(productCharacteristics)
          .where(eq(productCharacteristics.characteristic_type_id, char.id));

        // Создаем Map только с базовыми значениями (не составными)
        const valueCountMap = new Map<string, number>();
        allValues.forEach(({ value }) => {
          // Игнорируем составные значения, содержащие запятую
          if (value && !value.includes(",") && !valueCountMap.has(value)) {
            valueCountMap.set(value, 0);
          }
        });

        const values = await db
          .select({
            value: productCharacteristics.value,
            product_id: productCharacteristics.product_id,
          })
          .from(productCharacteristics)
          .where(
            and(
              eq(productCharacteristics.characteristic_type_id, char.id),
              inArray(
                productCharacteristics.product_id,
                categoryProducts.map((p: { id: number }) => p.id)
              )
            )
          );

        // Обрабатываем значения и считаем количество продуктов для каждого
        // Используем Set, чтобы избежать дублирования подсчета для одного продукта
        const productValueMap = new Map<string, Set<number>>();

        values.forEach(({ value, product_id }) => {
          if (value) {
            // Если это одиночное значение
            if (!value.includes(",")) {
              const productSet =
                productValueMap.get(value) || new Set<number>();
              productSet.add(product_id);
              productValueMap.set(value, productSet);
            }
            // Если это составное значение, разбиваем его на отдельные части
            else {
              // Разбираем составное значение на отдельные значения
              const individualValues = value.split(",").map((v) => v.trim());
              individualValues.forEach((individualValue) => {
                if (individualValue) {
                  const productSet =
                    productValueMap.get(individualValue) || new Set<number>();
                  productSet.add(product_id);
                  productValueMap.set(individualValue, productSet);
                }
              });
            }
          }
        });

        // Обновляем количества на основе уникальных продуктов
        for (const [value, productSet] of productValueMap.entries()) {
          if (valueCountMap.has(value)) {
            valueCountMap.set(value, productSet.size);
          }
        }

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
    }; // Кешируем результат только если нет активных фильтров (используем исходный кеш)
    if (!activeFilters || Object.keys(activeFilters).length === 0) {
      const cacheKey = `category_${categoryId}_filters`;
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(filters));
    }

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

/**
 * Получить динамические фильтры с учетом уже примененных фильтров
 * Данная функция используется для обновления доступных опций фильтров после применения выбранных фильтров
 */
export async function getDynamicFilters(
  categoryId: number,
  appliedFilters: ProductFilters
): Promise<CategoryFilters> {
  try {
    // Формируем запрос с базовым условием - нужная категория
    const conditions = [eq(products.categoryId, categoryId)];

    // Сохраняем оригинальный запрос для всех категорий фильтров
    const allFiltersQuery = db
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

    // Применяем фильтры для выборки товаров
    if (appliedFilters) {
      // Применяем фильтр по цене
      if (
        appliedFilters.priceMin !== undefined &&
        appliedFilters.priceMax !== undefined
      ) {
        conditions.push(
          between(
            products.price,
            appliedFilters.priceMin.toString(),
            appliedFilters.priceMax.toString()
          )
        );
      } else if (appliedFilters.priceMin !== undefined) {
        conditions.push(
          sql`${products.price} >= ${appliedFilters.priceMin.toString()}`
        );
      } else if (appliedFilters.priceMax !== undefined) {
        conditions.push(
          sql`${products.price} <= ${appliedFilters.priceMax.toString()}`
        );
      }

      // Применяем фильтр по бренду
      if (appliedFilters.brands?.length) {
        conditions.push(inArray(products.brand, appliedFilters.brands));
      }

      // Фильтрация по характеристикам
      if (appliedFilters.characteristics) {
        for (const [slug, values] of Object.entries(
          appliedFilters.characteristics
        )) {
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
                    ),
                    inArray(productCharacteristics.value, values)
                  )
                );

              if (matchingProductIds.length) {
                conditions.push(
                  inArray(
                    products.id,
                    matchingProductIds.map(
                      (p: { product_id: number }) => p.product_id
                    )
                  )
                );
              }
            }
          }
        }
      }
    }

    // Получаем отфильтрованные продукты
    const filteredProducts = await db
      .select({
        id: products.id,
        price: products.price,
        brand: products.brand,
      })
      .from(products)
      .where(and(...conditions));

    if (!filteredProducts.length) {
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
    filteredProducts.forEach(
      (product: { brand: string; price: string; id: number }) => {
        if (product.brand) {
          brandsMap.set(product.brand, (brandsMap.get(product.brand) || 0) + 1);
        }

        const price = Number(product.price);
        if (!isNaN(price)) {
          minPrice = Math.min(minPrice, price);
          maxPrice = Math.max(maxPrice, price);
        }
      }
    );

    // Формируем список брендов с актуальным количеством
    const brands: FilterOption[] = Array.from(brandsMap.entries())
      .filter(([brand]) => brand) // Исключаем пустые бренды
      .map(([value, count]) => ({
        value,
        label: value,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    // Получаем все доступные характеристики для категории
    const categoryCharacteristics = await allFiltersQuery;

    // Получаем все возможные значения характеристик
    const allCategoryCharacteristics = await Promise.all(
      categoryCharacteristics.map(async (char) => {
        // Получаем только базовые значения для данного типа характеристики
        // Группируем по уникальным, одиночным значениям
        const allValues = await db
          .select({
            value: productCharacteristics.value,
          })
          .from(productCharacteristics)
          .where(eq(productCharacteristics.characteristic_type_id, char.id));

        // Создаем Map со всеми возможными значениями и их количеством, начиная с 0
        const valueCountMap = new Map<string, number>();
        allValues.forEach(({ value }) => {
          // Пропускаем составные значения (которые содержат запятую)
          if (value && !value.includes(",") && !valueCountMap.has(value)) {
            valueCountMap.set(value, 0);
          }
        });
        // Получаем значения только для отфильтрованных продуктов
        const filteredValues = await db
          .select({
            value: productCharacteristics.value,
            product_id: productCharacteristics.product_id,
          })
          .from(productCharacteristics)
          .where(
            and(
              eq(productCharacteristics.characteristic_type_id, char.id),
              inArray(
                productCharacteristics.product_id,
                filteredProducts.map((p: { id: number }) => p.id)
              )
            )
          );

        // Обрабатываем значения и считаем количество продуктов для каждого значения
        // Используем Set, чтобы избежать дублирования подсчета для одного продукта с одинаковым значением
        const productValueMap = new Map<string, Set<number>>();

        filteredValues.forEach(({ value, product_id }) => {
          if (value) {
            // Если это одиночное значение
            if (!value.includes(",")) {
              const productSet =
                productValueMap.get(value) || new Set<number>();
              productSet.add(product_id);
              productValueMap.set(value, productSet);
            }
            // Если это составное значение, разбиваем его на отдельные части
            else {
              // Разбираем составное значение на отдельные значения
              const individualValues = value.split(",").map((v) => v.trim());
              individualValues.forEach((individualValue) => {
                if (individualValue) {
                  const productSet =
                    productValueMap.get(individualValue) || new Set<number>();
                  productSet.add(product_id);
                  productValueMap.set(individualValue, productSet);
                }
              });
            }
          }
        });

        // Теперь обновляем количества на основе уникальных идентификаторов продуктов
        for (const [value, productSet] of productValueMap.entries()) {
          if (valueCountMap.has(value)) {
            valueCountMap.set(value, productSet.size);
          }
        }

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

    return {
      priceRange: {
        min: minPrice === Infinity ? 0 : Math.floor(minPrice),
        max: Math.ceil(maxPrice),
      },
      brands,
      characteristics: allCategoryCharacteristics,
    };
  } catch (error) {
    console.error("Error getting dynamic filters:", error);
    // Возвращаем пустые фильтры в случае ошибки
    return {
      priceRange: { min: 0, max: 0 },
      brands: [],
      characteristics: [],
    };
  }
}
