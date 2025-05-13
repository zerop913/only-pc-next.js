import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  products,
  productCharacteristics,
  characteristicsTypes,
  compatibilityRuleCharacteristics,
  compatibilityValues,
  compatibilityRules,
  compatibilityRuleCategories,
} from "@/lib/db/schema";
import { eq, and, inArray, or } from "drizzle-orm";

export interface ProductCharacteristic {
  type: string;
  value: string;
}

export interface ProductDetails {
  id: number;
  title: string;
  characteristics: ProductCharacteristic[];
}

export interface CompatibilityDetails {
  primaryProduct: ProductDetails;
  secondaryProduct: ProductDetails;
  matchingCharacteristics: {
    type: string;
    primaryValue: string;
    secondaryValue: string;
  }[];
  incompatibleCharacteristics?: {
    type: string;
    primaryValue: string;
    secondaryValue: string;
    reason: string;
  }[];
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const primaryId = searchParams.get("primary");
    const secondaryId = searchParams.get("secondary");

    if (!primaryId || !secondaryId) {
      return NextResponse.json(
        { error: "Необходимо указать ID обоих компонентов" },
        { status: 400 }
      );
    }

    // Получаем информацию о первом компоненте
    const primaryProduct = await db.query.products.findFirst({
      where: eq(products.id, parseInt(primaryId)),
      columns: {
        id: true,
        title: true,
        categoryId: true,
      },
    });

    // Получаем информацию о втором компоненте
    const secondaryProduct = await db.query.products.findFirst({
      where: eq(products.id, parseInt(secondaryId)),
      columns: {
        id: true,
        title: true,
        categoryId: true,
      },
    });

    if (!primaryProduct || !secondaryProduct) {
      return NextResponse.json(
        { error: "Один или оба компонента не найдены" },
        { status: 404 }
      );
    }

    // Получаем характеристики первого компонента
    const primaryCharacteristics = await db
      .select({
        type: characteristicsTypes.name,
        value: productCharacteristics.value,
        characteristicId: characteristicsTypes.id,
      })
      .from(productCharacteristics)
      .innerJoin(
        characteristicsTypes,
        eq(
          productCharacteristics.characteristic_type_id,
          characteristicsTypes.id
        )
      )
      .where(eq(productCharacteristics.product_id, primaryProduct.id));

    // Получаем характеристики второго компонента
    const secondaryCharacteristics = await db
      .select({
        type: characteristicsTypes.name,
        value: productCharacteristics.value,
        characteristicId: characteristicsTypes.id,
      })
      .from(productCharacteristics)
      .innerJoin(
        characteristicsTypes,
        eq(
          productCharacteristics.characteristic_type_id,
          characteristicsTypes.id
        )
      )
      .where(eq(productCharacteristics.product_id, secondaryProduct.id));

    // Находим правила совместимости для категорий этих продуктов
    const ruleCategories = await db
      .select({
        ruleId: compatibilityRuleCategories.ruleId,
      })
      .from(compatibilityRuleCategories)
      .where(
        or(
          and(
            eq(
              compatibilityRuleCategories.primaryCategoryId,
              primaryProduct.categoryId
            ),
            eq(
              compatibilityRuleCategories.secondaryCategoryId,
              secondaryProduct.categoryId
            )
          ),
          and(
            eq(
              compatibilityRuleCategories.primaryCategoryId,
              secondaryProduct.categoryId
            ),
            eq(
              compatibilityRuleCategories.secondaryCategoryId,
              primaryProduct.categoryId
            )
          )
        )
      );

    const ruleIds = ruleCategories.map((rc) => rc.ruleId);

    // Если есть правила совместимости, получаем их детали
    const ruleCharacteristics =
      ruleIds.length > 0
        ? await db
            .select({
              id: compatibilityRuleCharacteristics.id,
              ruleId: compatibilityRuleCharacteristics.ruleId,
              primaryCharId:
                compatibilityRuleCharacteristics.primaryCharacteristicId,
              secondaryCharId:
                compatibilityRuleCharacteristics.secondaryCharacteristicId,
              comparisonType: compatibilityRuleCharacteristics.comparisonType,
            })
            .from(compatibilityRuleCharacteristics)
            .where(inArray(compatibilityRuleCharacteristics.ruleId, ruleIds))
        : [];

    // Создаем мапы для быстрого доступа к характеристикам
    const primaryCharMap = new Map(
      primaryCharacteristics.map((char) => [char.characteristicId, char])
    );
    const secondaryCharMap = new Map(
      secondaryCharacteristics.map((char) => [char.characteristicId, char])
    );

    // Находим совпадающие и несовпадающие характеристики
    const matchingCharacteristics = [];
    const incompatibleCharacteristics = [];

