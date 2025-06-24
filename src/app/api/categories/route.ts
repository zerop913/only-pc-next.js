import { NextResponse } from "next/server";
import { getAllCategories } from "@/services/categoryService";

export async function GET() {
  try {
    console.log("[API] Categories endpoint called");
    console.log("[API] Environment check:", {
      DATABASE_URL: process.env.DATABASE_URL ? "Set" : "Not set",
      REDIS_URL: process.env.REDIS_URL ? "Set" : "Not set",
      NODE_ENV: process.env.NODE_ENV
    });
    
    const categories = await getAllCategories();
    console.log("[API] Categories fetched successfully:", categories.length);
    return NextResponse.json(categories);
  } catch (error) {
    console.error("[API] Categories fetch error:", error);
    console.error("[API] Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
