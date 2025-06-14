import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { characteristicsTypes } from "@/lib/db/schema";

// GET запрос для получения всех типов характеристик
export async function GET() {
  try {
    const characteristicTypes = await db
      .select({
        id: characteristicsTypes.id,
        name: characteristicsTypes.name,
        slug: characteristicsTypes.slug,
      })
      .from(characteristicsTypes)
      .orderBy(characteristicsTypes.name);

    return NextResponse.json(characteristicTypes);
  } catch (error) {
    console.error("Error fetching characteristic types:", error);
    return NextResponse.json(
      { error: "Failed to fetch characteristic types" },
      { status: 500 }
    );
  }
}
