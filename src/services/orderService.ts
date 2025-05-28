import { db } from "@/lib/db";
import {
  orders,
  orderItems,
  orderHistory,
  orderStatuses,
  deliveryMethods,
  paymentMethods,
  deliveryAddresses,
  pcBuilds,
  users,
  userProfiles,
} from "@/lib/db/schema";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { NewOrder, NewOrderItem, NewOrderHistory } from "@/lib/db/schema";
import {
  CreateOrderRequest,
  OrderWithRelations,
  UpdateOrderStatusRequest,
  OrdersStatistics,
  DeliveryAddress,
  DeliveryMethod,
  PaymentMethod,
} from "@/types/order";

// Функция для генерации уникального номера заказа (12 символов)
export function generateOrderNumber(): string {
  // Создаем UUID v4 и используем его первые 8 символов
  const uuid = uuidv4().replace(/-/g, "").substring(0, 8).toUpperCase();

  // Добавляем текущую дату в формате ГГММ
  const date = new Date();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear().toString().slice(-2);

  return `${year}${month}${uuid}`;
}

/**
 * Создание нового заказа
 */
export async function createOrder(
  userId: number,
  orderData: CreateOrderRequest
): Promise<{ order: OrderWithRelations; success: boolean; message?: string }> {
  try {
    // Проверка наличия товаров в корзине
    if (!orderData.cartItems || orderData.cartItems.length === 0) {
      return {
        order: {} as OrderWithRelations,
        success: false,
        message: "Корзина пуста",
      };
    }

    // Получаем метод доставки для подсчета общей стоимости
    const deliveryMethod = await db.query.deliveryMethods.findFirst({
      where: eq(deliveryMethods.id, orderData.deliveryMethodId),
    });

    if (!deliveryMethod) {
      return {
        order: {} as OrderWithRelations,
        success: false,
        message: "Метод доставки не найден",
      };
    }

    const deliveryPrice = deliveryMethod.price;
    // Преобразуем для расчетов
    const deliveryPriceNumber = parseFloat(deliveryPrice);

    // Считаем общую стоимость всех товаров в корзине
    const itemsTotal = orderData.cartItems.reduce((total, item) => {
      // Базовая цена за единицу товара
      const basePrice = item.price / (item.quantity || 1);
      // Умножаем на количество
      return total + basePrice * (item.quantity || 1);
    }, 0);

    // Считаем итоговую сумму (товары + доставка)
    const totalPrice = (itemsTotal + deliveryPriceNumber).toString();

    const now = new Date();
    const moscowTime = new Date(now.getTime() + 3 * 60 * 60 * 1000)
      .toISOString()
      .replace("Z", "+03:00");

    // Создаем новый заказ
    const newOrder: NewOrder = {
      orderNumber: generateOrderNumber(),
      userId,
      statusId: orderData.statusId || 1,
      totalPrice: totalPrice,
      deliveryMethodId: orderData.deliveryMethodId,
      paymentMethodId: orderData.paymentMethodId,
      deliveryAddressId: orderData.deliveryAddressId,
      deliveryPrice: deliveryPrice,
      comment: orderData.comment || null,
      createdAt: moscowTime,
      updatedAt: moscowTime,
    };

    // Вставляем заказ в БД
    const [insertedOrder] = await db
      .insert(orders)
      .values(newOrder)
      .returning();

    // Создаем элементы заказа для каждого товара в корзине
    const orderItemsToInsert: NewOrderItem[] = [];

    // Обрабатываем каждый элемент корзины
    for (const item of orderData.cartItems) {
      const quantity = item.quantity || 1;
      const basePrice = item.price / quantity; // Цена за единицу
      const itemTotalPrice = basePrice * quantity; // Общая цена для этого элемента

      // Если это сборка и у нас есть buildId, получаем данные из БД
      let buildData = null;
      if (item.type === "build" && orderData.buildId) {
        buildData = await db.query.pcBuilds.findFirst({
          where: eq(pcBuilds.id, orderData.buildId),
        });
      }

      orderItemsToInsert.push({
        orderId: insertedOrder.id,
        buildId: buildData?.id || null,
        quantity: quantity,
        buildSnapshot: buildData
          ? {
              id: buildData.id,
              name: buildData.name,
              components: buildData.components,
              totalPrice: basePrice.toString(), // Сохраняем базовую цену за единицу
            }
          : {
              id: typeof item.id === "number" ? item.id : 0,
              name: item.name,
              totalPrice: basePrice.toString(), // Сохраняем базовую цену за единицу
              components: item.components || null,
              type: item.type || "Товар",
              image: item.image || null,
            },
      });
    }

    // Вставляем все элементы заказа
    if (orderItemsToInsert.length > 0) {
      await db.insert(orderItems).values(orderItemsToInsert);
    }

    // Создаем первую запись в истории заказа
    const historyRecord: NewOrderHistory = {
      orderId: insertedOrder.id,
      statusId: orderData.statusId || 1,
      comment: "Заказ создан",
      userId,
    };

    // Вставляем запись в историю заказов
    await db.insert(orderHistory).values(historyRecord);

    // Получаем полный заказ со всеми связями
    const fullOrder = await getOrderById(insertedOrder.id);

    return {
      order: fullOrder,
      success: true,
      message: "Заказ успешно создан",
    };
  } catch (error) {
    console.error("Ошибка при создании заказа:", error);
    return {
      order: {} as OrderWithRelations,
      success: false,
      message: "Произошла ошибка при создании заказа",
    };
  }
}

