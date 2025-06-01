import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  compatibilityRules,
  compatibilityRuleCategories,
  compatibilityRuleCharacteristics,
  compatibilityValues,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET запрос для получения конкретного правила совместимости по ID
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = parseInt(params.id);

    // Проверка валидности ID
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid rule ID" }, { status: 400 });
    }

    // Получаем правило из базы данных
    const rule = await db.query.compatibilityRules.findFirst({
      where: eq(compatibilityRules.id, id),
    });

    if (!rule) {
      return NextResponse.json(
        { error: "Compatibility rule not found" },
        { status: 404 }
      );
    }

    // Получаем категории для этого правила
    const categories = await db
      .select()
      .from(compatibilityRuleCategories)
      .where(eq(compatibilityRuleCategories.ruleId, id));

    // Получаем характеристики для этого правила
    const characteristics = await db
      .select()
      .from(compatibilityRuleCharacteristics)
      .where(eq(compatibilityRuleCharacteristics.ruleId, id));

    // Для каждой характеристики получаем совместимые значения
    const characteristicsWithValues = await Promise.all(
      characteristics.map(async (characteristic) => {
        const values = await db
          .select()
          .from(compatibilityValues)
          .where(
            eq(compatibilityValues.ruleCharacteristicId, characteristic.id)
          );

        return {
          ...characteristic,
          values,
        };
      })
    );

    // Собираем полную информацию о правиле
    const fullRule = {
      ...rule,
      categories,
      characteristics: characteristicsWithValues,
    };

    return NextResponse.json(fullRule);
  } catch (error) {
    console.error("Error fetching compatibility rule:", error);
    return NextResponse.json(
      { error: "Failed to fetch compatibility rule" },
      { status: 500 }
    );
  }
}

// PUT запрос для обновления правила совместимости
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = parseInt(params.id);
    const body = await request.json();

    // Проверка валидности ID
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid rule ID" }, { status: 400 });
    }

    // Проверяем существование правила
    const existingRule = await db.query.compatibilityRules.findFirst({
      where: eq(compatibilityRules.id, id),
    });

    if (!existingRule) {
      return NextResponse.json(
        { error: "Compatibility rule not found" },
        { status: 404 }
      );
    }

    // Обновляем основную информацию о правиле
    const updatedRule = await db
      .update(compatibilityRules)
      .set({
        name: body.name || existingRule.name,
        description:
          body.description !== undefined
            ? body.description
            : existingRule.description,
        updatedAt: new Date(),
      })
      .where(eq(compatibilityRules.id, id))
      .returning();

    return NextResponse.json(updatedRule[0]);
  } catch (error) {
    console.error("Error updating compatibility rule:", error);
    return NextResponse.json(
      { error: "Failed to update compatibility rule" },
      { status: 500 }
    );
  }
}

// DELETE запрос для удаления правила совместимости
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = parseInt(params.id);

    // Проверка валидности ID
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid rule ID" }, { status: 400 });
    }

    // Проверяем существование правила
    const existingRule = await db.query.compatibilityRules.findFirst({
      where: eq(compatibilityRules.id, id),
    });

    if (!existingRule) {
      return NextResponse.json(
        { error: "Compatibility rule not found" },
        { status: 404 }
      );
    }

    // Удаляем правило (каскадное удаление должно быть настроено в базе данных)
    await db.delete(compatibilityRules).where(eq(compatibilityRules.id, id));

    return NextResponse.json({
      message: "Compatibility rule deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting compatibility rule:", error);
    return NextResponse.json(
      { error: "Failed to delete compatibility rule" },
      { status: 500 }
    );
  }
}
