import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  pcBuilds,
  products,
  categories,
  productCharacteristics,
  characteristicsTypes,
  users,
  userProfiles,
} from "@/lib/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { calculateBuildPrice } from "@/services/buildService";
import { validateBuild } from "@/services/validationService";

export async function GET(request: NextRequest) {
  try {
    const segments = request.nextUrl.pathname.split("/");
    const buildSlug = segments[segments.length - 1];

    // Получаем сборку с правильной структурой данных пользователя
    const [buildData] = await db
      .select({
        id: pcBuilds.id,
        name: pcBuilds.name,
        slug: pcBuilds.slug,
        components: pcBuilds.components,
        totalPrice: pcBuilds.totalPrice,
        createdAt: pcBuilds.createdAt,
        updatedAt: pcBuilds.updatedAt,
        userId: pcBuilds.userId,
        user_id: users.id,
        user_email: users.email,
        user_firstName: userProfiles.firstName,
        user_lastName: userProfiles.lastName,
      })
      .from(pcBuilds)
      .leftJoin(users, eq(pcBuilds.userId, users.id))
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(eq(pcBuilds.slug, buildSlug))
      .limit(1);

    if (!buildData) {
      return NextResponse.json({ error: "Сборка не найдена" }, { status: 404 });
    }

    // Форматируем данные в нужную структуру
    const build = {
      ...buildData,
      user: buildData.user_id
        ? {
            id: buildData.user_id,
            email: buildData.user_email,
            profile: {
              firstName: buildData.user_firstName,
              lastName: buildData.user_lastName,
            },
          }
        : null,
    };

    // Обработка компонентов с проверкой типа
    const components =
      typeof build.components === "string"
        ? JSON.parse(build.components)
        : build.components;

    if (!components) {
      throw new Error("Invalid components data");
    }

    // Получаем все категории и продукты за один запрос
    const [categoriesData, productsData] = await Promise.all([
      db.select().from(categories),
      db
        .select()
        .from(products)
        .where(inArray(products.slug, Object.values(components))),
    ]);

    // Создаем мапы для быстрого доступа
    const categoriesMap = new Map(categoriesData.map((c) => [c.slug, c]));
    const productsMap = new Map(productsData.map((p) => [p.slug, p]));

    // Получаем характеристики для всех найденных продуктов
    const productIds = productsData.map((p) => p.id);
    const characteristics =
      productIds.length > 0
        ? await db
            .select({
              productId: productCharacteristics.product_id,
              type: characteristicsTypes.name,
              value: productCharacteristics.value,
            })
            .from(productCharacteristics)
            .leftJoin(
              characteristicsTypes,
              eq(
                characteristicsTypes.id,
                productCharacteristics.characteristic_type_id
              )
            )
            .where(inArray(productCharacteristics.product_id, productIds))
        : [];

    // Группируем характеристики по продуктам
    const characteristicsMap = new Map();
    characteristics.forEach((char) => {
      if (!characteristicsMap.has(char.productId)) {
        characteristicsMap.set(char.productId, []);
      }
      characteristicsMap.get(char.productId).push({
        type: char.type,
        value: char.value,
      });
    });

    // Собираем детальную информацию о компонентах
    const detailedComponents = Object.entries(components)
      .map(([categorySlug, productSlug]) => {
        const category = categoriesMap.get(categorySlug);
        const product = productsMap.get(productSlug as string);

        if (!category || !product) return null;

        return {
          category: {
            id: category.id,
            name: category.name,
            slug: category.slug,
          },
          product: {
            ...product,
            price: Number(product.price),
            characteristics: characteristicsMap.get(product.id) || [],
          },
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      build: {
        ...build,
        components: detailedComponents,
      },
    });
  } catch (error) {
    console.error("Error fetching build:", error);
    return NextResponse.json(
      { error: "Ошибка при получении сборки" },
      { status: 500 }
    );
  }
}

// Обновление сборки
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    // Получаем slug из параметров
    const { slug } = await context.params;

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const data = await request.json();

    if (!data.name || !data.components) {
      return NextResponse.json(
        { error: "Отсутствуют обязательные поля" },
        { status: 400 }
      );
    }

    // Проверяем полноту сборки
    const validation = await validateBuild(data.components);
    const totalPrice = await calculateBuildPrice(data.components);

    const [build] = await db
      .select()
      .from(pcBuilds)
      .where(eq(pcBuilds.slug, slug))
      .limit(1);

    if (!build) {
      return NextResponse.json({ error: "Сборка не найдена" }, { status: 404 });
    }

    const [updatedBuild] = await db
      .update(pcBuilds)
      .set({
        name: data.name,
        components: JSON.stringify(data.components),
        totalPrice: totalPrice.toString(),
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(and(eq(pcBuilds.id, build.id), eq(pcBuilds.userId, build.userId)))
      .returning();

    return NextResponse.json({
      build: updatedBuild,
      validation,
    });
  } catch (error) {
    console.error("Error updating build:", error);
    return NextResponse.json(
      { error: "Ошибка при обновлении сборки" },
      { status: 500 }
    );
  }
}

// Удаление сборки
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    // Получаем slug из параметров
    const { slug } = await context.params;

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const [build] = await db
      .select()
      .from(pcBuilds)
      .where(eq(pcBuilds.slug, slug))
      .limit(1);

    if (!build) {
      return NextResponse.json({ error: "Сборка не найдена" }, { status: 404 });
    }

    const [deletedBuild] = await db
      .delete(pcBuilds)
      .where(and(eq(pcBuilds.id, build.id), eq(pcBuilds.userId, build.userId)))
      .returning();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting build:", error);
    return NextResponse.json(
      { error: "Ошибка при удалении сборки" },
      { status: 500 }
    );
  }
}
