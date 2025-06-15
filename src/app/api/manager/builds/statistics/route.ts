import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pcBuilds, orderItems, orders } from "@/lib/db/schema";
import { desc, eq, count, sql, and, gte, isNotNull } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "month"; // week, month, year, all    // Определяем период для фильтрации
    let dateFilter;
    const now = new Date();

    switch (period) {
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = gte(orders.createdAt, weekAgo.toISOString());
        break;
      case "month":
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        dateFilter = gte(orders.createdAt, monthAgo.toISOString());
        break;
      case "year":
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        dateFilter = gte(orders.createdAt, yearAgo.toISOString());
        break;
      default:
        dateFilter = undefined;
    }

    // Общая статистика сборок
    const totalBuildsResult = await db
      .select({ count: count() })
      .from(pcBuilds);

    const totalBuilds = totalBuildsResult[0].count; // Статистика продаж сборок
    const salesQuery = db
      .select({
        buildId: orderItems.buildId,
        buildName: pcBuilds.name,
        totalSales: count(),
        totalRevenue: sql<number>`sum(cast(${orders.totalPrice} as decimal))`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(pcBuilds, eq(orderItems.buildId, pcBuilds.id))
      .where(and(isNotNull(orderItems.buildId), dateFilter))
      .groupBy(orderItems.buildId, pcBuilds.name)
      .orderBy(desc(count()));

    const buildSales = await salesQuery;

    // Топ популярных сборок
    const topBuilds = buildSales.slice(0, 10);

    // Общий доход от сборок
    const totalRevenueResult = await db
      .select({
        revenue: sql<number>`sum(cast(${orders.totalPrice} as decimal))`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(isNotNull(orderItems.buildId), dateFilter));

    const totalRevenue = totalRevenueResult[0]?.revenue || 0;

    // Количество проданных сборок
    const soldBuildsResult = await db
      .select({ count: count() })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(isNotNull(orderItems.buildId), dateFilter));

    const soldBuilds = soldBuildsResult[0].count;

    // Средняя цена сборки
    const avgPriceResult = await db
      .select({
        avgPrice: sql<number>`avg(cast(${pcBuilds.totalPrice} as decimal))`,
      })
      .from(pcBuilds);

    const avgPrice = avgPriceResult[0]?.avgPrice || 0;

    // Сборки по диапазонам цен
    const priceRanges = await db
      .select({
        range: sql<string>`
          case 
            when cast(${pcBuilds.totalPrice} as decimal) < 50000 then 'До 50,000 ₽'
            when cast(${pcBuilds.totalPrice} as decimal) < 100000 then '50,000 - 100,000 ₽'
            when cast(${pcBuilds.totalPrice} as decimal) < 150000 then '100,000 - 150,000 ₽'
            when cast(${pcBuilds.totalPrice} as decimal) < 200000 then '150,000 - 200,000 ₽'
            else 'Свыше 200,000 ₽'
          end
        `,
        count: count(),
      })
      .from(pcBuilds).groupBy(sql`
        case 
          when cast(${pcBuilds.totalPrice} as decimal) < 50000 then 'До 50,000 ₽'
          when cast(${pcBuilds.totalPrice} as decimal) < 100000 then '50,000 - 100,000 ₽'
          when cast(${pcBuilds.totalPrice} as decimal) < 150000 then '100,000 - 150,000 ₽'
          when cast(${pcBuilds.totalPrice} as decimal) < 200000 then '150,000 - 200,000 ₽'
          else 'Свыше 200,000 ₽'
        end
      `);

    // Недавно созданные сборки
    const recentBuilds = await db
      .select({
        id: pcBuilds.id,
        name: pcBuilds.name,
        totalPrice: pcBuilds.totalPrice,
        createdAt: pcBuilds.createdAt,
      })
      .from(pcBuilds)
      .orderBy(desc(pcBuilds.createdAt))
      .limit(5);

    return NextResponse.json({
      summary: {
        totalBuilds,
        soldBuilds,
        totalRevenue: Number(totalRevenue),
        avgPrice: Number(avgPrice),
      },
      topBuilds: topBuilds.map((build) => ({
        ...build,
        totalRevenue: Number(build.totalRevenue),
      })),
      priceRanges,
      recentBuilds: recentBuilds.map((build) => ({
        ...build,
        totalPrice: Number(build.totalPrice),
      })),
      period,
    });
  } catch (error) {
    console.error("Error fetching build statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch build statistics" },
      { status: 500 }
    );
  }
}
