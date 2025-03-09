import { db } from "@/lib/db";
import { categories, type Category as DBCategory } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Category } from "@/types/category";
import { redis } from "@/lib/redis";

const CACHE_TTL = 3600; // 1 час

export async function getAllCategories(): Promise<Category[]> {
  // Пробуем получить данные из кеша
  const cachedCategories = await redis.get("all_categories");
  if (cachedCategories) {
    return JSON.parse(cachedCategories);
  }

  const allCategories = await db.select().from(categories);

  const buildCategoryTree = (parentId: number | null = null): Category[] => {
    return allCategories
      .filter((category) => category.parentId === parentId)
      .map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        icon: category.icon || null,
        children: buildCategoryTree(category.id),
      }));
  };

  const categoryTree = buildCategoryTree(null);

  // Сохраняем в кеш
  await redis.setex("all_categories", CACHE_TTL, JSON.stringify(categoryTree));

  return categoryTree;
}

export async function getCategoryByPath(
  pathSegments: string[]
): Promise<Category | null> {
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
    icon: currentCategory.icon || null,
    children: children.map((child) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      icon: child.icon || null,
      children: [],
    })),
  };

  // Сохраняем в кеш
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(categoryData));

  return categoryData;
}
