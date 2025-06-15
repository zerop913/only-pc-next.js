import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  pcBuilds,
  users,
  userProfiles,
  products,
  categories,
  orderItems,
  orders,
} from "@/lib/db/schema";
import { eq, count, sql } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const buildId = parseInt(id, 10);

    if (isNaN(buildId)) {
      return NextResponse.json({ error: "Invalid build ID" }, { status: 400 });
    }

    // Получение детальной информации о сборке
    const buildResult = await db
      .select({
        id: pcBuilds.id,
        name: pcBuilds.name,
        slug: pcBuilds.slug,
        totalPrice: pcBuilds.totalPrice,
        createdAt: pcBuilds.createdAt,
        updatedAt: pcBuilds.updatedAt,
        components: pcBuilds.components,
        userId: users.id,
        userEmail: users.email,
        userFirstName: userProfiles.firstName,
        userLastName: userProfiles.lastName,
      })
      .from(pcBuilds)
      .leftJoin(users, eq(pcBuilds.userId, users.id))
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(eq(pcBuilds.id, buildId))
      .limit(1);

    if (buildResult.length === 0) {
      return NextResponse.json({ error: "Build not found" }, { status: 404 });
    }

    const build = buildResult[0];

    // Парсинг компонентов сборки
    let components = {};
    let componentDetails: any[] = [];
    try {
      // Проверяем, является ли components уже объектом
      if (typeof build.components === "string") {
        components = JSON.parse(build.components);
      } else if (
        typeof build.components === "object" &&
        build.components !== null
      ) {
        components = build.components;
      } // Получение детальной информации о компонентах
      const componentIdentifiers = Object.values(components).filter(
        (identifier) => identifier
      );

      if (componentIdentifiers.length > 0) {
        // Проверяем, являются ли значения числами (ID) или строками (slug)
        const isNumericId = componentIdentifiers.every(
          (id) => !isNaN(Number(id))
        );

        let componentsResult;
        if (isNumericId) {
          // Если ID - числа, ищем по ID
          componentsResult = await db
            .select({
              id: products.id,
              title: products.title,
              price: products.price,
              brand: products.brand,
              image: products.image,
              categoryId: products.categoryId,
              categoryName: categories.name,
              categorySlug: categories.slug,
            })
            .from(products)
            .innerJoin(categories, eq(products.categoryId, categories.id))
            .where(
              sql`${products.id} in (${sql.join(
                componentIdentifiers.map((id) => sql`${id}`),
                sql`, `
              )})`
            )
            .orderBy(categories.name);
        } else {
          // Если slug - строки, ищем по slug
          componentsResult = await db
            .select({
              id: products.id,
              title: products.title,
              price: products.price,
              brand: products.brand,
              image: products.image,
              categoryId: products.categoryId,
              categoryName: categories.name,
              categorySlug: categories.slug,
            })
            .from(products)
            .innerJoin(categories, eq(products.categoryId, categories.id))
            .where(
              sql`${products.slug} in (${sql.join(
                componentIdentifiers.map((slug) => sql`${slug}`),
                sql`, `
              )})`
            )
            .orderBy(categories.name);
        }

        componentDetails = componentsResult;
      }
    } catch (error) {
      console.error("Error parsing components for build", buildId, error);
      console.log("Components data:", build.components);
      // В случае ошибки возвращаем пустой массив компонентов
      componentDetails = [];
    }

    // Статистика продаж этой сборки
    const salesStats = await db
      .select({
        totalSales: count(),
        totalRevenue: sql<number>`sum(cast(${orders.totalPrice} as decimal))`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(eq(orderItems.buildId, buildId));

    const stats = salesStats[0] || { totalSales: 0, totalRevenue: 0 };

    // Последние заказы с этой сборкой
    const recentOrders = await db
      .select({
        orderId: orders.id,
        orderNumber: orders.orderNumber,
        createdAt: orders.createdAt,
        totalPrice: orders.totalPrice,
        userEmail: users.email,
        userFirstName: userProfiles.firstName,
        userLastName: userProfiles.lastName,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .where(eq(orderItems.buildId, buildId))
      .orderBy(sql`${orders.createdAt} desc`)
      .limit(10);

    const processedBuild = {
      ...build,
      totalPrice: parseFloat(build.totalPrice as string),
      customerName:
        build.userFirstName && build.userLastName
          ? `${build.userFirstName} ${build.userLastName}`
          : build.userEmail || "Неизвестный пользователь",
      components: componentDetails,
      stats: {
        totalSales: stats.totalSales,
        totalRevenue: Number(stats.totalRevenue) || 0,
      },
      recentOrders: recentOrders.map((order) => ({
        ...order,
        totalPrice: parseFloat(order.totalPrice as string),
        customerName:
          order.userFirstName && order.userLastName
            ? `${order.userFirstName} ${order.userLastName}`
            : order.userEmail || "Неизвестный клиент",
      })),
    };

    return NextResponse.json({ build: processedBuild });
  } catch (error) {
    console.error("Error fetching build details:", error);
    return NextResponse.json(
      { error: "Failed to fetch build details" },
      { status: 500 }
    );
  }
}