    // Для каждого правила проверяем совместимость
    for (const rule of ruleCharacteristics) {
      // Проверяем, есть ли у нас характеристики для этого правила
      const primaryChar = primaryCharMap.get(rule.primaryCharId);
      const secondaryChar = secondaryCharMap.get(rule.secondaryCharId);

      // Если характеристика отсутствует у одного из продуктов, пропускаем
      if (!primaryChar || !secondaryChar) continue;

      // Получаем список значений совместимости для этого правила
      const compatValues = await db
        .select({
          primaryValue: compatibilityValues.primaryValue,
          secondaryValue: compatibilityValues.secondaryValue,
        })
        .from(compatibilityValues)
        .where(eq(compatibilityValues.ruleCharacteristicId, rule.id));

      let isCompatible = false;
      let reason = "";

      // Проверяем совместимость в зависимости от типа сравнения
      switch (rule.comparisonType) {
        case "equality":
          // Требуется точное совпадение значений
          isCompatible = primaryChar.value === secondaryChar.value;
          if (!isCompatible) {
            reason = `Значения не совпадают: ${primaryChar.value} != ${secondaryChar.value}`;
          }
          break;

        case "contains":
          // Проверяем, содержит ли одно значение другое
          isCompatible = primaryChar.value.includes(secondaryChar.value);
          if (!isCompatible) {
            reason = `${primaryChar.type} (${primaryChar.value}) не поддерживает ${secondaryChar.type} (${secondaryChar.value})`;
          }
          break;

        case "contains_list":
          // Проверяем поддержку через список значений (например, поддерживаемые сокеты)
          const supportedValues = primaryChar.value
            .split(",")
            .map((v) => v.trim());
          isCompatible = supportedValues.includes(secondaryChar.value);
          if (!isCompatible) {
            reason = `${primaryChar.type} (${primaryChar.value}) не поддерживает ${secondaryChar.value}`;
          }
          break;

        case "greater_equal":
          // Проверяем, больше или равно ли первое значение второму
          isCompatible =
            parseFloat(primaryChar.value) >= parseFloat(secondaryChar.value);
          if (!isCompatible) {
            reason = `${primaryChar.type} (${primaryChar.value}) меньше, чем требуемое значение ${secondaryChar.value}`;
          }
          break;

        case "greater_than":
          // Проверяем, строго больше ли первое значение второго
          isCompatible =
            parseFloat(primaryChar.value) > parseFloat(secondaryChar.value);
          if (!isCompatible) {
            reason = `${primaryChar.type} (${primaryChar.value}) должно быть больше, чем ${secondaryChar.value}`;
          }
          break;

        case "less_equal":
          // Проверяем, меньше или равно ли первое значение второму
          isCompatible =
            parseFloat(primaryChar.value) <= parseFloat(secondaryChar.value);
          if (!isCompatible) {
            reason = `${primaryChar.type} (${primaryChar.value}) превышает максимально допустимое ${secondaryChar.value}`;
          }
          break;

        case "divisible":
          // Проверка делимости (например, для каналов памяти)
          isCompatible =
            parseInt(secondaryChar.value) % parseInt(primaryChar.value) === 0;
          if (!isCompatible) {
            reason = `Количество модулей памяти (${secondaryChar.value}) не оптимально для ${primaryChar.value} каналов`;
          }
          break;

        case "count_greater_equal":
          // Проверка количества (например, слотов/портов)
          isCompatible =
            parseInt(primaryChar.value) >= parseInt(secondaryChar.value);
          if (!isCompatible) {
            reason = `Недостаточно ${primaryChar.type} (${primaryChar.value}) для подключения всех устройств (требуется ${secondaryChar.value})`;
          }
          break;

        default:
          // Для остальных типов проверяем по заполненной таблице значений
          if (compatValues.length > 0) {
            isCompatible = compatValues.some(
              (cv) =>
                cv.primaryValue === primaryChar.value &&
                cv.secondaryValue === secondaryChar.value
            );
            if (!isCompatible) {
              reason = `${primaryChar.type} (${primaryChar.value}) несовместимо с ${secondaryChar.type} (${secondaryChar.value})`;
            }
          } else {
            // Если нет значений в таблице, считаем совместимым
            isCompatible = true;
          }
          break;
      }

      // Добавляем в соответствующий список
      if (isCompatible) {
        matchingCharacteristics.push({
          type: primaryChar.type,
          primaryValue: primaryChar.value,
          secondaryValue: secondaryChar.value,
        });
      } else {
        incompatibleCharacteristics.push({
          type: primaryChar.type,
          primaryValue: primaryChar.value,
          secondaryValue: secondaryChar.value,
          reason: reason,
        });
      }
    }

    // Если нет правил совместимости, добавляем базовые совпадения
    if (ruleCharacteristics.length === 0) {
      // Находим характеристики, которые есть в обоих продуктах
      for (const primaryChar of primaryCharacteristics) {
        const secondaryChar = secondaryCharMap.get(
          primaryChar.characteristicId
        );

        if (secondaryChar) {
          matchingCharacteristics.push({
            type: primaryChar.type,
            primaryValue: primaryChar.value,
            secondaryValue: secondaryChar.value,
          });
        }
      }
    }

    // Формируем ответ
    const response: CompatibilityDetails = {
      primaryProduct: {
        id: primaryProduct.id,
        title: primaryProduct.title,
        characteristics: primaryCharacteristics.map((char) => ({
          type: char.type,
          value: char.value,
        })),
      },
      secondaryProduct: {
        id: secondaryProduct.id,
        title: secondaryProduct.title,
        characteristics: secondaryCharacteristics.map((char) => ({
          type: char.type,
          value: char.value,
        })),
      },
      matchingCharacteristics,
    };

    // Добавляем несовместимые характеристики, если они есть
    if (incompatibleCharacteristics.length > 0) {
      response.incompatibleCharacteristics = incompatibleCharacteristics;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Ошибка при получении деталей совместимости:", error);
    return NextResponse.json(
      { error: "Ошибка при получении деталей совместимости" },
      { status: 500 }
    );
  }
}
