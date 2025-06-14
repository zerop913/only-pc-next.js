import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  compatibilityRules,
  compatibilityRuleCategories,
  compatibilityRuleCharacteristics,
  compatibilityValues,
} from "@/lib/db/schema";

// POST запрос для импорта правил совместимости
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const content = await file.text();
    const importData = JSON.parse(content);

    if (!importData.rules || !Array.isArray(importData.rules)) {
      return NextResponse.json(
        { error: "Invalid file format" },
        { status: 400 }
      );
    }

    let importedCount = 0;
    let skippedCount = 0;

    for (const ruleData of importData.rules) {
      try {
        // Проверяем, существует ли уже правило с таким именем
        const existingRule = await db.query.compatibilityRules.findFirst({
          where: (rules, { eq }) => eq(rules.name, ruleData.name),
        });

        if (existingRule) {
          skippedCount++;
          continue;
        }

        // Создаем новое правило
        const newRule = await db
          .insert(compatibilityRules)
          .values({
            name: ruleData.name,
            description: ruleData.description,
          })
          .returning();

        const ruleId = newRule[0].id;

        // Импортируем категории
        if (ruleData.categories && Array.isArray(ruleData.categories)) {
          for (const category of ruleData.categories) {
            await db.insert(compatibilityRuleCategories).values({
              ruleId,
              primaryCategoryId: category.primaryCategoryId,
              secondaryCategoryId: category.secondaryCategoryId,
            });
          }
        }

        // Импортируем характеристики
        if (
          ruleData.characteristics &&
          Array.isArray(ruleData.characteristics)
        ) {
          for (const characteristic of ruleData.characteristics) {
            const newChar = await db
              .insert(compatibilityRuleCharacteristics)
              .values({
                ruleId,
                primaryCharacteristicId: characteristic.primaryCharacteristicId,
                secondaryCharacteristicId:
                  characteristic.secondaryCharacteristicId,
                comparisonType: characteristic.comparisonType,
              })
              .returning();

            const charId = newChar[0].id;

            // Импортируем значения для характеристики
            if (characteristic.values && Array.isArray(characteristic.values)) {
              for (const value of characteristic.values) {
                await db.insert(compatibilityValues).values({
                  ruleCharacteristicId: charId,
                  primaryValue: value.primaryValue,
                  secondaryValue: value.secondaryValue,
                });
              }
            }
          }
        }

        importedCount++;
      } catch (ruleError) {
        console.error(`Error importing rule ${ruleData.name}:`, ruleError);
        skippedCount++;
      }
    }

    return NextResponse.json({
      message: "Import completed",
      imported: importedCount,
      skipped: skippedCount,
    });
  } catch (error) {
    console.error("Error importing compatibility rules:", error);
    return NextResponse.json(
      { error: "Failed to import compatibility rules" },
      { status: 500 }
    );
  }
}
