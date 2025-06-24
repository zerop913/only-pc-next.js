import { db } from "@/lib/db";
import { categories, type Category as DBCategory } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Category, CategoryWithChildren } from "@/types/category";
import { redis } from "@/lib/redis";

const CACHE_TTL = 900; // 30 минут

export async function getAllCategories(): Promise<CategoryWithChildren[]> {
  try {
    console.log("[CategoryService] Getting all categories");
    
    // Пробуем получить данные из кеша
    try {
      const cachedCategories = await redis.get("all_categories");
      if (cachedCategories) {
        console.log("[CategoryService] Categories loaded from cache");
        return JSON.parse(cachedCategories);
      }
    } catch (redisError) {
      console.warn("[CategoryService] Redis cache failed, continuing without cache:", redisError);
    }

    console.log("[CategoryService] Loading categories from database");
    const allCategories = await db.select().from(categories);
    console.log("[CategoryService] Loaded categories from DB:", allCategories.length);

    const buildCategoryTree = (
      parentId: number | null = null
    ): CategoryWithChildren[] => {
      return allCategories
        .filter((category) => category.parentId === parentId)
        .map((category) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          parentId: category.parentId,
          icon: category.icon || null,
          productCount: 0, // По умолчанию ставим 0, так как точное количество неизвестно
          children: buildCategoryTree(category.id),
        }));
    };

    const categoryTree = buildCategoryTree(null);
    console.log("[CategoryService] Built category tree:", categoryTree.length);

    // Сохраняем в кеш
    try {
      await redis.setex("all_categories", CACHE_TTL, JSON.stringify(categoryTree));
      console.log("[CategoryService] Categories saved to cache");
    } catch (redisError) {
      console.warn("[CategoryService] Failed to save to cache:", redisError);
    }

    return categoryTree;
  } catch (error) {
    console.error("[CategoryService] Error getting categories:", error);
    throw error;
  }
}

export async function getCategoryByPath(
  pathSegments: string[]
): Promise<CategoryWithChildren | null> {
  // Пробуем получить данные из кеша
  const cacheKey = `category_path:${pathSegments.join("/")}`;
  const cachedCategory = await redis.get(cacheKey);
  if (cachedCategory) {
    return JSON.parse(cachedCategory);
  }

  let currentCategory: DBCategory | null = null;

  for (const slug of pathSegments) {
    const category = await db
      .select()
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);

    if (!category.length) {
      return null;
    }

    currentCategory = category[0];
  }

  if (!currentCategory) {
    return null;
  }

  const children = await db
    .select()
    .from(categories)
    .where(eq(categories.parentId, currentCategory.id));

  const categoryData = {
    id: currentCategory.id,
    name: currentCategory.name,
    slug: currentCategory.slug,
    parentId: currentCategory.parentId,
    icon: currentCategory.icon || null,
    productCount: 0, // По умолчанию ставим 0, так как точное количество неизвестно
    children: children.map((child) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      parentId: child.parentId,
      icon: child.icon || null,
      productCount: 0, // По умолчанию ставим 0
      children: [],
    })),
  };

  // Сохраняем в кеш
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(categoryData));

  return categoryData;
}
