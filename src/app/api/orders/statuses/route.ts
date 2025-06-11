import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orderStatuses } from "@/lib/db/schema";

export async function GET() {
  try {
    const statuses = await db.select().from(orderStatuses);

    return NextResponse.json({ statuses });
  } catch (error) {
    console.error("Error fetching order statuses:", error);
    return NextResponse.json(
      { error: "Не удалось получить статусы заказов" },
      { status: 500 }
    );
  }
}
