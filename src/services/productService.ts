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
import { type Product, type ProductCharacteristic } from "@/types/product";
import { ProductFilters } from "./filterService";

const CACHE_TTL = 3600;

interface CategoryResponse {
  hasSubcategories: boolean;
  subcategories: {
    id: number;
    name: string;
    slug: string;
    icon: string | null;
  }[];
}

export async function getProductsByCategory(
  categorySlug: string,
  filters?: ProductFilters
): Promise<Product[] | CategoryResponse> {
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

  // Получаем продукты с применением фильтров
  const productsQuery = await getFilteredProducts(category[0].id, filters);

  const typedProducts: Product[] = productsQuery.map((product) => ({
    ...product,
    price: Number(product.price),
    characteristics: [],
  }));

  // Кешируем только если нет фильтров
  if (!filters) {
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(typedProducts));
  }

  return typedProducts;
}

export async function getProductsBySubcategory(
  categorySlug: string,
  subcategorySlug: string,
  filters?: ProductFilters
): Promise<Product[]> {
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

  // Получаем продукты с применением фильтров
  const productsQuery = await getFilteredProducts(subcategory[0].id, filters);

  const typedProducts: Product[] = productsQuery.map((product) => ({
    ...product,
    price: Number(product.price),
    characteristics: [],
  }));

  // Кешируем только если нет фильтров
  if (!filters) {
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(typedProducts));
  }

  return typedProducts;
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

  // Получаем характеристики продукта
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

  // Фильтруем и преобразуем характеристики
  const filteredCharacteristics: ProductCharacteristic[] = characteristics
    .filter(
      (char): char is { type: string; value: string } =>
        char.type !== null && char.type !== undefined
    )
    .map((char) => ({
      type: char.type,
      value: char.value,
    }));

  const productWithCharacteristics: Product = {
    ...product[0],
    price: Number(product[0].price),
    characteristics: filteredCharacteristics,
  };

  await redis.setex(
    cacheKey,
    CACHE_TTL,
    JSON.stringify(productWithCharacteristics)
  );
  return productWithCharacteristics;
}

// Вспомогательная функция для получения отфильтрованных продуктов
async function getFilteredProducts(
  categoryId: number,
  filters?: ProductFilters
) {
  // Создаем базовый запрос
  let baseQuery = db
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
    .from(products);

  // Условия для фильтрации
  let conditions = [eq(products.categoryId, categoryId)];

  if (filters) {
    // Применяем фильтр по цене
    if (filters.priceMin !== undefined && filters.priceMax !== undefined) {
      conditions.push(
        between(
          products.price,
          Number(filters.priceMin).toString(),
          Number(filters.priceMax).toString()
        )
      );
    } else if (filters.priceMin !== undefined) {
      conditions.push(
        sql`${products.price} >= ${Number(filters.priceMin).toString()}`
      );
    } else if (filters.priceMax !== undefined) {
      conditions.push(
        sql`${products.price} <= ${Number(filters.priceMax).toString()}`
      );
    }

    // Применяем фильтр по бренду
    if (filters.brands && filters.brands.length > 0) {
      conditions.push(inArray(products.brand, filters.brands));
    }

    // Получаем ID продуктов, которые соответствуют фильтрам характеристик
    if (
      filters.characteristics &&
      Object.keys(filters.characteristics).length > 0
    ) {
      // Для каждого slug характеристики
      for (const [charSlug, selectedValues] of Object.entries(
        filters.characteristics
      )) {
        if (selectedValues.length > 0) {
          // Получаем ID типа характеристики по slug
          const charType = await db
            .select()
            .from(characteristicsTypes)
            .where(eq(characteristicsTypes.slug, charSlug))
            .limit(1);

          if (charType.length > 0) {
            const charTypeId = charType[0].id;

            // Получаем ID продуктов, у которых значение этой характеристики
            // совпадает с одним из выбранных значений
            const matchingProductIds = await db
              .select({ productId: productCharacteristics.productId })
              .from(productCharacteristics)
              .where(
                and(
                  eq(productCharacteristics.characteristicTypeId, charTypeId),
                  inArray(productCharacteristics.value, selectedValues)
                )
              );

            if (matchingProductIds.length > 0) {
              const ids = matchingProductIds.map((p) => p.productId);
              conditions.push(inArray(products.id, ids));
            } else {
              // Если нет продуктов с такими характеристиками, возвращаем пустой результат
              return [];
            }
          }
        }
      }
    }
  }

  // Применяем все условия фильтрации
  return baseQuery.where(and(...conditions)).orderBy(products.price);
}
