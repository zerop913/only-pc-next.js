import { db } from "@/lib/db";
import {
  Component,
  CompatibilityResult,
  CompatibilityEdge,
  CompatibilityPairIssue,
  BuildCompatibilityResult,
  CompatibilityIssue,
} from "@/types/compatibility";
import {
  categories,
  products,
  compatibilityRules,
  compatibilityRuleCategories,
  compatibilityRuleCharacteristics,
  compatibilityValues,
  pcBuilds,
  productCharacteristics,
  characteristicsTypes,
} from "@/lib/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";

/**
 * Проверяет совместимость всех компонентов в сборке и возвращает детальный результат
 * @param components Массив компонентов сборки
 * @returns Детальный результат проверки совместимости
 */
export async function checkComponentsCompatibility(
  components: Component[]
): Promise<CompatibilityResult> {
  try {
    console.log("Сервис получил компоненты:", components);

    // Проверяем, что массив компонентов не пустой
    if (!components || components.length < 2) {
      console.log("Недостаточно компонентов для проверки, нужно минимум 2");
      return {
        compatible: true,
        issues: [],
        componentPairs: [],
      };
    }

    // Получаем все категории для проверки родительских отношений
    const allCategories = await db.query.categories.findMany();

    // Создаем карту slug категорий к их родительским категориям
    const categoryParentMap = new Map<string, string>();

    // Получаем родительские категории для каждой категории на основе parentId
    for (const category of allCategories) {
      if (category.parentId !== null) {
        // Находим родительскую категорию по parentId
        const parentCategory = allCategories.find(
          (c) => c.id === category.parentId
        );
        if (parentCategory) {
          categoryParentMap.set(category.slug, parentCategory.slug);
        }
      }
    }

    console.log(
      "Карта категорий и родителей:",
      Object.fromEntries(categoryParentMap)
    );

    // Проверяем наличие обязательных компонентов
    const requiredCategories = [
      {
        slug: [
          "nakopiteli",
          "zhestkie-diski-25",
          "zhestkie-diski-35",
          "ssd-nakopiteli",
          "ssd-m2-nakopiteli",
        ],
        name: "Накопители",
        message: "В сборке отсутствуют накопители (HDD или SSD)",
      },
      {
        slug: [
          "okhlazhdenie",
          "kulery-dlya-processorov",
          "sistemy-zhidkostnogo-ohlazhdeniya",
        ],
        name: "Системы охлаждения",
        message: "В сборке отсутствует система охлаждения для процессора",
      },
    ];

    const issues: CompatibilityPairIssue[] = [];
    const categoryMap = new Map<string, boolean>();

    // Формируем карту наличия категорий в сборке с учетом родительских категорий
    components.forEach((comp) => {
      console.log(`Проверка компонента: ${comp.categorySlug}`);

      // Проверяем сначала саму категорию
      requiredCategories.forEach((cat) => {
        if (cat.slug.includes(comp.categorySlug)) {
          console.log(
            `Найдена обязательная категория: ${cat.name} для ${comp.categorySlug}`
          );
          categoryMap.set(cat.name, true);
        }
      });

      // Проверяем, является ли категория подкатегорией одной из обязательных
      const parentSlug = categoryParentMap.get(comp.categorySlug);
      if (parentSlug) {
        console.log(
          `Найдена родительская категория: ${parentSlug} для ${comp.categorySlug}`
        );
        requiredCategories.forEach((cat) => {
          if (cat.slug.includes(parentSlug)) {
            console.log(
              `Найдена обязательная родительская категория: ${cat.name} для ${comp.categorySlug} (родитель: ${parentSlug})`
            );
            categoryMap.set(cat.name, true);
          }
        });
      }
    });

    // Проверяем отсутствующие обязательные категории
    requiredCategories.forEach((cat) => {
      console.log(
        `Проверка наличия категории: ${cat.name}, существует: ${categoryMap.has(
          cat.name
        )}`
      );
      if (!categoryMap.has(cat.name)) {
        issues.push({
          components: [
            {
              id: 0,
              title: "Конфигурация",
              category: "Конфигурация",
            },
          ],
          reason: cat.message,
        });
      }
    });

    // Подготавливаем запрос для получения ID продуктов по slug для всех компонентов
    const productsInfo = await Promise.all(
      components.map(async (component) => {
        console.log("Поиск категории для:", component.categorySlug);
        const category = await db.query.categories.findFirst({
          where: eq(categories.slug, component.categorySlug),
        });

        if (!category) {
          console.log("Категория не найдена:", component.categorySlug);
          throw new Error(`Категория ${component.categorySlug} не найдена`);
        }

        console.log(
          "Поиск продукта:",
          component.slug,
          "в категории:",
          category.id
        );
        const product = await db.query.products.findFirst({
          where: and(
            eq(products.slug, component.slug),
            eq(products.categoryId, category.id)
          ),
        });

        if (!product) {
          console.log(
            "Продукт не найден:",
            component.slug,
            "в категории:",
            category.id
          );
          throw new Error(
            `Продукт ${component.slug} не найден в категории ${component.categorySlug}`
          );
        }

        console.log("Найден продукт:", product.title, "ID:", product.id);

        // Получаем характеристики продукта
        const characteristics = await db
          .select({
            typeSlug: characteristicsTypes.slug,
            value: productCharacteristics.value,
            typeName: characteristicsTypes.name,
            typeId: characteristicsTypes.id,
          })
          .from(productCharacteristics)
          .innerJoin(
            characteristicsTypes,
            eq(
              productCharacteristics.characteristic_type_id,
              characteristicsTypes.id
            )
          )
          .where(eq(productCharacteristics.product_id, product.id));

        return {
          id: product.id,
          categorySlug: component.categorySlug,
          productSlug: component.slug,
          title: product.title,
          categoryId: category.id,
          categoryName: category.name,
          characteristics, // Добавляем характеристики продукта
        };
      })
    );

    console.log("Информация о продуктах с характеристиками:", productsInfo);

    // Создаем массив пар компонентов для проверки
    const componentPairs: CompatibilityEdge[] = [];

    // Для каждой пары компонентов проверяем совместимость на основе правил
    for (let i = 0; i < productsInfo.length; i++) {
      for (let j = i + 1; j < productsInfo.length; j++) {
        let comp1 = productsInfo[i];
        let comp2 = productsInfo[j];

        // Пытаемся найти правила совместимости для этой пары категорий в обоих направлениях
        let rulesQuery = await db
          .select({
            ruleId: compatibilityRuleCategories.ruleId,
            ruleName: compatibilityRules.name,
            description: compatibilityRules.description,
          })
          .from(compatibilityRuleCategories)
          .innerJoin(
            compatibilityRules,
            eq(compatibilityRuleCategories.ruleId, compatibilityRules.id)
          )
          .where(
            and(
              eq(
                compatibilityRuleCategories.primaryCategoryId,
                comp1.categoryId
              ),
              eq(
                compatibilityRuleCategories.secondaryCategoryId,
                comp2.categoryId
              )
            )
          );

        // Если нет правил в одном направлении, проверяем в обратном
        if (rulesQuery.length === 0) {
          rulesQuery = await db
            .select({
              ruleId: compatibilityRuleCategories.ruleId,
              ruleName: compatibilityRules.name,
              description: compatibilityRules.description,
            })
            .from(compatibilityRuleCategories)
            .innerJoin(
              compatibilityRules,
              eq(compatibilityRuleCategories.ruleId, compatibilityRules.id)
            )
            .where(
              and(
                eq(
                  compatibilityRuleCategories.primaryCategoryId,
                  comp2.categoryId
                ),
                eq(
                  compatibilityRuleCategories.secondaryCategoryId,
                  comp1.categoryId
                )
              )
            );

          // Если найдены правила в обратном направлении, меняем компоненты местами
          if (rulesQuery.length > 0) {
            [comp1, comp2] = [comp2, comp1];
          }
        }

        // По умолчанию компоненты считаются совместимыми
        let isCompatible = true;
        let reason = null;

        // Проверяем специализированные случаи совместимости

        // 1. Проверка совместимости накопителей и материнской платы
        if (
          (comp1.categorySlug === "materinskie-platy" &&
            (comp2.categorySlug === "ssd-m2-nakopiteli" ||
              comp2.categorySlug === "ssd-nakopiteli" ||
              comp2.categorySlug === "zhestkie-diski-25" ||
              comp2.categorySlug === "zhestkie-diski-35")) ||
          (comp2.categorySlug === "materinskie-platy" &&
            (comp1.categorySlug === "ssd-m2-nakopiteli" ||
              comp1.categorySlug === "ssd-nakopiteli" ||
              comp1.categorySlug === "zhestkie-diski-25" ||
              comp1.categorySlug === "zhestkie-diski-35"))
        ) {
          // Определяем, какой компонент материнская плата, а какой накопитель
          const motherboard =
            comp1.categorySlug === "materinskie-platy" ? comp1 : comp2;
          const storage =
            comp1.categorySlug === "materinskie-platy" ? comp2 : comp1;

          // Получаем нужные характеристики
          const storageType =
            storage.characteristics.find((c) => c.typeSlug === "type")?.value ||
            "";
          const storageInterface =
            storage.characteristics.find((c) => c.typeSlug === "interface")
              ?.value || "";
          const nvmeSupport =
            motherboard.characteristics.find(
              (c) => c.typeSlug === "nvme_support"
            )?.value || "";
          const m2Slots =
            motherboard.characteristics.find((c) => c.typeSlug === "m2_slots")
              ?.value || "0";
          const sataPorts =
            motherboard.characteristics.find((c) => c.typeSlug === "sata_ports")
              ?.value || "0";

          console.log(
            "Проверка совместимости накопителя и материнской платы:",
            {
              storageType,
              storageInterface,
              nvmeSupport,
              m2Slots,
              sataPorts,
            }
          );

          // Проверяем совместимость
          const storageCompatibilityResult = checkStorageCompatibility(
            storageType,
            storageInterface,
            nvmeSupport,
            m2Slots,
            sataPorts
          );

          if (!storageCompatibilityResult.compatible) {
            isCompatible = false;
            reason = storageCompatibilityResult.reason;
            console.log("Обнаружена несовместимость накопителя:", reason);
          }
        }

        // 2. Проверка совместимости системы охлаждения с процессором и корпусом
        if (
          (comp1.categorySlug === "processory" &&
            (comp2.categorySlug === "kulery-dlya-processorov" ||
              comp2.categorySlug === "sistemy-zhidkostnogo-ohlazhdeniya")) ||
          (comp2.categorySlug === "processory" &&
            (comp1.categorySlug === "kulery-dlya-processorov" ||
              comp1.categorySlug === "sistemy-zhidkostnogo-ohlazhdeniya"))
        ) {
          // Определяем, какой компонент процессор, а какой система охлаждения
          const cpu = comp1.categorySlug === "processory" ? comp1 : comp2;
          const cooling = comp1.categorySlug === "processory" ? comp2 : comp1;

          // Находим корпус в сборке, если он есть
          const caseComponent = productsInfo.find(
            (comp) => comp.categorySlug === "korpusa"
          );

          // Получаем нужные характеристики для охлаждения и процессора
          const coolerType =
            cooling.categorySlug === "sistemy-zhidkostnogo-ohlazhdeniya"
              ? "liquid"
              : "air";
          const coolerSocket =
            cooling.characteristics.find((c) => c.typeSlug === "socket")
              ?.value || "";
          const coolerTdpRating =
            cooling.characteristics.find((c) => c.typeSlug === "tdp_rating")
              ?.value || "";
          const coolerHeight =
            cooling.characteristics.find(
              (c) => c.typeSlug === "height" || c.typeSlug === "radiator_size"
            )?.value || "";

          const cpuSocket =
            cpu.characteristics.find((c) => c.typeSlug === "socket")?.value ||
            "";
          const cpuTdp =
            cpu.characteristics.find((c) => c.typeSlug === "tdp")?.value || "";

          // Характеристики корпуса (если есть)
          const caseMaxCoolerHeight =
            caseComponent?.characteristics.find(
              (c) => c.typeSlug === "max_cpu_cooler_height"
            )?.value || "";
          const caseRadiatorSupport =
            caseComponent?.characteristics.find(
              (c) =>
                c.typeSlug === "front_radiator" ||
                c.typeSlug === "top_radiator" ||
                c.typeSlug === "rear_radiator"
            )?.value || "";

          console.log("Проверка совместимости охлаждения и процессора:", {
            coolerType,
            coolerSocket,
            coolerTdpRating,
            coolerHeight,
            cpuSocket,
            cpuTdp,
            caseMaxCoolerHeight,
            caseRadiatorSupport,
          });

          // Проверяем совместимость
          const coolingCompatibilityResult = checkCoolingCompatibility(
            coolerType,
            coolerSocket,
            coolerTdpRating,
            coolerHeight,
            cpuSocket,
            cpuTdp,
            caseMaxCoolerHeight,
            caseRadiatorSupport
          );

          if (!coolingCompatibilityResult.compatible) {
            isCompatible = false;
            reason = coolingCompatibilityResult.reason;
            console.log("Обнаружена несовместимость охлаждения:", reason);
          }
        }

        // 3. Проверка совместимости системы охлаждения и корпуса
        if (
          (comp1.categorySlug === "korpusa" &&
            (comp2.categorySlug === "kulery-dlya-processorov" ||
              comp2.categorySlug === "sistemy-zhidkostnogo-ohlazhdeniya")) ||
          (comp2.categorySlug === "korpusa" &&
            (comp1.categorySlug === "kulery-dlya-processorov" ||
              comp1.categorySlug === "sistemy-zhidkostnogo-ohlazhdeniya"))
        ) {
          // Определяем, какой компонент корпус, а какой система охлаждения
          const caseComponent =
            comp1.categorySlug === "korpusa" ? comp1 : comp2;
          const cooling = comp1.categorySlug === "korpusa" ? comp2 : comp1;

          // Проверяем совместимость только для систем охлаждения (кулеров и СЖО)
          const coolerType =
            cooling.categorySlug === "sistemy-zhidkostnogo-ohlazhdeniya"
              ? "liquid"
              : "air";
          const coolerHeight =
            cooling.characteristics.find(
              (c) =>
                (coolerType === "air" && c.typeSlug === "height") ||
                (coolerType === "liquid" && c.typeSlug === "radiator_size")
            )?.value || "";

          // Получаем характеристики корпуса
          const caseMaxCoolerHeight =
            caseComponent.characteristics.find(
              (c) => c.typeSlug === "max_cpu_cooler_height"
            )?.value || "";
          const caseRadiatorSupport =
            caseComponent.characteristics.find(
              (c) =>
                c.typeSlug === "front_radiator" ||
                c.typeSlug === "top_radiator" ||
                c.typeSlug === "rear_radiator"
            )?.value || "";

          // Для эмуляции TDP и socket в проверке совместимости корпуса и кулера
          const dummyCpuSocket = "universal";
          const dummyCpuTdp = "0";
          const dummyCoolerSocket = "universal";
          const dummyCoolerTdp = "9999";

          console.log("Проверка совместимости охлаждения и корпуса:", {
            coolerType,
            coolerHeight,
            caseMaxCoolerHeight,
            caseRadiatorSupport,
          });

          // Вызываем полную проверку, но обращаем внимание только на совместимость с корпусом
          const coolingCaseCompatibilityResult = checkCoolingCompatibility(
            coolerType,
            dummyCoolerSocket,
            dummyCoolerTdp,
            coolerHeight,
            dummyCpuSocket,
            dummyCpuTdp,
            caseMaxCoolerHeight,
            caseRadiatorSupport
          );

          if (!coolingCaseCompatibilityResult.compatible) {
            isCompatible = false;
            reason = coolingCaseCompatibilityResult.reason;
            console.log(
              "Обнаружена несовместимость охлаждения с корпусом:",
              reason
            );
          }
        }

        // Стандартная проверка совместимости по правилам из БД
        if (isCompatible && rulesQuery.length > 0) {
          console.log(
            `Найдено ${rulesQuery.length} правил для проверки совместимости между категориями ${comp1.categoryName} и ${comp2.categoryName}`
          );

          // Проверяем каждое правило совместимости
          for (const rule of rulesQuery) {
            // Получаем характеристики, которые нужно проверить для этого правила
            const ruleCharacteristics = await db
              .select({
                id: compatibilityRuleCharacteristics.id,
                primaryCharacteristicId:
                  compatibilityRuleCharacteristics.primaryCharacteristicId,
                secondaryCharacteristicId:
                  compatibilityRuleCharacteristics.secondaryCharacteristicId,
                comparisonType: compatibilityRuleCharacteristics.comparisonType,
              })
              .from(compatibilityRuleCharacteristics)
              .where(eq(compatibilityRuleCharacteristics.ruleId, rule.ruleId));

            for (const ruleChar of ruleCharacteristics) {
              console.log(
                `Проверка правила #${rule.ruleId} с типом сравнения: ${ruleChar.comparisonType}`
              );

              // Находим значения характеристик у продуктов
              const primaryChar = comp1.characteristics.find(
                (c) => c.typeId === ruleChar.primaryCharacteristicId
              );
              const secondaryChar = comp2.characteristics.find(
                (c) => c.typeId === ruleChar.secondaryCharacteristicId
              );

              if (!primaryChar || !secondaryChar) {
                console.log("Не найдена одна из необходимых характеристик");
                continue; // Пропускаем, если у компонентов нет нужных характеристик
              }

              // Получаем значения совместимости для этой пары характеристик
              const compatValues = await db
                .select({
                  primaryValue: compatibilityValues.primaryValue,
                  secondaryValue: compatibilityValues.secondaryValue,
                })
                .from(compatibilityValues)
                .where(
                  eq(compatibilityValues.ruleCharacteristicId, ruleChar.id)
                );

              // Проверяем совместимость в зависимости от типа сравнения
              switch (ruleChar.comparisonType) {
                case "equality":
                  // Требуется точное совпадение значений
                  if (primaryChar.value !== secondaryChar.value) {
                    isCompatible = false;
                    reason = `Несовместимость: ${primaryChar.typeName} (${primaryChar.value}) не совпадает с ${secondaryChar.typeName} (${secondaryChar.value})`;
                  }
                  break;

                case "contains":
                  // Проверяем, содержит ли одно значение другое
                  // (например, чипсет материнской платы должен поддерживать процессор)
                  if (!primaryChar.value.includes(secondaryChar.value)) {
                    isCompatible = false;
                    reason = `Несовместимость: ${primaryChar.typeName} (${primaryChar.value}) не поддерживает ${secondaryChar.typeName} (${secondaryChar.value})`;
                  }
                  break;

                case "contains_list":
                  // Проверяем поддержку сокетов кулера и процессора - список значений через запятую
                  const supportedSockets = primaryChar.value
                    .split(",")
                    .map((s) => s.trim());
                  if (!supportedSockets.includes(secondaryChar.value)) {
                    isCompatible = false;
                    reason = `Несовместимость: ${primaryChar.typeName} (${primaryChar.value}) не поддерживает сокет ${secondaryChar.typeName} (${secondaryChar.value})`;
                  }
                  break;

                case "greater_equal":
                  // Проверяем, больше или равно ли первое значение второму
                  // (например, для проверки мощности блока питания)
                  if (
                    parseFloat(primaryChar.value) <
                    parseFloat(secondaryChar.value)
                  ) {
                    isCompatible = false;
                    reason = `Несовместимость: ${primaryChar.typeName} (${primaryChar.value}) меньше необходимого значения ${secondaryChar.typeName} (${secondaryChar.value})`;
                  }
                  break;

                case "greater_than":
                  // Проверяем, строго больше ли первое значение второго
                  if (
                    parseFloat(primaryChar.value) <=
                    parseFloat(secondaryChar.value)
                  ) {
                    isCompatible = false;
                    reason = `Несовместимость: ${primaryChar.typeName} (${primaryChar.value}) должно быть больше ${secondaryChar.typeName} (${secondaryChar.value})`;
                  }
                  break;

                case "divisible":
                  // Проверка делимости (для каналов памяти)
                  const channels = parseInt(primaryChar.value);
                  const modules = parseInt(secondaryChar.value);
                  if (modules % channels !== 0) {
                    isCompatible = false;
                    reason = `Несовместимость: Количество модулей памяти (${modules}) не оптимально для ${channels} каналов памяти`;
                  }
                  break;

                case "count_greater_equal":
                  // Проверка количества портов/слотов
                  const availablePorts = parseInt(primaryChar.value);
                  const requiredPorts = parseInt(secondaryChar.value);
                  if (availablePorts < requiredPorts) {
                    isCompatible = false;
                    reason = `Несовместимость: Недостаточно ${primaryChar.typeName} (${availablePorts}) для подключения ${secondaryChar.typeName} (требуется ${requiredPorts})`;
                  }
                  break;

                case "less_equal":
                  // Для максимальных допустимых размеров компонентов в корпусе
                  // primaryChar - максимально допустимое значение (например, макс. длина видеокарты для корпуса)
                  // secondaryChar - реальное значение устанавливаемого компонента (например, длина видеокарты)
                  if (
                    parseFloat(secondaryChar.value) >
                    parseFloat(primaryChar.value)
                  ) {
                    isCompatible = false;

                    // Специальное сообщение для случая совместимости корпуса и материнской платы
                    if (
                      comp1.categoryName === "Корпуса" &&
                      comp2.categoryName === "Материнские платы"
                    ) {
                      reason = `Несовместимость: Корпус (${primaryChar.value}) слишком мал для материнской платы (${secondaryChar.value})`;
                    } else {
                      reason = `Несовместимость: ${secondaryChar.typeName} (${secondaryChar.value}) превышает максимально допустимое значение ${primaryChar.typeName} (${primaryChar.value})`;
                    }
                  }
                  break;

                case "case_dimensions":
                  // Специальный случай для сравнения размеров корпуса и материнской платы
                  // Для размеров корпус должен быть БОЛЬШЕ материнской платы
                  // Поэтому при сравнении размеров условие должно быть противоположным
                  // Если размер материнской платы МЕНЬШЕ размера корпуса - это нормально,
                  // проблема возникает когда материнская плата БОЛЬШЕ корпуса
                  if (
                    parseFloat(primaryChar.value) <
                    parseFloat(secondaryChar.value)
                  ) {
                    isCompatible = false;
                    reason = `Несовместимость: Материнская плата со значением "${secondaryChar.typeName}" (${secondaryChar.value} мм) слишком большая и не помещается в корпус с "${primaryChar.typeName}" (${primaryChar.value} мм)`;
                  }
                  break;

                default:
                  // Проверяем по заполненным значениям из таблицы compatibilityValues
                  if (compatValues.length > 0) {
                    const isPairCompatible = compatValues.some(
                      (cv) =>
                        cv.primaryValue === primaryChar.value &&
                        cv.secondaryValue === secondaryChar.value
                    );

                    if (!isPairCompatible) {
                      isCompatible = false;
                      reason = `Несовместимость: ${primaryChar.typeName} (${primaryChar.value}) несовместим с ${secondaryChar.typeName} (${secondaryChar.value})`;
                    }
                  } else {
                    console.log(
                      `Для типа сравнения ${ruleChar.comparisonType} не найдены значения совместимости`
                    );
                  }
                  break;
              }

              // Если найдена несовместимость, прекращаем проверку
              if (!isCompatible) {
                console.log("Обнаружена несовместимость:", reason);
                break;
              }
            }

            // Если по одному из правил компоненты несовместимы, прекращаем проверку
            if (!isCompatible) break;
          }
        } else if (rulesQuery.length === 0) {
          console.log(
            `Не найдено правил совместимости для категорий ${comp1.categoryName} и ${comp2.categoryName}. Считаем компоненты совместимыми.`
          );
        }

        // Добавляем пару в результат
        componentPairs.push({
          source: {
            id: comp1.id,
            categorySlug: comp1.categorySlug,
            productSlug: comp1.productSlug,
            title: comp1.title,
            categoryName: comp1.categoryName,
          },
          target: {
            id: comp2.id,
            categorySlug: comp2.categorySlug,
            productSlug: comp2.productSlug,
            title: comp2.title,
            categoryName: comp2.categoryName,
          },
          compatible: isCompatible,
          reason: reason || null,
        });

        // Если компоненты несовместимы, добавляем проблему в список
        if (!isCompatible) {
          issues.push({
            components: [
              {
                id: comp1.id,
                title: comp1.title,
                category: comp1.categoryName,
              },
              {
                id: comp2.id,
                title: comp2.title,
                category: comp2.categoryName,
              },
            ],
            reason: reason || "Несовместимые компоненты",
          });
        }
      }
    }

    return {
      compatible: issues.length === 0,
      issues,
      componentPairs,
    };
  } catch (error) {
    console.error("Ошибка при проверке совместимости:", error);
    throw new Error("Ошибка при проверке совместимости компонентов");
  }
}

