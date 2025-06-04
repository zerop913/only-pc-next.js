import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/auth/_helpers/auth-helpers";
import { db } from "@/lib/db";
import { orders, users, userProfiles, orderStatuses } from "@/lib/db/schema";
import { eq, desc, sql, count } from "drizzle-orm";

// Получение клиентов с информацией о заказах для менеджера
async function getHandler(
  request: NextRequest,
  context: { currentUserId: number }
) {
  try {    // Получаем пользователей которые делали заказы с агрегированной информацией
    const clientsWithOrders = await db
      .select({
        userId: users.id,
        email: users.email,
        firstName: userProfiles.firstName,
        lastName: userProfiles.lastName,
        phone: userProfiles.phoneNumber,
        totalOrders: count(orders.id),
        totalSpent: sql<string>`SUM(CAST(${orders.totalPrice} AS DECIMAL(10,2)))`,
        lastOrderDate: sql<string>`MAX(${orders.createdAt})`,
        firstOrderDate: sql<string>`MIN(${orders.createdAt})`,
      })
      .from(users)
      .innerJoin(orders, eq(orders.userId, users.id))
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .groupBy(users.id, users.email, userProfiles.firstName, userProfiles.lastName, userProfiles.phoneNumber)
      .orderBy(desc(sql`MAX(${orders.createdAt})`));

    // Для каждого клиента получаем подробную информацию о заказах
    const clientsWithOrderDetails = await Promise.all(
      clientsWithOrders.map(async (client) => {
        // Получаем последние 5 заказов клиента
        const recentOrders = await db
          .select({
            id: orders.id,
            orderNumber: orders.orderNumber,
            totalPrice: orders.totalPrice,
            createdAt: orders.createdAt,
            statusId: orders.statusId,
            statusName: orderStatuses.name,
            statusColor: orderStatuses.color,
          })
          .from(orders)
          .leftJoin(orderStatuses, eq(orders.statusId, orderStatuses.id))
          .where(eq(orders.userId, client.userId))
          .orderBy(desc(orders.createdAt))
          .limit(5);

        // Получаем статистику по статусам заказов
        const orderStatusStats = await db
          .select({
            statusName: orderStatuses.name,
            statusColor: orderStatuses.color,
            count: count(orders.id),
          })
          .from(orders)
          .leftJoin(orderStatuses, eq(orders.statusId, orderStatuses.id))
          .where(eq(orders.userId, client.userId))
          .groupBy(orderStatuses.name, orderStatuses.color);

        return {
          id: client.userId,
          email: client.email,
          firstName: client.firstName,
          lastName: client.lastName,
          phone: client.phone,
          totalOrders: client.totalOrders,
          totalSpent: parseFloat(client.totalSpent || "0"),
          lastOrderDate: client.lastOrderDate,
          firstOrderDate: client.firstOrderDate,
          recentOrders,
          orderStatusStats,
        };
      })
    );

    return NextResponse.json({
      success: true,
      clients: clientsWithOrderDetails,
    });
  } catch (error) {
    console.error("Error fetching clients for manager:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Ошибка при получении списка клиентов" 
      },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getHandler, ["manager", "admin"]);