/**
 * Получение заказа по ID
 */
export async function getOrderById(
  orderId: number
): Promise<OrderWithRelations> {
  const orderData = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      userId: orders.userId,
      statusId: orders.statusId,
      totalPrice: orders.totalPrice,
      deliveryMethodId: orders.deliveryMethodId,
      paymentMethodId: orders.paymentMethodId,
      deliveryAddressId: orders.deliveryAddressId,
      deliveryPrice: orders.deliveryPrice,
      comment: orders.comment,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      // Статус
      statusName: orderStatuses.name,
      statusDescription: orderStatuses.description,
      statusColor: orderStatuses.color,
      // Пользователь
      userEmail: users.email,
      userFirstName: userProfiles.firstName,
      userLastName: userProfiles.lastName,
      // Метод доставки
      deliveryMethodName: deliveryMethods.name,
      deliveryMethodDescription: deliveryMethods.description,
      deliveryMethodEstimatedDays: deliveryMethods.estimatedDays,
      // Метод оплаты
      paymentMethodName: paymentMethods.name,
      paymentMethodDescription: paymentMethods.description,
    })
    .from(orders)
    .leftJoin(orderStatuses, eq(orders.statusId, orderStatuses.id))
    .leftJoin(users, eq(orders.userId, users.id))
    .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
    .leftJoin(deliveryMethods, eq(orders.deliveryMethodId, deliveryMethods.id))
    .leftJoin(paymentMethods, eq(orders.paymentMethodId, paymentMethods.id))
    .where(eq(orders.id, orderId))
    .limit(1);

  // Получаем элементы заказа
  const orderItemsData = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId));

  // Получаем историю заказа
  const orderHistoryData = await db
    .select({
      id: orderHistory.id,
      orderId: orderHistory.orderId,
      statusId: orderHistory.statusId,
      comment: orderHistory.comment,
      userId: orderHistory.userId,
      createdAt: orderHistory.createdAt,
      statusName: orderStatuses.name,
      statusColor: orderStatuses.color,
      userEmail: users.email,
      userFirstName: userProfiles.firstName,
      userLastName: userProfiles.lastName,
    })
    .from(orderHistory)
    .leftJoin(orderStatuses, eq(orderHistory.statusId, orderStatuses.id))
    .leftJoin(users, eq(orderHistory.userId, users.id))
    .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
    .where(eq(orderHistory.orderId, orderId))
    .orderBy(desc(orderHistory.createdAt));

  // Получаем адрес доставки
  const addressData = orderData[0]?.deliveryAddressId
    ? await db
        .select()
        .from(deliveryAddresses)
        .where(
          eq(deliveryAddresses.id, orderData[0].deliveryAddressId as number)
        )
        .limit(1)
    : []; // Формируем полный объект заказа
  return {
    ...orderData[0],
    status: orderData[0]
      ? {
          id: orderData[0].statusId,
          name: orderData[0].statusName || "",
          description: orderData[0].statusDescription,
          color: orderData[0].statusColor,
        }
      : undefined,
    user: orderData[0]
      ? {
          id: orderData[0].userId,
          email: orderData[0].userEmail || "",
          profile: {
            firstName: orderData[0].userFirstName,
            lastName: orderData[0].userLastName,
          },
        }
      : undefined,
    deliveryMethod: orderData[0]?.deliveryMethodId
      ? {
          id: orderData[0].deliveryMethodId,
          name: orderData[0].deliveryMethodName || "",
          description: orderData[0].deliveryMethodDescription,
          price: orderData[0].deliveryPrice?.toString() || "0",
          estimatedDays: orderData[0].deliveryMethodEstimatedDays,
          isActive: true,
        }
      : undefined,
    paymentMethod: orderData[0]?.paymentMethodId
      ? {
          id: orderData[0].paymentMethodId,
          name: orderData[0].paymentMethodName || "",
          description: orderData[0].paymentMethodDescription,
          isActive: true,
        }
      : undefined,
    deliveryAddress: addressData[0] as DeliveryAddress | undefined,
    items: orderItemsData.map((item) => ({
      ...item,
      buildSnapshot: item.buildSnapshot as any,
    })),
    history: orderHistoryData.map((history) => ({
      id: history.id,
      orderId: history.orderId,
      statusId: history.statusId,
      comment: history.comment,
      userId: history.userId,
      createdAt:
        history.createdAt ||
        new Date().toLocaleString("en-US", { timeZone: "Europe/Moscow" }),
      status: {
        id: history.statusId,
        name: history.statusName || "",
        description: null,
        color: history.statusColor,
      },
      user: history.userId
        ? {
            id: history.userId,
            email: history.userEmail || "",
            profile: {
              firstName: history.userFirstName,
              lastName: history.userLastName,
            },
          }
        : undefined,
    })),
  } as unknown as OrderWithRelations;
}