/**
 * Проверяет совместимость текущей сборки
 * @param components Объект с компонентами сборки в формате {categorySlug: productSlug}
 * @returns Результат проверки совместимости
 */
export async function checkBuildCompatibility(
  components: Record<string, string>
): Promise<CompatibilityResult> {
  try {
    // Преобразуем формат компонентов в массив для checkComponentsCompatibility
    const componentsArray = Object.entries(components).map(
      ([categorySlug, productSlug]) => ({
        categorySlug,
        slug: productSlug,
      })
    );

    return await checkComponentsCompatibility(componentsArray);
  } catch (error) {
    console.error("Error checking build compatibility:", error);
    throw error;
  }
}

/**
 * Проверяет совместимость сборки используя SQL-функцию check_build_compatibility
 * @param components Объект с компонентами сборки в формате {categorySlug: productSlug}
 * @returns Результат проверки совместимости из SQL-функции
 */
export async function checkBuildCompatibilitySql(
  components: Record<string, string>
): Promise<{ compatible: boolean; issues: CompatibilityIssue[] }> {
  try {
    // Преобразуем компоненты в формат JSON для SQL-функции
    const componentsJson = JSON.stringify(components);

    // Вызываем SQL-функцию напрямую
    const result = await db.execute(
      sql`SELECT check_build_compatibility(${componentsJson}::jsonb) as result`
    );

    // Типизированная проверка результата
    const rawResults = result as unknown as Array<{
      result: { compatible: boolean; issues: CompatibilityIssue[] };
    }>;

    // Извлекаем результат с безопасной проверкой
    const compatibilityResult =
      rawResults && rawResults.length > 0
        ? rawResults[0].result
        : { compatible: true, issues: [] };

    return compatibilityResult;
  } catch (error) {
    console.error(
      "Error checking build compatibility with SQL function:",
      error
    );
    throw new Error("Ошибка при проверке совместимости компонентов через SQL");
  }
}

