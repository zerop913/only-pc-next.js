import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/auth/_helpers/auth-helpers";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { sql, ilike, or, and, eq } from "drizzle-orm";

const ITEMS_PER_PAGE = 12;

async function handler(request: NextRequest) {
  if (request.method === "GET") {
    try {
      const { searchParams } = new URL(request.url);
      const page = Math.max(1, Number(searchParams.get("page")) || 1);
      const search = searchParams.get("search") || "";
      const categoryId = searchParams.get("category");
      const offset = (page - 1) * ITEMS_PER_PAGE;

      const conditions = [];

      // Поисковый фильтр
      if (search) {
        conditions.push(
          or(
            ilike(products.title, `%${search}%`),
            ilike(products.brand, `%${search}%`),
            ilike(products.description || "", `%${search}%`)
          )
        );
      }

      // Фильтр по категории (только если категория указана)
      if (categoryId && categoryId !== "null" && !isNaN(Number(categoryId))) {
        conditions.push(eq(products.categoryId, Number(categoryId)));
      }

      const finalCondition =
        conditions.length > 0 ? and(...conditions) : undefined;

      // Получаем общее количество с учетом фильтров
      const [totalCountResult] = await db
        .select({
          count: sql<number>`cast(count(*) as integer)`,
        })
        .from(products)
        .where(finalCondition || sql`TRUE`);

      // Получаем товары с учетом фильтров
      const allProducts = await db.query.products.findMany({
        limit: ITEMS_PER_PAGE,
        offset,
        where: finalCondition,
        orderBy: (products, { desc }) => [desc(products.id)],
        with: {
          category: true,
        },
      });

      const totalPages = Math.ceil(totalCountResult.count / ITEMS_PER_PAGE);

      return NextResponse.json({
        products: allProducts,
        currentPage: page,
        totalPages,
        totalItems: totalCountResult.count,
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      return NextResponse.json(
        { error: "Failed to fetch products" },
        { status: 500 }
      );
    }
  }
}

export const GET = withAuth(handler, ["admin"]);
