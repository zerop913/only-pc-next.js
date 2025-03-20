import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/auth/_helpers/auth-helpers";
import { db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { Category, CategoryWithChildren } from "@/types/category";

async function handler(request: NextRequest) {
  if (request.method === "GET") {
    try {
      // Получаем все категории с подсчетом товаров
      const allCategories = await db
        .select({
          id: categories.id,
          slug: categories.slug,
          name: categories.name,
          parentId: categories.parentId,
          icon: categories.icon,
          productCount: sql<number>`count(${products.id})::int`,
        })
        .from(categories)
        .leftJoin(products, sql`${products.categoryId} = ${categories.id}`)
        .groupBy(categories.id)
        .orderBy(categories.id);

      const categoriesWithChildren = allCategories.map((cat) => ({
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        parentId: cat.parentId,
        icon: cat.icon,
        productCount: cat.productCount,
        children: [],
      }));

      const categoryTree = buildCategoryTree(categoriesWithChildren);
      return NextResponse.json(categoryTree);
    } catch (error) {
      console.error("Error fetching categories:", error);
      return NextResponse.json(
        { error: "Failed to fetch categories" },
        { status: 500 }
      );
    }
  }
}

function buildCategoryTree(categories: Category[]): CategoryWithChildren[] {
  const categoryMap = new Map<number, CategoryWithChildren>();
  const rootCategories: CategoryWithChildren[] = [];

  // Создаем Map всех категорий
  categories.forEach((category) => {
    categoryMap.set(category.id, { ...category, children: [] });
  });

  // Строим дерево
  categories.forEach((category) => {
    if (category.parentId === null) {
      rootCategories.push(categoryMap.get(category.id)!);
    } else {
      const parent = categoryMap.get(category.parentId);
      if (parent) {
        parent.children.push(categoryMap.get(category.id)!);
      }
    }
  });

  return rootCategories;
}

export const GET = withAuth(handler, ["admin"]);