/**
 * Получает результат проверки совместимости для указанной сборки
 * @param buildId ID сборки
 * @returns Результат проверки совместимости
 */
export async function getBuildCompatibilityResult(
  buildId: number
): Promise<BuildCompatibilityResult> {
  try {
    // Получаем компоненты сборки из БД
    const build = await db.query.pcBuilds.findFirst({
      where: eq(pcBuilds.id, buildId),
      columns: {
        components: true,
      },
    });

    if (!build) {
      throw new Error(`Сборка с ID ${buildId} не найдена`);
    }

    // Преобразуем строку JSON в объект
    const componentsObj = JSON.parse(build.components);

    // Преобразуем объект компонентов в массив и проверяем совместимость
    const componentsArray = Object.entries(componentsObj).map(
      ([categorySlug, productSlug]) => ({
        categorySlug,
        slug: productSlug as string,
      })
    );

    const compatibilityResult = await checkComponentsCompatibility(
      componentsArray
    );

    // Преобразуем результат в нужный формат
    return {
      compatible: compatibilityResult.compatible,
      results: compatibilityResult.componentPairs.map((pair) => ({
        compatible: pair.compatible,
        issues: pair.compatible
          ? []
          : [
              {
                rule_id: 0,
                rule_name: "",
                message: pair.reason || "Несовместимые компоненты",
                severity: "error",
              },
            ],
        primary_product: {
          id: pair.source.id,
          title: pair.source.title,
          category_id: 0,
          category_name: pair.source.categoryName,
        },
        secondary_product: {
          id: pair.target.id,
          title: pair.target.title,
          category_id: 0,
          category_name: pair.target.categoryName,
        },
      })),
    };
  } catch (error) {
    console.error("Error getting build compatibility result:", error);
    throw new Error("Ошибка при получении результата проверки совместимости");
  }
}