/**
 * Упрощенная версия получения заказа по ID (используется внутренне)
 */
async function getSimpleOrderById(orderId: number) {
  try {
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      columns: {
        id: true,
        orderNumber: true,
        userId: true,
        statusId: true,
        totalPrice: true,
        deliveryMethodId: true,
        paymentMethodId: true,
        deliveryAddressId: true,
        deliveryPrice: true,
        comment: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return order;
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    return null;
  }
}

/**
 * Получение заказов пользователя
 */
export async function getUserOrders(
  userId: number
): Promise<OrderWithRelations[]> {
  const ordersData = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      userId: orders.userId,
      statusId: orders.statusId,
      totalPrice: orders.totalPrice,
      deliveryPrice: orders.deliveryPrice,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      // Статус
      statusName: orderStatuses.name,
      statusColor: orderStatuses.color,
    })
    .from(orders)
    .leftJoin(orderStatuses, eq(orders.statusId, orderStatuses.id))
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt));

  // Для каждого заказа получаем первый элемент заказа
  const result = await Promise.all(
    ordersData.map(async (order) => {
      const [item] = await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, order.id))
        .limit(1);
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
        statusId: order.statusId,
        totalPrice: order.totalPrice,
        deliveryPrice: order.deliveryPrice,
        createdAt:
          order.createdAt ||
          new Date().toLocaleString("en-US", { timeZone: "Europe/Moscow" }),
        updatedAt:
          order.updatedAt ||
          new Date().toLocaleString("en-US", { timeZone: "Europe/Moscow" }),
        // Добавляем null значения для отсутствующих полей
        deliveryMethodId: null,
        paymentMethodId: null,
        deliveryAddressId: null,
        comment: null,
        status: {
          id: order.statusId,
          name: order.statusName || "",
          description: null,
          color: order.statusColor,
        },
        items: item ? [item] : [],
      };
    })
  );

  return result as unknown as OrderWithRelations[];
}

