import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  compatibilityRuleCharacteristics,
  characteristicsTypes,
  compatibilityValues,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET запрос для получения всех характеристик правил совместимости
export async function GET(request: Request) {
  try {
    // Получаем все характеристики правил из базы данных
    const ruleCharacteristics = await db
      .select({
        id: compatibilityRuleCharacteristics.id,
        ruleId: compatibilityRuleCharacteristics.ruleId,
        primaryCharacteristicId:
          compatibilityRuleCharacteristics.primaryCharacteristicId,
        secondaryCharacteristicId:
          compatibilityRuleCharacteristics.secondaryCharacteristicId,
        comparisonType: compatibilityRuleCharacteristics.comparisonType,
      })
      .from(compatibilityRuleCharacteristics);

    // Для каждой пары характеристик правил, получаем информацию о самих характеристиках
    const characteristicsWithInfo = await Promise.all(
      ruleCharacteristics.map(async (characteristic) => {
        const primaryCharacteristic =
          await db.query.characteristicsTypes.findFirst({
            where: eq(
              characteristicsTypes.id,
              characteristic.primaryCharacteristicId
            ),
          });

        const secondaryCharacteristic =
          await db.query.characteristicsTypes.findFirst({
            where: eq(
              characteristicsTypes.id,
              characteristic.secondaryCharacteristicId
            ),
          });

        // Получаем значения для этой характеристики
        const values = await db
          .select()
          .from(compatibilityValues)
          .where(
            eq(compatibilityValues.ruleCharacteristicId, characteristic.id)
          );

        return {
          ...characteristic,
          primaryCharacteristic,
          secondaryCharacteristic,
          values,
        };
      })
    );

    return NextResponse.json(characteristicsWithInfo);
  } catch (error) {
    console.error("Error fetching compatibility rule characteristics:", error);
    return NextResponse.json(
      { error: "Failed to fetch compatibility rule characteristics" },
      { status: 500 }
    );
  }
}

// POST запрос для создания новой характеристики правила совместимости
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Валидация входных данных
    if (
      !body.ruleId ||
      !body.primaryCharacteristicId ||
      !body.secondaryCharacteristicId ||
      !body.comparisonType
    ) {
      return NextResponse.json(
        {
          error:
            "Rule ID, primary characteristic ID, secondary characteristic ID, and comparison type are required",
        },
        { status: 400 }
      );
    }

    // Проверяем существование типов характеристик
    const primaryCharacteristic = await db.query.characteristicsTypes.findFirst(
      {
        where: eq(characteristicsTypes.id, body.primaryCharacteristicId),
      }
    );

    if (!primaryCharacteristic) {
      return NextResponse.json(
        { error: "Primary characteristic type not found" },
        { status: 404 }
      );
    }

    const secondaryCharacteristic =
      await db.query.characteristicsTypes.findFirst({
        where: eq(characteristicsTypes.id, body.secondaryCharacteristicId),
      });

    if (!secondaryCharacteristic) {
      return NextResponse.json(
        { error: "Secondary characteristic type not found" },
        { status: 404 }
      );
    }

    // Создаем новую характеристику правила в базе данных
    const newRuleCharacteristic = await db
      .insert(compatibilityRuleCharacteristics)
      .values({
        ruleId: body.ruleId,
        primaryCharacteristicId: body.primaryCharacteristicId,
        secondaryCharacteristicId: body.secondaryCharacteristicId,
        comparisonType: body.comparisonType,
      })
      .returning();

    return NextResponse.json(newRuleCharacteristic[0], { status: 201 });
  } catch (error) {
    console.error("Error creating compatibility rule characteristic:", error);
    return NextResponse.json(
      { error: "Failed to create compatibility rule characteristic" },
      { status: 500 }
    );
  }
}