/**
 * Получает список компонентов, совместимых с указанными
 * @param categorySlug Slug категории
 * @param components Выбранные компоненты в формате {categorySlug: productSlug}
 * @returns Массив ID совместимых компонентов
 */
export async function getCompatibleComponents(
  categorySlug: string,
  components: Record<string, string>
): Promise<number[]> {
  try {
    // Получаем ID категории по slug
    const category = await db.query.categories.findFirst({
      where: eq(categories.slug, categorySlug),
    });

    if (!category) {
      throw new Error(`Категория ${categorySlug} не найдена`);
    }

    // Получаем все продукты в этой категории
    const categoryProducts = await db.query.products.findMany({
      where: eq(products.categoryId, category.id),
    });

    // Если нет выбранных компонентов, возвращаем все продукты категории
    if (Object.keys(components).length === 0) {
      return categoryProducts.map((p) => p.id);
    }

    // Преобразуем компоненты для проверки совместимости
    const compatibleProductIds = [];

    // Проверяем совместимость каждого продукта категории с выбранными компонентами
    for (const product of categoryProducts) {
      let isCompatible = true;

      // Проверяем с каждым уже выбранным компонентом
      for (const [compCategorySlug, compProductSlug] of Object.entries(
        components
      )) {
        // Получаем ID категории компонента
        const compCategory = await db.query.categories.findFirst({
          where: eq(categories.slug, compCategorySlug),
        });

        if (!compCategory) continue;

        // Получаем ID продукта компонента
        const compProduct = await db.query.products.findFirst({
          where: and(
            eq(products.slug, compProductSlug),
            eq(products.categoryId, compCategory.id)
          ),
        });

        if (!compProduct) continue;

        // Проверяем совместимость через SQL-функцию
        const result = await db.execute(
          sql`SELECT check_components_compatibility(${product.id}, ${compProduct.id}) as compatibility_result`
        );

        if (result && Array.isArray(result) && result.length > 0) {
          const compatibilityResult = (result[0] as any).compatibility_result;

          if (compatibilityResult && !compatibilityResult.compatible) {
            isCompatible = false;
            break;
          }
        }
      }

      if (isCompatible) {
        compatibleProductIds.push(product.id);
      }
    }

    return compatibleProductIds;
  } catch (error) {
    console.error("Error getting compatible components:", error);
    throw new Error("Ошибка при получении совместимых компонентов");
  }
}