/**
 * Обновление статуса заказа
 */
export async function updateOrderStatus(
  orderId: number,
  userId: number,
  updateData: UpdateOrderStatusRequest
): Promise<{ success: boolean; message?: string }> {
  try {
    // Проверяем существование заказа
    const existingOrder = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!existingOrder) {
      return { success: false, message: "Заказ не найден" };
    }

    // Проверяем существование статуса
    const status = await db.query.orderStatuses.findFirst({
      where: eq(orderStatuses.id, updateData.statusId),
    });
    if (!status) {
      return { success: false, message: "Статус не найден" };
    }

    // Обновляем статус заказа
    await db
      .update(orders)
      .set({
        statusId: updateData.statusId,
        updatedAt: new Date().toLocaleString("en-US", {
          timeZone: "Europe/Moscow",
        }),
      })
      .where(eq(orders.id, orderId));

    // Добавляем запись в историю
    const historyRecord: NewOrderHistory = {
      orderId,
      statusId: updateData.statusId,
      comment: updateData.comment || `Статус изменен на ${status.name}`,
      userId,
    };

    await db.insert(orderHistory).values(historyRecord);

    return { success: true, message: "Статус заказа успешно обновлен" };
  } catch (error) {
    console.error("Ошибка при обновлении статуса заказа:", error);
    return {
      success: false,
      message: "Произошла ошибка при обновлении статуса заказа",
    };
  }
}

/**
 * Получение всех заказов (для админа/менеджера)
 */
export async function getAllOrders(
  page: number = 1,
  limit: number = 10,
  statusFilter?: number[]
): Promise<{ orders: OrderWithRelations[]; total: number }> {
  try {
    const offset = (page - 1) * limit;

    // Базовый запрос для подсчета общего количества
    const baseQuery = db.select().from(orders);

    // Добавляем фильтр по статусу, если он указан
    const whereCondition =
      statusFilter && statusFilter.length > 0
        ? inArray(orders.statusId, statusFilter)
        : undefined;

    // Выполняем запрос для подсчета общего количества с учетом фильтра
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(whereCondition);

    const count = countResult[0].count; // Базовый запрос для получения заказов
    const ordersQuery = db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        userId: orders.userId,
        statusId: orders.statusId,
        totalPrice: orders.totalPrice,
        deliveryPrice: orders.deliveryPrice,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
        // Статус
        statusName: orderStatuses.name,
        statusColor: orderStatuses.color,
        // Пользователь
        userEmail: users.email,
        userFirstName: userProfiles.firstName,
        userLastName: userProfiles.lastName,
      })
      .from(orders)
      .leftJoin(orderStatuses, eq(orders.statusId, orderStatuses.id))
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId));

    // Добавляем фильтр по статусу, если он указан
    const ordersData = await (statusFilter && statusFilter.length > 0
      ? ordersQuery
          .where(inArray(orders.statusId, statusFilter))
          .orderBy(desc(orders.createdAt))
          .limit(limit)
          .offset(offset)
      : ordersQuery
          .orderBy(desc(orders.createdAt))
          .limit(limit)
          .offset(offset));

    // Для каждого заказа получаем первый элемент заказа
    const result = await Promise.all(
      ordersData.map(async (order) => {
        const [item] = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.id))
          .limit(1);
        return {
          id: order.id,
          orderNumber: order.orderNumber,
          userId: order.userId,
          statusId: order.statusId,
          totalPrice: order.totalPrice,
          deliveryPrice: order.deliveryPrice,
          // Добавляем недостающие поля
          deliveryMethodId: null,
          paymentMethodId: null,
          deliveryAddressId: null,
          comment: null,
          createdAt:
            order.createdAt ||
            new Date().toLocaleString("en-US", { timeZone: "Europe/Moscow" }),
          updatedAt:
            order.updatedAt ||
            new Date().toLocaleString("en-US", { timeZone: "Europe/Moscow" }),
          status: {
            id: order.statusId,
            name: order.statusName || "",
            description: null,
            color: order.statusColor,
          },
          user: {
            id: order.userId,
            email: order.userEmail || "",
            profile: {
              firstName: order.userFirstName,
              lastName: order.userLastName,
            },
            // Добавляем недостающие поля
            roleId: 1, // Предполагаем, что это обычный пользователь
            isActive: true,
            createdAt: new Date().toLocaleString("en-US", {
              timeZone: "Europe/Moscow",
            }),
          },
          items: item ? [item] : [],
        };
      })
    );
    return {
      orders: result as unknown as OrderWithRelations[],
      total: count,
    };
  } catch (error) {
    console.error("Ошибка при получении всех заказов:", error);
    return { orders: [], total: 0 };
  }
}

