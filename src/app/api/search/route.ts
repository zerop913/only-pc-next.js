import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/services/searchService";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(50, Number(searchParams.get("limit")) || 20);
    const sort = (searchParams.get("sort") || "relevance") as
      | "relevance"
      | "price_asc"
      | "price_desc";

    if (!query.trim()) {
      return NextResponse.json({
        items: [],
        totalItems: 0,
        totalPages: 0,
        currentPage: 1,
        query: query,
      });
    }

    const results = await searchProducts({
      query,
      page,
      limit,
      sort,
    });

    return NextResponse.json({
      ...results,
      query: query, // Добавляем query в результаты
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