/**
 * Использует улучшенные функции для проверки совместимости компонентов
 * @param components Массив компонентов сборки
 * @returns Детальный результат проверки совместимости с использованием усовершенствованного алгоритма
 */
export async function checkAdvancedCompatibility(
  components: Component[]
): Promise<CompatibilityResult> {
  try {
    console.log(
      "Запущена улучшенная проверка совместимости для компонентов:",
      components
    );

    // Проверяем, что массив компонентов не пустой
    if (!components || components.length < 2) {
      console.log("Недостаточно компонентов для проверки, нужно минимум 2");
      return {
        compatible: true,
        issues: [],
        componentPairs: [],
      };
    }

    // Получаем информацию о продуктах
    const productsInfo = await Promise.all(
      components.map(async (component) => {
        const category = await db.query.categories.findFirst({
          where: eq(categories.slug, component.categorySlug),
        });

        if (!category) {
          throw new Error(`Категория ${component.categorySlug} не найдена`);
        }

        const product = await db.query.products.findFirst({
          where: and(
            eq(products.slug, component.slug),
            eq(products.categoryId, category.id)
          ),
        });

        if (!product) {
          throw new Error(
            `Продукт ${component.slug} не найден в категории ${component.categorySlug}`
          );
        }

        return {
          id: product.id,
          categorySlug: component.categorySlug,
          productSlug: component.slug,
          title: product.title,
          categoryId: category.id,
          categoryName: category.name,
        };
      })
    );

    // Создаем массивы для хранения результатов
    const componentPairs: CompatibilityEdge[] = [];
    const issues: CompatibilityPairIssue[] = [];

    // Проверяем каждую пару компонентов с использованием улучшенной SQL-функции
    for (let i = 0; i < productsInfo.length; i++) {
      for (let j = i + 1; j < productsInfo.length; j++) {
        const comp1 = productsInfo[i];
        const comp2 = productsInfo[j];

        // Вызываем расширенную SQL-функцию проверки совместимости
        const result = await db.execute(
          sql`SELECT get_detailed_compatibility(${comp1.id}, ${comp2.id}) as compatibility_result`
        );

        const compatibilityResult =
          result && Array.isArray(result) && result.length > 0
            ? (result[0] as any).compatibility_result
            : { compatible: true, issues: [] };

        const isCompatible = compatibilityResult?.compatible || true;
        let reason: string | null = null;

        // Если есть проблемы совместимости, формируем сообщение об ошибке
        if (
          compatibilityResult?.issues &&
          Array.isArray(compatibilityResult.issues) &&
          compatibilityResult.issues.length > 0
        ) {
          // Берем первую проблему для отображения
          const firstIssue = compatibilityResult.issues[0];
          reason =
            firstIssue.message ||
            `Несовместимость: ${firstIssue.primary_char || ""} (${
              firstIssue.primary_value || ""
            }) и ${firstIssue.secondary_char || ""} (${
              firstIssue.secondary_value || ""
            })`;
        }

        // Добавляем пару в результат
        componentPairs.push({
          source: {
            id: comp1.id,
            categorySlug: comp1.categorySlug,
            productSlug: comp1.productSlug,
            title: comp1.title,
            categoryName: comp1.categoryName,
          },
          target: {
            id: comp2.id,
            categorySlug: comp2.categorySlug,
            productSlug: comp2.productSlug,
            title: comp2.title,
            categoryName: comp2.categoryName,
          },
          compatible: isCompatible,
          reason: reason,
        });

        // Если компоненты несовместимы, добавляем проблему в список
        if (!isCompatible) {
          issues.push({
            components: [
              {
                id: comp1.id,
                title: comp1.title,
                category: comp1.categoryName,
              },
              {
                id: comp2.id,
                title: comp2.title,
                category: comp2.categoryName,
              },
            ],
            reason: reason || "Несовместимые компоненты",
          });
        }
      }
    }

    return {
      compatible: issues.length === 0,
      issues,
      componentPairs,
    };
  } catch (error) {
    console.error("Ошибка при расширенной проверке совместимости:", error);
    throw new Error("Ошибка при улучшенной проверке совместимости компонентов");
  }
}

/**
 * Проверяет совместимость текущей сборки с улучшенным алгоритмом
 * @param components Объект с компонентами сборки в формате {categorySlug: productSlug}
 * @returns Результат проверки совместимости
 */
export async function checkAdvancedBuildCompatibility(
  components: Record<string, string>
): Promise<CompatibilityResult> {
  try {
    // Преобразуем формат компонентов в массив для checkAdvancedCompatibility
    const componentsArray = Object.entries(components).map(
      ([categorySlug, productSlug]) => ({
        categorySlug,
        slug: productSlug,
      })
    );

    return await checkAdvancedCompatibility(componentsArray);
  } catch (error) {
    console.error("Error checking advanced build compatibility:", error);
    throw error;
  }
}

/**
 * Получает список компонентов, совместимых с выбранными, используя улучшенный алгоритм
 * @param categorySlug Slug категории, для которой ищем совместимые компоненты
 * @param components Выбранные компоненты в формате {categorySlug: productSlug}
 * @returns Массив ID совместимых компонентов с подробной информацией
 */