/**
 * Получение статистики по заказам (для админа/менеджера)
 */
export async function getOrdersStatistics(): Promise<OrdersStatistics> {
  try {
    // Общее количество заказов
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(orders);

    // Количество новых заказов (статус "Новый", id=1)
    const [{ new_orders }] = await db
      .select({ new_orders: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.statusId, 1));

    // Количество заказов в обработке (статусы "Подтвержден" и "Оплачен" и "В сборке", id=2,3,4)
    const [{ processing }] = await db
      .select({ processing: sql<number>`count(*)` })
      .from(orders)
      .where(inArray(orders.statusId, [2, 3, 4]));

    // Количество завершенных заказов (статусы "Отправлен" и "Доставлен", id=5,6)
    const [{ completed }] = await db
      .select({ completed: sql<number>`count(*)` })
      .from(orders)
      .where(inArray(orders.statusId, [5, 6]));

    // Количество отмененных заказов (статус "Отменен", id=7)
    const [{ cancelled }] = await db
      .select({ cancelled: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.statusId, 7));

    // Общая выручка (только для завершенных заказов)
    const [{ revenue }] = await db
      .select({
        revenue: sql<string>`sum(cast(total_price as decimal(10,2)))`,
      })
      .from(orders)
      .where(inArray(orders.statusId, [5, 6]));

    return {
      total,
      new: new_orders,
      processing,
      completed,
      cancelled,
      totalRevenue: revenue || "0",
    };
  } catch (error) {
    console.error("Ошибка при получении статистики заказов:", error);
    return {
      total: 0,
      new: 0,
      processing: 0,
      completed: 0,
      cancelled: 0,
      totalRevenue: "0",
    };
  }
}

/**
 * Получение методов доставки
 */
export async function getDeliveryMethods() {
  return db
    .select()
    .from(deliveryMethods)
    .where(eq(deliveryMethods.isActive, true));
}

/**
 * Получение всех активных методов доставки
 */
export async function getAllDeliveryMethods(): Promise<DeliveryMethod[]> {
  try {
    const deliveryMethodsData = await db
      .select()
      .from(deliveryMethods)
      .where(eq(deliveryMethods.isActive, true));

    return deliveryMethodsData.map((method) => ({
      id: method.id,
      name: method.name,
      description: method.description,
      price: method.price.toString(),
      estimatedDays: method.estimatedDays,
      isActive: method.isActive === null ? true : method.isActive,
    }));
  } catch (error) {
    console.error("Ошибка при получении методов доставки:", error);
    return [];
  }
}

/**
 * Получение всех активных методов оплаты
 */
