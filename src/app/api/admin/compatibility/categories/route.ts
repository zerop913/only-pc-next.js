import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { compatibilityRuleCategories, categories } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET запрос для получения всех категорий правил совместимости
export async function GET(request: Request) {
  try {
    // Получаем все категории правил из базы данных с информацией о категориях
    const ruleCategories = await db
      .select({
        id: compatibilityRuleCategories.id,
        ruleId: compatibilityRuleCategories.ruleId,
        primaryCategoryId: compatibilityRuleCategories.primaryCategoryId,
        secondaryCategoryId: compatibilityRuleCategories.secondaryCategoryId,
      })
      .from(compatibilityRuleCategories);

    // Для каждой пары категорий правил, получаем информацию о самих категориях
    const ruleCategoriesWithInfo = await Promise.all(
      ruleCategories.map(async (ruleCategory) => {
        const primaryCategory = await db.query.categories.findFirst({
          where: eq(categories.id, ruleCategory.primaryCategoryId),
        });

        const secondaryCategory = await db.query.categories.findFirst({
          where: eq(categories.id, ruleCategory.secondaryCategoryId),
        });

        return {
          ...ruleCategory,
          primaryCategory,
          secondaryCategory,
        };
      })
    );

    return NextResponse.json(ruleCategoriesWithInfo);
  } catch (error) {
    console.error("Error fetching compatibility rule categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch compatibility rule categories" },
      { status: 500 }
    );
  }
}

// POST запрос для создания новой категории правила совместимости
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Валидация входных данных
    if (!body.ruleId || !body.primaryCategoryId || !body.secondaryCategoryId) {
      return NextResponse.json(
        {
          error:
            "Rule ID, primary category ID, and secondary category ID are required",
        },
        { status: 400 }
      );
    }

    // Проверяем существование категорий
    const primaryCategory = await db.query.categories.findFirst({
      where: eq(categories.id, body.primaryCategoryId),
    });

    if (!primaryCategory) {
      return NextResponse.json(
        { error: "Primary category not found" },
        { status: 404 }
      );
    }

    const secondaryCategory = await db.query.categories.findFirst({
      where: eq(categories.id, body.secondaryCategoryId),
    });

    if (!secondaryCategory) {
      return NextResponse.json(
        { error: "Secondary category not found" },
        { status: 404 }
      );
    }

    // Создаем новую категорию правила в базе данных
    const newRuleCategory = await db
      .insert(compatibilityRuleCategories)
      .values({
        ruleId: body.ruleId,
        primaryCategoryId: body.primaryCategoryId,
        secondaryCategoryId: body.secondaryCategoryId,
      })
      .returning();

    return NextResponse.json(newRuleCategory[0], { status: 201 });
  } catch (error) {
    console.error("Error creating compatibility rule category:", error);
    return NextResponse.json(
      { error: "Failed to create compatibility rule category" },
      { status: 500 }
    );
  }
}