export async function getAdvancedCompatibleComponents(
  categorySlug: string,
  components: Record<string, string>
): Promise<{ id: number; details: any }[]> {
  try {
    // Получаем ID категории по slug
    const category = await db.query.categories.findFirst({
      where: eq(categories.slug, categorySlug),
    });

    if (!category) {
      throw new Error(`Категория ${categorySlug} не найдена`);
    }

    // Если нет выбранных компонентов, возвращаем все продукты категории
    if (Object.keys(components).length === 0) {
      const allProducts = await db.query.products.findMany({
        where: eq(products.categoryId, category.id),
      });
      return allProducts.map((p) => ({
        id: p.id,
        details: { compatible: true, issues: [] },
      }));
    }

    // Получаем ID компонентов, которые уже выбраны
    const selectedComponentIds: number[] = [];

    for (const [compCategorySlug, compProductSlug] of Object.entries(
      components
    )) {
      const compCategory = await db.query.categories.findFirst({
        where: eq(categories.slug, compCategorySlug),
      });

      if (!compCategory) continue;

      const compProduct = await db.query.products.findFirst({
        where: and(
          eq(products.slug, compProductSlug),
          eq(products.categoryId, compCategory.id)
        ),
      });

      if (compProduct) {
        selectedComponentIds.push(compProduct.id);
      }
    }

    // Если нет выбранных компонентов, возвращаем все продукты категории
    if (selectedComponentIds.length === 0) {
      const allProducts = await db.query.products.findMany({
        where: eq(products.categoryId, category.id),
      });
      return allProducts.map((p) => ({
        id: p.id,
        details: { compatible: true, issues: [] },
      }));
    }

    // Используем SQL-функцию для получения совместимых компонентов
    const result = await db.execute(
      sql`SELECT * FROM get_compatible_products_for_category(${category.id}, ${selectedComponentIds})`
    );

    // Преобразуем результат в нужный формат
    if (result && Array.isArray(result)) {
      return result.map((item: any) => ({
        id: item.product_id,
        details: item.compatibility_details,
      }));
    }

    return [];
  } catch (error) {
    console.error("Error getting advanced compatible components:", error);
    throw new Error(
      "Ошибка при получении улучшенного списка совместимых компонентов"
    );
  }
}

/**
 * Проверяет детальную совместимость двух конкретных компонентов
 * @param product1Slug Slug первого продукта
 * @param category1Slug Slug категории первого продукта
 * @param product2Slug Slug второго продукта
 * @param category2Slug Slug категории второго продукта
 * @returns Детальный результат проверки совместимости между компонентами
 */
export async function checkComponentPairCompatibility(
  product1Slug: string,
  category1Slug: string,
  product2Slug: string,
  category2Slug: string
): Promise<any> {
  try {
    // Получаем информацию о первом компоненте
    const category1 = await db.query.categories.findFirst({
      where: eq(categories.slug, category1Slug),
    });

    if (!category1) {
      throw new Error(`Категория ${category1Slug} не найдена`);
    }

    const product1 = await db.query.products.findFirst({
      where: and(
        eq(products.slug, product1Slug),
        eq(products.categoryId, category1.id)
      ),
    });

    if (!product1) {
      throw new Error(
        `Продукт ${product1Slug} не найден в категории ${category1Slug}`
      );
    }

    // Получаем информацию о втором компоненте
    const category2 = await db.query.categories.findFirst({
      where: eq(categories.slug, category2Slug),
    });

    if (!category2) {
      throw new Error(`Категория ${category2Slug} не найдена`);
    }

    const product2 = await db.query.products.findFirst({
      where: and(
        eq(products.slug, product2Slug),
        eq(products.categoryId, category2.id)
      ),
    });

    if (!product2) {
      throw new Error(
        `Продукт ${product2Slug} не найден в категории ${category2Slug}`
      );
    }

    // Используем улучшенную SQL-функцию для проверки совместимости
    const result = await db.execute(
      sql`SELECT get_detailed_compatibility(${product1.id}, ${product2.id}) as compatibility_result`
    );

    if (result && Array.isArray(result) && result.length > 0) {
      return (result[0] as any).compatibility_result;
    }

    return { compatible: true, issues: [] };
  } catch (error) {
    console.error("Error checking component pair compatibility:", error);
    throw new Error("Ошибка при проверке совместимости компонентов");
  }
}

/**
 * Нормализует строковые значения для более точного сравнения
 * @param value Строковое значение для нормализации
 * @param type Тип значения (pcie, socket, memory, power, form_factor)
 * @returns Нормализованное значение
 */
export function normalizeValue(value: string, type: string): string {
  // Если значение не определено, возвращаем как есть
  if (!value) return value;

  // Базовые преобразования для всех типов
  let result = value.trim();

  // Специфичные преобразования в зависимости от типа значения
  switch (type) {
    case "pcie":
      // Нормализация PCIe значений
      result = result
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/x(\d+)/g, "$1x")
        .replace(/pci-e|pciexpress/g, "pcie")
        .replace(/(\d+)\s*x\s*/g, "$1x")
        .replace(/\([^)]*\)/g, "");
      break;

    case "socket":
      // Нормализация сокетов
      result = result.replace(/\s*\([^)]*\)/g, "").trim();
      if (!result.startsWith("LGA")) {
        result = result.toUpperCase();
      }
      break;

    case "memory":
      // Нормализация типов памяти
      result = result
        .replace(/\s+/g, "")
        .replace(/DDR(\d)/g, "DDR$1")
        .replace(/SDRAM/g, "")
        .toUpperCase();
      break;

    case "power":
      // Нормализация разъемов питания
      result = result
        .toLowerCase()
        .replace(/-/g, " ")
        .replace(/pins/g, "pin")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/eps |pcie /g, "");
      break;

    case "form_factor":
      // Нормализация форм-факторов
      result = result
        .toUpperCase()
        .replace(/STANDARD-/g, "")
        .replace(/MICRO-/g, "M")
        .replace(/MINI-/g, "");
      break;

    case "dimensions":
      // Извлечение числового значения из размеров
      const numericValue = result.match(/(\d+(?:\.\d+)?)/);
      result = numericValue ? numericValue[0] : result;
      break;

    default:
      // По умолчанию оставляем как есть
      break;
  }

  return result;
}

/**
 * Проверяет совместимость значений разъемов питания
 * @param psuConnectors Строка с разъемами питания БП
 * @param requiredConnectors Строка с требуемыми разъемами
 * @returns Результат совместимости
 */