export async function getAllPaymentMethods(): Promise<PaymentMethod[]> {
  try {
    const paymentMethodsData = await db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.isActive, true));

    return paymentMethodsData.map((method) => ({
      id: method.id,
      name: method.name,
      description: method.description,
      isActive: method.isActive === null ? true : method.isActive,
    }));
  } catch (error) {
    console.error("Ошибка при получении методов оплаты:", error);
    return [];
  }
}

/**
 * Получение методов оплаты
 */
export async function getPaymentMethods() {
  return db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.isActive, true));
}

/**
 * Получение адресов доставки пользователя
 */
export async function getUserAddresses(userId: number) {
  return db
    .select()
    .from(deliveryAddresses)
    .where(eq(deliveryAddresses.userId, userId))
    .orderBy(desc(deliveryAddresses.isDefault));
}

/**
 * Получение адресов доставки пользователя
 */
export async function getUserDeliveryAddresses(
  userId: number
): Promise<DeliveryAddress[]> {
  try {
    const addressesData = await db
      .select()
      .from(deliveryAddresses)
      .where(eq(deliveryAddresses.userId, userId));

    return addressesData.map((address) => ({
      id: address.id,
      userId: address.userId,
      recipientName: address.recipientName,
      phoneNumber: address.phoneNumber,
      country: address.country,
      city: address.city,
      postalCode: address.postalCode,
      streetAddress: address.streetAddress,
      deliveryMethodId: address.deliveryMethodId,
      isDefault: address.isDefault === null ? false : address.isDefault,
    }));
  } catch (error) {
    console.error("Ошибка при получении адресов доставки пользователя:", error);
    return [];
  }
}

/**
 * Создание нового адреса доставки
 */
export async function createDeliveryAddress(
  userId: number,
  addressData: Omit<DeliveryAddress, "id">
): Promise<DeliveryAddress | null> {
  try {
    // Если новый адрес помечен как адрес по умолчанию, сбрасываем этот флаг у других адресов
    if (addressData.isDefault) {
      await db
        .update(deliveryAddresses)
        .set({ isDefault: false })
        .where(eq(deliveryAddresses.userId, userId));
    }

    // Если это первый адрес пользователя, делаем его по умолчанию
    const existingAddresses = await db
      .select({ count: sql<number>`count(*)` })
      .from(deliveryAddresses)
      .where(eq(deliveryAddresses.userId, userId));

    const isFirstAddress = existingAddresses[0].count === 0;
    const isDefault = isFirstAddress ? true : addressData.isDefault; // Создаем новый адрес
    const [newAddress] = await db
      .insert(deliveryAddresses)
      .values({
        userId,
        recipientName: addressData.recipientName,
        phoneNumber: addressData.phoneNumber,
        country: addressData.country,
        city: addressData.city,
        postalCode: addressData.postalCode,
        streetAddress: addressData.streetAddress,
        deliveryMethodId: addressData.deliveryMethodId,
        isDefault,
      })
      .returning();

    return newAddress
      ? {
          id: newAddress.id,
          userId: newAddress.userId,
          recipientName: newAddress.recipientName,
          phoneNumber: newAddress.phoneNumber,
          country: newAddress.country,
          city: newAddress.city,
          postalCode: newAddress.postalCode,
          streetAddress: newAddress.streetAddress,
          deliveryMethodId: newAddress.deliveryMethodId,
          isDefault:
            newAddress.isDefault === null ? false : newAddress.isDefault,
        }
      : null;
  } catch (error) {
    console.error("Ошибка при создании адреса доставки:", error);
    return null;
  }
}

/**
 * Обновление адреса доставки
 */
