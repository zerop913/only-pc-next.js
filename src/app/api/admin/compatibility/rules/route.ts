import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  compatibilityRules,
  compatibilityRuleCategories,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET запрос для получения всех правил совместимости
export async function GET() {
  try {
    // Получаем все правила совместимости из базы данных
    const rules = await db.query.compatibilityRules.findMany({
      with: {
        // Здесь мы предполагаем, что у вас есть связи между таблицами
        // Если связей нет, то эту часть нужно изменить
      },
    });

    // Для каждого правила получаем категории, к которым оно применяется
    const rulesWithCategories = await Promise.all(
      rules.map(async (rule) => {
        const ruleCategories = await db
          .select({
            id: compatibilityRuleCategories.id,
            ruleId: compatibilityRuleCategories.ruleId,
            primaryCategoryId: compatibilityRuleCategories.primaryCategoryId,
            secondaryCategoryId:
              compatibilityRuleCategories.secondaryCategoryId,
          })
          .from(compatibilityRuleCategories)
          .where(eq(compatibilityRuleCategories.ruleId, rule.id));

        return {
          ...rule,
          categories: ruleCategories,
        };
      })
    );

    return NextResponse.json(rulesWithCategories);
  } catch (error) {
    console.error("Error fetching compatibility rules:", error);
    return NextResponse.json(
      { error: "Failed to fetch compatibility rules" },
      { status: 500 }
    );
  }
}

// POST запрос для создания нового правила совместимости
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Валидация входных данных
    if (!body.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Создаем новое правило в базе данных
    const newRule = await db
      .insert(compatibilityRules)
      .values({
        name: body.name,
        description: body.description || null,
      })
      .returning();

    return NextResponse.json(newRule[0], { status: 201 });
  } catch (error) {
    console.error("Error creating compatibility rule:", error);
    return NextResponse.json(
      { error: "Failed to create compatibility rule" },
      { status: 500 }
    );
  }
}
