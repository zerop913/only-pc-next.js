import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  compatibilityRules,
  compatibilityRuleCategories,
  compatibilityRuleCharacteristics,
  categories,
  characteristicsTypes,
} from "@/lib/db/schema";
import { eq, like, and, or, count } from "drizzle-orm";

// GET запрос для получения всех правил совместимости с пагинацией и поиском
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter") || "all";
    const offset = (page - 1) * limit;

    // Базовый запрос для получения правил
    let whereCondition;
    if (search) {
      whereCondition = or(
        like(compatibilityRules.name, `%${search}%`),
        like(compatibilityRules.description, `%${search}%`)
      );
    }

    // Получаем общее количество правил
    const totalCountResult = await db
      .select({ count: count() })
      .from(compatibilityRules)
      .where(whereCondition);

    const totalItems = totalCountResult[0]?.count || 0;
    const totalPages = Math.ceil(totalItems / limit);

    // Получаем правила с пагинацией
    const rules = await db
      .select({
        id: compatibilityRules.id,
        name: compatibilityRules.name,
        description: compatibilityRules.description,
        createdAt: compatibilityRules.createdAt,
        updatedAt: compatibilityRules.updatedAt,
      })
      .from(compatibilityRules)
      .where(whereCondition)
      .limit(limit)
      .offset(offset)
      .orderBy(compatibilityRules.updatedAt);

    // Для каждого правила получаем связанные категории и характеристики
    const rulesWithDetails = await Promise.all(
      rules.map(async (rule) => {
        // Получаем категории
        const ruleCategories = await db
          .select({
            id: compatibilityRuleCategories.id,
            primaryCategoryId: compatibilityRuleCategories.primaryCategoryId,
            secondaryCategoryId:
              compatibilityRuleCategories.secondaryCategoryId,
            primaryCategoryName: categories.name,
            secondaryCategoryName: categories.name,
          })
          .from(compatibilityRuleCategories)
          .leftJoin(
            categories,
            eq(compatibilityRuleCategories.primaryCategoryId, categories.id)
          )
          .where(eq(compatibilityRuleCategories.ruleId, rule.id));

        // Получаем характеристики
        const ruleCharacteristics = await db
          .select({
            id: compatibilityRuleCharacteristics.id,
            primaryCharacteristicId:
              compatibilityRuleCharacteristics.primaryCharacteristicId,
            secondaryCharacteristicId:
              compatibilityRuleCharacteristics.secondaryCharacteristicId,
            comparisonType: compatibilityRuleCharacteristics.comparisonType,
            primaryCharacteristicName: characteristicsTypes.name,
            secondaryCharacteristicName: characteristicsTypes.name,
          })
          .from(compatibilityRuleCharacteristics)
          .leftJoin(
            characteristicsTypes,
            eq(
              compatibilityRuleCharacteristics.primaryCharacteristicId,
              characteristicsTypes.id
            )
          )
          .where(eq(compatibilityRuleCharacteristics.ruleId, rule.id));

        // Подсчитываем количество значений для каждой характеристики
        const characteristicsWithCounts = await Promise.all(
          ruleCharacteristics.map(async (char) => {
            // Здесь нужно будет добавить запрос к таблице значений совместимости
            // Пока оставим заглушку
            return {
              ...char,
              valuesCount: 0, // TODO: подсчитать реальное количество значений
            };
          })
        );

        return {
          ...rule,
          categories: ruleCategories.map((cat) => ({
            id: cat.id,
            primaryCategoryName: cat.primaryCategoryName || "Неизвестно",
            secondaryCategoryName: cat.secondaryCategoryName || "Неизвестно",
          })),
          characteristics: characteristicsWithCounts.map((char) => ({
            id: char.id,
            primaryCharacteristicName:
              char.primaryCharacteristicName || "Неизвестно",
            secondaryCharacteristicName:
              char.secondaryCharacteristicName || "Неизвестно",
            comparisonType: char.comparisonType,
            valuesCount: char.valuesCount,
          })),
        };
      })
    );

    return NextResponse.json({
      rules: rulesWithDetails,
      currentPage: page,
      totalPages,
      totalItems,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    });
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