export async function updateDeliveryAddress(
  addressId: number,
  userId: number,
  addressData: Partial<DeliveryAddress>
): Promise<{ success: boolean; message?: string }> {
  try {
    // Проверяем существование адреса и принадлежность пользователю
    const existingAddress = await db
      .select()
      .from(deliveryAddresses)
      .where(
        and(
          eq(deliveryAddresses.id, addressId),
          eq(deliveryAddresses.userId, userId)
        )
      )
      .limit(1);

    if (existingAddress.length === 0) {
      return { success: false, message: "Адрес не найден" };
    }

    // Если этот адрес устанавливается по умолчанию, сбрасываем флаг у других адресов
    if (addressData.isDefault) {
      await db
        .update(deliveryAddresses)
        .set({ isDefault: false })
        .where(eq(deliveryAddresses.userId, userId));
    } // Обновляем адрес
    await db
      .update(deliveryAddresses)
      .set({
        recipientName: addressData.recipientName,
        phoneNumber: addressData.phoneNumber,
        country: addressData.country,
        city: addressData.city,
        postalCode: addressData.postalCode,
        streetAddress: addressData.streetAddress,
        deliveryMethodId: addressData.deliveryMethodId,
        isDefault: addressData.isDefault,
        updatedAt: new Date(),
      })
      .where(eq(deliveryAddresses.id, addressId));

    return { success: true, message: "Адрес успешно обновлен" };
  } catch (error) {
    console.error("Ошибка при обновлении адреса:", error);
    return {
      success: false,
      message: "Произошла ошибка при обновлении адреса",
    };
  }
}

/**
 * Удаление адреса доставки
 */
export async function deleteDeliveryAddress(
  addressId: number,
  userId: number
): Promise<{ success: boolean; message?: string }> {
  try {
    // Проверяем существование адреса и принадлежность пользователю
    const existingAddress = await db
      .select()
      .from(deliveryAddresses)
      .where(
        and(
          eq(deliveryAddresses.id, addressId),
          eq(deliveryAddresses.userId, userId)
        )
      )
      .limit(1);

    if (existingAddress.length === 0) {
      return { success: false, message: "Адрес не найден" };
    }

    // Удаляем адрес
    await db
      .delete(deliveryAddresses)
      .where(eq(deliveryAddresses.id, addressId));

    // Если удаленный адрес был по умолчанию, устанавливаем другой адрес по умолчанию
    if (existingAddress[0].isDefault) {
      const remainingAddresses = await db
        .select()
        .from(deliveryAddresses)
        .where(eq(deliveryAddresses.userId, userId))
        .limit(1);

      if (remainingAddresses.length > 0) {
        await db
          .update(deliveryAddresses)
          .set({ isDefault: true })
          .where(eq(deliveryAddresses.id, remainingAddresses[0].id));
      }
    }

    return { success: true, message: "Адрес успешно удален" };
  } catch (error) {
    console.error("Ошибка при удалении адреса:", error);
    return {
      success: false,
      message: "Произошла ошибка при удалении адреса",
    };
  }
}

/**
 * Получение всех статусов заказов
 */
export async function getOrderStatuses() {
  return db.select().from(orderStatuses);
}

/**
 * Получение заказа по номеру
 */
export async function getOrderByNumber(
  orderNumber: string
): Promise<OrderWithRelations | null> {
  try {
    // Получаем ID заказа по номеру
    const orderData = await db
      .select({
        id: orders.id,
      })
      .from(orders)
      .where(eq(orders.orderNumber, orderNumber.toUpperCase()))
      .limit(1);

    if (orderData.length === 0) {
      return null;
    }

    // Получаем полную информацию о заказе по ID
    const order = await getOrderById(orderData[0].id);
    return order;
  } catch (error) {
    console.error("Error fetching order by number:", error);
    return null;
  }
}

/**
 * Получение метода доставки по ID
 */
export async function getDeliveryMethodById(id: number) {
  try {
    const method = await db.query.deliveryMethods.findFirst({
      where: eq(deliveryMethods.id, id),
    });
    return method;
  } catch (error) {
    console.error("Ошибка получения метода доставки:", error);
    return null;
  }
}

/**
 * Получение метода оплаты по ID
 */
export async function getPaymentMethodById(id: number) {
  try {
    const method = await db.query.paymentMethods.findFirst({
      where: eq(paymentMethods.id, id),
    });
    return method;
  } catch (error) {
    console.error("Ошибка получения метода оплаты:", error);
    return null;
  }
}