export function checkPowerConnectorsCompatibility(
  psuConnectors: string,
  requiredConnectors: string
): { compatible: boolean; reason?: string } {
  try {
    // Нормализуем значения
    const normalizedPsu = normalizeValue(psuConnectors, "power");
    const normalizedReq = normalizeValue(requiredConnectors, "power");

    // Простая проверка на одинаковые значения
    if (normalizedPsu === normalizedReq) {
      return { compatible: true };
    }

    // Проверка на 12VHPWR/16 pin
    if (
      (normalizedPsu.includes("12vhpwr") || normalizedPsu.includes("16 pin")) &&
      (normalizedReq.includes("12vhpwr") || normalizedReq.includes("16 pin"))
    ) {
      return { compatible: true };
    }

    // Подсчитываем доступные разъемы блока питания
    let psu6plus2Count = 0;
    let psu8pinCount = 0;
    let psu6pinCount = 0;
    let psu12vhpwrCount = 0;

    // Пытаемся распарсить количество 6+2 pin разъемов
    const plus2Match = normalizedPsu.match(/(\d+)\s*x\s*6\+2\s*pin/);
    if (plus2Match) {
      psu6plus2Count = parseInt(plus2Match[1]);
    } else if (normalizedPsu.includes("6+2 pin")) {
      psu6plus2Count = 1;
    }

    // Пытаемся распарсить количество 8 pin разъемов
    if (normalizedPsu.includes("8 pin") && !normalizedPsu.includes("6+2")) {
      const pin8Match = normalizedPsu.match(/(\d+)\s*x\s*8\s*pin/);
      psu8pinCount = pin8Match
        ? parseInt(pin8Match[1])
        : normalizedPsu.includes("8 pin")
        ? 1
        : 0;
    }

    // Пытаемся распарсить количество 6 pin разъемов
    if (normalizedPsu.includes("6 pin") && !normalizedPsu.includes("6+2")) {
      const pin6Match = normalizedPsu.match(/(\d+)\s*x\s*6\s*pin/);
      psu6pinCount = pin6Match
        ? parseInt(pin6Match[1])
        : normalizedPsu.includes("6 pin")
        ? 1
        : 0;
    }

    // Проверяем наличие 12VHPWR
    if (normalizedPsu.includes("12vhpwr") || normalizedPsu.includes("16 pin")) {
      psu12vhpwrCount = 1;
    }

    // Подсчитываем требуемые разъемы
    let req8pinCount = 0;
    let req6pinCount = 0;
    let req16pinCount = 0;

    // Пытаемся распарсить количество требуемых 8 pin разъемов
    if (normalizedReq.includes("8 pin") || normalizedReq.includes("8pin")) {
      const req8Match = normalizedReq.match(/(\d+)\s*x\s*8\s*pin/);
      req8pinCount = req8Match
        ? parseInt(req8Match[1])
        : normalizedReq.includes("8 pin")
        ? 1
        : 0;
    }

    // Пытаемся распарсить количество требуемых 6 pin разъемов
    if (normalizedReq.includes("6 pin")) {
      const req6Match = normalizedReq.match(/(\d+)\s*x\s*6\s*pin/);
      req6pinCount = req6Match
        ? parseInt(req6Match[1])
        : normalizedReq.includes("6 pin")
        ? 1
        : 0;
    }

    // Проверяем требование 12VHPWR
    if (normalizedReq.includes("12vhpwr") || normalizedReq.includes("16 pin")) {
      req16pinCount = 1;
    }

    // Проверяем совместимость
    // Если требуется 12VHPWR, но его нет у БП
    if (req16pinCount > 0 && psu12vhpwrCount === 0) {
      return {
        compatible: false,
        reason: `Блок питания не имеет 12VHPWR/16-pin разъема, который требуется для компонента`,
      };
    }

    // Проверяем достаточность 8-pin разъемов
    // Учитываем, что 6+2 pin может использоваться как 8 pin
    if (req8pinCount > psu8pinCount + psu6plus2Count) {
      return {
        compatible: false,
        reason: `Недостаточно 8-pin разъемов питания: требуется ${req8pinCount}, доступно ${
          psu8pinCount + psu6plus2Count
        }`,
      };
    }

    // Используем оставшиеся 6+2 pin разъемы для 6-pin
    const remaining6plus2 =
      psu6plus2Count - Math.max(0, req8pinCount - psu8pinCount);

    // Проверяем достаточность 6-pin разъемов
    if (req6pinCount > psu6pinCount + remaining6plus2) {
      return {
        compatible: false,
        reason: `Недостаточно 6-pin разъемов питания: требуется ${req6pinCount}, доступно ${
          psu6pinCount + remaining6plus2
        }`,
      };
    }

    // Если все проверки пройдены, разъемы совместимы
    return { compatible: true };
  } catch (error) {
    console.error("Ошибка при проверке совместимости разъемов питания:", error);
    // Возвращаем совместимость по умолчанию
    return { compatible: true };
  }
}

/**
 * Проверяет совместимость PCIe значений
 * @param motherboardPcie PCIe строка материнской платы
 * @param gpuPcie PCIe строка видеокарты
 * @returns Результат совместимости
 */
export function checkPcieCompatibility(
  motherboardPcie: string,
  gpuPcie: string
): { compatible: boolean; reason?: string } {
  try {
    // Нормализуем значения
    const normalizedMb = normalizeValue(motherboardPcie, "pcie");
    const normalizedGpu = normalizeValue(gpuPcie, "pcie");

    // Если после нормализации значения совпадают, они совместимы
    if (normalizedMb === normalizedGpu) {
      return { compatible: true };
    }

    // Пытаемся извлечь версию PCIe
    const mbVersionMatch = normalizedMb.match(/pcie([0-9\.]+)/);
    const gpuVersionMatch = normalizedGpu.match(/pcie([0-9\.]+)/);

    if (mbVersionMatch && gpuVersionMatch) {
      const mbVersion = parseFloat(mbVersionMatch[1]);
      const gpuVersion = parseFloat(gpuVersionMatch[1]);

      // Проверяем обратную совместимость - материнская плата должна поддерживать
      // ту же или более новую версию PCIe чем видеокарта
      if (mbVersion >= gpuVersion) {
        return { compatible: true };
      } else {
        return {
          compatible: false,
          reason: `Материнская плата с PCIe ${mbVersion} не поддерживает видеокарту с PCIe ${gpuVersion}`,
        };
      }
    }

    // Если не удалось извлечь версию, проверяем наличие x16 или 16x в обоих значениях
    if (
      (normalizedMb.includes("16x") || normalizedMb.includes("pcie")) &&
      (normalizedGpu.includes("16x") || normalizedGpu.includes("pcie"))
    ) {
      return { compatible: true };
    }

    // По умолчанию считаем совместимыми, если не смогли точно определить
    return { compatible: true };
  } catch (error) {
    console.error("Ошибка при проверке совместимости PCIe:", error);
    return { compatible: true };
  }
}

/**
 * Проверяет совместимость форм-факторов материнской платы и корпуса
 * @param caseFormFactor Форм-фактор корпуса
 * @param motherboardFormFactor Форм-фактор материнской платы
 * @returns Результат совместимости
 */
export function checkFormFactorCompatibility(
  caseFormFactor: string,
  motherboardFormFactor: string
): { compatible: boolean; reason?: string } {
  try {
    // Нормализуем значения
    const normalizedCase = normalizeValue(caseFormFactor, "form_factor");
    const normalizedMb = normalizeValue(motherboardFormFactor, "form_factor");

    // Прямая проверка на совпадение
    if (normalizedCase === normalizedMb) {
      return { compatible: true };
    }

    // Проверка на список форм-факторов в корпусе
    if (
      normalizedCase.includes(normalizedMb) ||
      normalizedCase.includes(normalizedMb + ",") ||
      normalizedCase.includes("," + normalizedMb)
    ) {
      return { compatible: true };
    }

    // Массив совместимых форм-факторов в порядке от большего к меньшему
    const formFactors = ["EATX", "ATX", "MATX", "ITX"];

    // Находим индексы форм-факторов в нашем массиве
    const mbIndex = formFactors.findIndex((ff) => normalizedMb.includes(ff));
    const caseIndex = formFactors.findIndex((ff) =>
      normalizedCase.includes(ff)
    );

    // Если нашли индексы обоих форм-факторов, проверяем совместимость
    // Корпус с меньшим индексом (более крупный форм-фактор) может вместить
    // материнскую плату с большим индексом (более мелкий форм-фактор)
    if (mbIndex !== -1 && caseIndex !== -1) {
      if (caseIndex <= mbIndex) {
        return { compatible: true };
      } else {
        return {
          compatible: false,
          reason: `Корпус (${caseFormFactor}) не поддерживает материнскую плату с форм-фактором ${motherboardFormFactor}`,
        };
      }
    }

    // Особые случаи совместимости
    if (
      normalizedCase.includes("ATX") &&
      (normalizedMb.includes("MATX") || normalizedMb.includes("ITX"))
    ) {
      return { compatible: true };
    }

    if (normalizedCase.includes("MATX") && normalizedMb.includes("ITX")) {
      return { compatible: true };
    }

    // По умолчанию считаем несовместимыми
    return {
      compatible: false,
      reason: `Форм-фактор материнской платы ${motherboardFormFactor} не совместим с корпусом ${caseFormFactor}`,
    };
  } catch (error) {
    console.error("Ошибка при проверке совместимости форм-факторов:", error);
    return { compatible: true };
  }
}

