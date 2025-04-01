import { NextRequest, NextResponse } from "next/server";
import { getCategoryByPath } from "@/services/categoryService";

export async function GET(request: NextRequest) {
  try {
    // Получаем путь из URL вместо params
    const segments = request.nextUrl.pathname
      .split("/")
      .filter(
        (segment) => segment && segment !== "api" && segment !== "categories"
      );

    const category = await getCategoryByPath(segments);

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Category fetch error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
