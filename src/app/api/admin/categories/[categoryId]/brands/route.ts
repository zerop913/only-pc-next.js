import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/auth/_helpers/auth-helpers";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq, isNotNull, and } from "drizzle-orm";

async function handler(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  if (request.method === "GET") {
    try {
      const validParams = await Promise.resolve(params);
      const parsedCategoryId = parseInt(validParams.categoryId);

      if (isNaN(parsedCategoryId)) {
        return NextResponse.json(
          { error: "Invalid category ID" },
          { status: 400 }
        );
      }

      const brandsQuery = await db
        .select({ brand: products.brand })
        .from(products)
        .where(
          and(
            eq(products.categoryId, parsedCategoryId),
            isNotNull(products.brand)
          )
        )
        .groupBy(products.brand);

      const brands = brandsQuery.map((b) => b.brand);

      return NextResponse.json(brands);
    } catch (error) {
      console.error("Error fetching brands:", error);
      return NextResponse.json(
        { error: "Failed to fetch brands" },
        { status: 500 }
      );
    }
  }
}

export const GET = withAuth(handler, ["admin"]);
