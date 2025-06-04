import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import {
  orders,
  orderItems,
  orderStatuses,
  users,
  userProfiles,
  paymentMethods,
  pcBuilds,
} from "@/lib/db/schema";
import {
  eq,
  desc,
  count,
  and,
  gte,
  lte,
  inArray,
  notInArray,
  sum,
  avg,
  min,
  max,
  countDistinct,
} from "drizzle-orm";
import type { AnalyticsData } from "@/types/analytics";

/**
 * Получение аналитических данных для менеджера
 */
async function handler(
  request: NextRequest,
  context: { currentUserId: number; roleId: number }
) {
  try {
    // Проверка прав доступа (только менеджеры и админы)
    if (context.roleId !== 1 && context.roleId !== 3) {
      return NextResponse.json(
        { error: "Недостаточно прав доступа" },
        { status: 403 }
      );
    }

    // Получение параметров из URL
    const { searchParams } = new URL(request.url);
    const period = parseInt(searchParams.get("period") || "30"); // дни

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);

    const dateFilter = and(
      gte(orders.createdAt, startDate.toISOString()),
      lte(orders.createdAt, endDate.toISOString())
    );

    const paidOrdersFilter = and(
      dateFilter,
      notInArray(orders.statusId, [1, 7]) // Исключаем "Новый" и "Отменен"
    );

    // 1. Общее количество заказов за период
    const totalOrdersResult = await db
      .select({ count: count() })
      .from(orders)
      .where(dateFilter);

    // 2. Общая выручка (только оплаченные заказы)
    const paidOrders = await db
      .select({ totalPrice: orders.totalPrice })
      .from(orders)
      .where(paidOrdersFilter);

    const totalRevenue = paidOrders.reduce((sum, order) => {
      return sum + parseFloat(order.totalPrice || "0");
    }, 0);

    // 3. Количество уникальных клиентов
    const uniqueCustomers = await db
      .selectDistinct({ userId: orders.userId })
      .from(orders)
      .where(dateFilter);

    const totalCustomers = uniqueCustomers.length;

    // 4. Средний чек
    const averageOrder =
      paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

    // 5. Топ товары (сборки)
    const orderItemsWithBuilds = await db
      .select({
        buildId: orderItems.buildId,
        quantity: orderItems.quantity,
        orderId: orderItems.orderId,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(pcBuilds, eq(orderItems.buildId, pcBuilds.id))
      .where(
        and(
          gte(orders.createdAt, startDate.toISOString()),
          lte(orders.createdAt, endDate.toISOString()),
          notInArray(orders.statusId, [1, 7]) // Исключаем "Новый" и "Отменен"
        )
      );

    // Группируем по buildId и подсчитываем статистику
    const buildsMap = new Map<
      number,
      { quantity: number; orderIds: Set<number> }
    >();

    orderItemsWithBuilds.forEach((item) => {
      if (item.buildId) {
        const existing = buildsMap.get(item.buildId) || {
          quantity: 0,
          orderIds: new Set(),
        };
        existing.quantity += item.quantity || 1;
        existing.orderIds.add(item.orderId);
        buildsMap.set(item.buildId, existing);
      }
    });

    // Получаем информацию о сборках
    const buildIds = Array.from(buildsMap.keys());
    const buildsInfo =
      buildIds.length > 0
        ? await db
            .select({
              id: pcBuilds.id,
              name: pcBuilds.name,
              totalPrice: pcBuilds.totalPrice,
            })
            .from(pcBuilds)
            .where(inArray(pcBuilds.id, buildIds))
        : [];

    const topProducts = buildsInfo
      .map((build) => {
        const stats = buildsMap.get(build.id);
        if (!stats) return null;

        return {
          name: build.name,
          totalSold: stats.quantity,
          totalRevenue: stats.quantity * parseFloat(build.totalPrice || "0"),
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b?.totalSold || 0) - (a?.totalSold || 0))
      .slice(0, 10);

    // 6. Заказы по статусам
    const allStatuses = await db.select().from(orderStatuses);

    const ordersByStatus = await Promise.all(
      allStatuses.map(async (status) => {
        const statusOrders = await db
          .select({ count: count() })
          .from(orders)
          .where(and(dateFilter, eq(orders.statusId, status.id)));

        return {
          statusName: status.name,
          statusColor: status.color,
          count: statusOrders[0]?.count || 0,
        };
      })
    );

    // 7. Выручка по дням
    const dailyRevenue = new Map<string, number>();

    // Получаем оплаченные заказы с датами
    const paidOrdersWithDates = await db
      .select({
        totalPrice: orders.totalPrice,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(paidOrdersFilter);

    paidOrdersWithDates.forEach((order) => {
      // Правильно извлекаем дату из timestamp
      let date;
      if (order.createdAt) {
        // Если дата содержит timezone info, обрабатываем её
        if (order.createdAt.includes("+")) {
          date = order.createdAt.split(" ")[0]; // Берем только дату до пробела
        } else {
          date = order.createdAt.split("T")[0]; // Стандартный ISO формат
        }
      } else {
        date = new Date().toISOString().split("T")[0];
      }

      const currentRevenue = dailyRevenue.get(date) || 0;
      dailyRevenue.set(
        date,
        currentRevenue + parseFloat(order.totalPrice || "0")
      );
    });

    const revenueByDay = Array.from(dailyRevenue.entries())
      .map(([date, revenue]) => ({
        date,
        revenue,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 8. Заказы по дням
    const dailyOrders = new Map<string, number>();
    const allOrdersInPeriod = await db
      .select({
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(dateFilter);

    allOrdersInPeriod.forEach((order) => {
      // Правильно извлекаем дату из timestamp
      let date;
      if (order.createdAt) {
        // Если дата содержит timezone info, обрабатываем её
        if (order.createdAt.includes("+")) {
          date = order.createdAt.split(" ")[0]; // Берем только дату до пробела
        } else {
          date = order.createdAt.split("T")[0]; // Стандартный ISO формат
        }
      } else {
        date = new Date().toISOString().split("T")[0];
      }

      const currentCount = dailyOrders.get(date) || 0;
      dailyOrders.set(date, currentCount + 1);
    });

    // Создаем полный набор дат для периода
    const allDates: string[] = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      allDates.push(currentDate.toISOString().split("T")[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Заполняем данные для всех дат (включая дни без заказов/выручки)
    const completeRevenueByDay = allDates.map((date) => ({
      date,
      revenue: dailyRevenue.get(date) || 0,
    }));

    const completeOrdersByDay = allDates.map((date) => ({
      date,
      ordersCount: dailyOrders.get(date) || 0,
    }));

    // 9. Статистика способов оплаты
    const ordersWithPayments = await db
      .select({
        paymentMethodId: orders.paymentMethodId,
        totalPrice: orders.totalPrice,
      })
      .from(orders)
      .where(paidOrdersFilter);

    const paymentStats = new Map<
      number,
      { count: number; totalAmount: number }
    >();

    ordersWithPayments.forEach((order) => {
      if (order.paymentMethodId) {
        const existing = paymentStats.get(order.paymentMethodId) || {
          count: 0,
          totalAmount: 0,
        };
        existing.count += 1;
        existing.totalAmount += parseFloat(order.totalPrice || "0");
        paymentStats.set(order.paymentMethodId, existing);
      }
    });

    const paymentMethodIds = Array.from(paymentStats.keys());
    const paymentMethodsInfo =
      paymentMethodIds.length > 0
        ? await db
            .select({
              id: paymentMethods.id,
              name: paymentMethods.name,
            })
            .from(paymentMethods)
            .where(inArray(paymentMethods.id, paymentMethodIds))
        : [];

    const paymentMethodsResult = paymentMethodsInfo.map((method) => {
      const stats = paymentStats.get(method.id);
      return {
        method: method.name,
        count: stats?.count || 0,
        totalAmount: stats?.totalAmount || 0,
      };
    });

    // Формирование ответа
    const analytics: AnalyticsData = {
      period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),

      overview: {
        totalOrders: totalOrdersResult[0]?.count || 0,
        totalRevenue,
        totalCustomers,
        averageOrder,
      },
      topProducts: topProducts as any[],

      ordersByStatus,

      revenueByDay: completeRevenueByDay,

      ordersByDay: completeOrdersByDay,

      paymentMethods: paymentMethodsResult,
    };

    return NextResponse.json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error("Ошибка получения аналитики:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Ошибка при получении аналитических данных",
      },
      { status: 500 }
    );
  }
}

// Применяем middleware аутентификации для менеджеров и админов
export const GET = withAuth(handler, ["manager", "admin"]);
