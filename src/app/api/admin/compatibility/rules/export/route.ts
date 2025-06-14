import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  compatibilityRules,
  compatibilityRuleCategories,
  compatibilityRuleCharacteristics,
  compatibilityValues,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET запрос для экспорта всех правил совместимости
export async function GET() {
  try {
    // Получаем все правила
    const rules = await db.select().from(compatibilityRules);

    // Для каждого правила получаем связанные данные
    const rulesWithDetails = await Promise.all(
      rules.map(async (rule) => {
        // Получаем категории
        const categories = await db
          .select()
          .from(compatibilityRuleCategories)
          .where(eq(compatibilityRuleCategories.ruleId, rule.id));

        // Получаем характеристики
        const characteristics = await db
          .select()
          .from(compatibilityRuleCharacteristics)
          .where(eq(compatibilityRuleCharacteristics.ruleId, rule.id));

        // Для каждой характеристики получаем значения
        const characteristicsWithValues = await Promise.all(
          characteristics.map(async (char) => {
            const values = await db
              .select()
              .from(compatibilityValues)
              .where(eq(compatibilityValues.ruleCharacteristicId, char.id));

            return {
              ...char,
              values,
            };
          })
        );

        return {
          ...rule,
          categories,
          characteristics: characteristicsWithValues,
        };
      })
    );

    const exportData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      rules: rulesWithDetails,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": "attachment; filename=compatibility-rules.json",
      },
    });
  } catch (error) {
    console.error("Error exporting compatibility rules:", error);
    return NextResponse.json(
      { error: "Failed to export compatibility rules" },
      { status: 500 }
    );
  }
}
