import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  compatibilityValues,
  compatibilityRuleCharacteristics,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { SQL } from "drizzle-orm";

// GET запрос для получения всех значений совместимости
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const characteristicId = searchParams.get("characteristicId");

    let queryFilters: SQL<unknown> | undefined;

    // Если указан ID характеристики, то фильтруем по нему
    if (characteristicId) {
      const id = parseInt(characteristicId);
      if (!isNaN(id)) {
        queryFilters = eq(compatibilityValues.ruleCharacteristicId, id);
      }
    }

    const values = queryFilters
      ? await db.select().from(compatibilityValues).where(queryFilters)
      : await db.select().from(compatibilityValues);

    return NextResponse.json(values);
  } catch (error) {
    console.error("Error fetching compatibility values:", error);
    return NextResponse.json(
      { error: "Failed to fetch compatibility values" },
      { status: 500 }
    );
  }
}

// POST запрос для создания нового значения совместимости
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Валидация входных данных
    if (
      !body.ruleCharacteristicId ||
      !body.primaryValue ||
      !body.secondaryValue
    ) {
      return NextResponse.json(
        {
          error:
            "Rule characteristic ID, primary value, and secondary value are required",
        },
        { status: 400 }
      );
    }

    // Проверяем существование характеристики правила
    const ruleCharacteristic =
      await db.query.compatibilityRuleCharacteristics.findFirst({
        where: eq(
          compatibilityRuleCharacteristics.id,
          body.ruleCharacteristicId
        ),
      });

    if (!ruleCharacteristic) {
      return NextResponse.json(
        { error: "Rule characteristic not found" },
        { status: 404 }
      );
    }

    // Создаем новое значение совместимости в базе данных
    const newCompatibilityValue = await db
      .insert(compatibilityValues)
      .values({
        ruleCharacteristicId: body.ruleCharacteristicId,
        primaryValue: body.primaryValue,
        secondaryValue: body.secondaryValue,
      })
      .returning();

    return NextResponse.json(newCompatibilityValue[0], { status: 201 });
  } catch (error) {
    console.error("Error creating compatibility value:", error);
    return NextResponse.json(
      { error: "Failed to create compatibility value" },
      { status: 500 }
    );
  }
}

// DELETE запрос для удаления значения совместимости
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const valueId = parseInt(id);
    if (isNaN(valueId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Проверяем существование значения
    const value = await db.query.compatibilityValues.findFirst({
      where: eq(compatibilityValues.id, valueId),
    });

    if (!value) {
      return NextResponse.json(
        { error: "Compatibility value not found" },
        { status: 404 }
      );
    }

    // Удаляем значение
    await db
      .delete(compatibilityValues)
      .where(eq(compatibilityValues.id, valueId));

    return NextResponse.json({
      message: "Compatibility value deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting compatibility value:", error);
    return NextResponse.json(
      { error: "Failed to delete compatibility value" },
      { status: 500 }
    );
  }
}