/**
 * Проверяет совместимость накопителя и материнской платы
 * @param storageType Тип накопителя (например, 'M.2', 'SATA')
 * @param storageInterface Интерфейс накопителя (например, 'NVMe', 'SATA III')
 * @param motherboardNvmeSupport Поддержка NVMe на материнской плате
 * @param motherboardM2Slots Количество слотов M.2 на материнской плате
 * @param motherboardSataPorts Количество портов SATA на материнской плате
 * @returns Результат совместимости
 */
export function checkStorageCompatibility(
  storageType: string,
  storageInterface: string,
  motherboardNvmeSupport: string,
  motherboardM2Slots: string,
  motherboardSataPorts: string
): { compatible: boolean; reason?: string } {
  try {
    // Нормализуем значения для более точного сравнения
    const normalizedStorageType = storageType.trim().toLowerCase();
    const normalizedInterface = storageInterface.trim().toLowerCase();
    const normalizedNvmeSupport = motherboardNvmeSupport.trim().toLowerCase();

    // Проверяем M.2 накопители
    if (normalizedStorageType.includes("m.2")) {
      // Проверяем наличие слотов M.2
      if (!motherboardM2Slots || parseInt(motherboardM2Slots) === 0) {
        return {
          compatible: false,
          reason: `Материнская плата не имеет слотов M.2 для установки накопителя`,
        };
      }

      // Проверяем совместимость NVMe накопителей
      if (normalizedInterface.includes("nvme")) {
        // Если материнская плата не поддерживает NVMe
        if (
          !normalizedNvmeSupport.includes("есть") &&
          !normalizedNvmeSupport.includes("да")
        ) {
          return {
            compatible: false,
            reason: `Материнская плата не поддерживает накопители NVMe`,
          };
        }
      }

      return { compatible: true };
    }

    // Проверяем SATA накопители
    if (
      normalizedStorageType.includes("ssd") ||
      normalizedStorageType.includes("hdd") ||
      normalizedInterface.includes("sata")
    ) {
      // Проверяем наличие портов SATA
      if (!motherboardSataPorts || parseInt(motherboardSataPorts) === 0) {
        return {
          compatible: false,
          reason: `Материнская плата не имеет портов SATA для подключения накопителя`,
        };
      }

      return { compatible: true };
    }

    // По умолчанию считаем совместимым, если не удалось определить тип
    return { compatible: true };
  } catch (error) {
    console.error("Ошибка при проверке совместимости накопителя:", error);
    // Возвращаем совместимость по умолчанию при ошибке
    return { compatible: true };
  }
}

/**
 * Проверяет совместимость системы охлаждения с процессором и корпусом
 * @param coolerType Тип охлаждения ('air' для воздушного, 'liquid' для СЖО)
 * @param coolerSocket Поддерживаемые сокеты кулера (список через запятую)
 * @param coolerTdpRating Рейтинг TDP кулера (максимальный TDP, который может охладить)
 * @param coolerHeight Высота кулера (для воздушных) или размер радиатора (для СЖО)
 * @param cpuSocket Сокет процессора
 * @param cpuTdp TDP процессора
 * @param caseMaxCoolerHeight Максимальная высота кулера для корпуса
 * @param caseRadiatorSupport Поддержка радиаторов в корпусе (размеры радиаторов)
 * @returns Результат совместимости
 */
export function checkCoolingCompatibility(
  coolerType: string,
  coolerSocket: string,
  coolerTdpRating: string,
  coolerHeight: string,
  cpuSocket: string,
  cpuTdp: string,
  caseMaxCoolerHeight: string,
  caseRadiatorSupport: string
): { compatible: boolean; reason?: string } {
  try {
    // Нормализуем значения для более точного сравнения
    const normalizedCoolerType = coolerType.trim().toLowerCase();

    // Проверяем совместимость сокетов
    const supportedSockets = coolerSocket.split(",").map((s) => s.trim());
    const normalizedCpuSocket = cpuSocket.trim();

    // Проверка сокета, общая для обоих типов охлаждения
    if (
      !supportedSockets.some(
        (socket) =>
          normalizedCpuSocket === socket ||
          socket.includes("универсальный") ||
          socket.includes(normalizedCpuSocket)
      )
    ) {
      return {
        compatible: false,
        reason: `Система охлаждения не поддерживает сокет ${cpuSocket}`,
      };
    }

    // Проверка TDP, общая для обоих типов охлаждения
    if (coolerTdpRating && cpuTdp) {
      const coolerTdp = parseInt(coolerTdpRating.replace(/\D/g, ""));
      const processorTdp = parseInt(cpuTdp.replace(/\D/g, ""));

      if (coolerTdp < processorTdp) {
        return {
          compatible: false,
          reason: `Система охлаждения с TDP ${coolerTdpRating} недостаточна для процессора с TDP ${cpuTdp}`,
        };
      }
    }

    // Для воздушного охлаждения
    if (
      normalizedCoolerType.includes("воздушн") ||
      !normalizedCoolerType.includes("жидкост")
    ) {
      // Проверяем высоту кулера
      if (coolerHeight && caseMaxCoolerHeight) {
        const actualHeight = parseInt(coolerHeight.replace(/\D/g, ""));
        const maxHeight = parseInt(caseMaxCoolerHeight.replace(/\D/g, ""));

        if (actualHeight > maxHeight) {
          return {
            compatible: false,
            reason: `Высота кулера (${coolerHeight}) превышает максимально допустимую для корпуса (${caseMaxCoolerHeight})`,
          };
        }
      }
    }
    // Для жидкостного охлаждения (СЖО)
    else if (
      normalizedCoolerType.includes("жидкост") ||
      normalizedCoolerType.includes("сжо")
    ) {
      // Проверяем поддержку радиаторов
      if (coolerHeight && caseRadiatorSupport) {
        // Размер радиатора обычно в формате "240 мм" или "360 мм"
        const radiatorSize = coolerHeight.replace(/\D/g, "");

        if (!caseRadiatorSupport.includes(radiatorSize)) {
          return {
            compatible: false,
            reason: `Корпус не поддерживает установку радиатора размером ${coolerHeight}`,
          };
        }
      }
    }

    // Если все проверки пройдены, компоненты совместимы
    return { compatible: true };
  } catch (error) {
    console.error("Ошибка при проверке совместимости охлаждения:", error);
    // Возвращаем совместимость по умолчанию при ошибке
    return { compatible: true };
  }
}
