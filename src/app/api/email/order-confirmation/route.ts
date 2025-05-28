import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { render } from "@react-email/render";
import OrderConfirmationEmail from "@/emails/OrderConfirmationEmail";
import { db } from "@/lib/db";
import {
  orders,
  orderItems,
  users,
  userProfiles,
  deliveryAddresses,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm/sql";
import {
  getDeliveryMethodById,
  getPaymentMethodById,
} from "@/services/orderService";

// Инициализация Resend API
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "ID заказа не указан" },
        { status: 400 }
      );
    }

    // Получаем данные заказа из БД с помощью типизированного запроса
    const [orderData] = await db
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
        // Добавляем связанные данные
        userEmail: users.email,
        userFirstName: userProfiles.firstName,
        userLastName: userProfiles.lastName,
        // Адрес доставки
        deliveryAddressCity: deliveryAddresses.city,
        deliveryAddressStreet: deliveryAddresses.streetAddress,
        deliveryAddressPostal: deliveryAddresses.postalCode,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
      .leftJoin(
        deliveryAddresses,
        eq(orders.deliveryAddressId, deliveryAddresses.id)
      )
      .where(eq(orders.id, orderId));

    if (!orderData) {
      console.error(`Заказ не найден: ID=${orderId}`);
      return NextResponse.json({ error: "Заказ не найден" }, { status: 404 });
    }

    // Получаем метод доставки
    let deliveryMethod = null;
    if (orderData.deliveryMethodId) {
      deliveryMethod = await getDeliveryMethodById(orderData.deliveryMethodId);
      if (!deliveryMethod) {
        console.error(
          `Метод доставки не найден: ID=${orderData.deliveryMethodId}`
        );
      }
    } else {
      console.error(`ID метода доставки не указан в заказе: ID=${orderId}`);
    }

    // Получаем метод оплаты
    let paymentMethod = null;
    if (orderData.paymentMethodId) {
      paymentMethod = await getPaymentMethodById(orderData.paymentMethodId);
      if (!paymentMethod) {
        console.error(
          `Метод оплаты не найден: ID=${orderData.paymentMethodId}`
        );
      }
    } else {
      console.error(`ID метода оплаты не указан в заказе: ID=${orderId}`);
    }

    if (!deliveryMethod || !paymentMethod) {
      return NextResponse.json(
        { error: "Данные о доставке или оплате не найдены" },
        { status: 404 }
      );
    }

    // Формируем адрес доставки в строку
    const fullAddress = orderData.deliveryAddressCity
      ? `${orderData.deliveryAddressPostal || ""}, ${orderData.deliveryAddressCity}, ${orderData.deliveryAddressStreet}`
      : "Информация о доставке отсутствует";

    // Получаем элементы заказа
    const orderItemsData = await db
      .select({
        id: orderItems.id,
        quantity: orderItems.quantity,
        buildSnapshot: orderItems.buildSnapshot,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    console.log('Order Items Data:', JSON.stringify(orderItemsData, null, 2));

    // Преобразуем товары для письма
    const emailItems = orderItemsData.map((item) => {
      console.log('Processing item:', JSON.stringify(item, null, 2));
      
      try {
        const snapshot = item.buildSnapshot;
        console.log('Raw snapshot:', JSON.stringify(snapshot, null, 2));

        // Проверяем, является ли snapshot строкой и пытаемся его распарсить
        const parsedSnapshot = typeof snapshot === 'string' ? JSON.parse(snapshot) : snapshot;
        console.log('Parsed snapshot:', JSON.stringify(parsedSnapshot, null, 2));

        // Получаем данные сборки
        const buildData = parsedSnapshot?.buildData || parsedSnapshot;
        console.log('Build data:', JSON.stringify(buildData, null, 2));

        return {
          id: item.id,
          name: buildData?.name || "Сборка ПК",
          price: typeof buildData?.totalPrice === 'string' 
            ? parseFloat(buildData.totalPrice) 
            : (buildData?.totalPrice || 0),
          quantity: item.quantity || 1,
          imageUrl: undefined,
        };
      } catch (error) {
        console.error('Error processing item:', error);
        return {
          id: item.id,
          name: "Сборка ПК",
          price: 0,
          quantity: item.quantity || 1,
          imageUrl: undefined,
        };
      }
    });

    if (emailItems.length === 0) {
      console.warn(`Заказ ${orderId} не содержит товаров`);
    }

    // Подсчет подытога (без доставки)
    const subtotal = emailItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Общая сумма уже есть в заказе
    const totalPrice = Number(orderData.totalPrice);

    // Стоимость доставки
    const deliveryPrice = Number(orderData.deliveryPrice);

    // Получаем имя клиента
    const customerName = orderData.userFirstName
      ? `${orderData.userLastName} ${orderData.userFirstName}`
      : "Клиент";

    // Форматируем дату
    const orderDate = orderData.createdAt
      ? new Date(orderData.createdAt).toLocaleDateString("ru-RU")
      : new Date().toLocaleDateString("ru-RU");

    // Создаем письмо с подтверждением заказа
    const emailHtml = await render(
      OrderConfirmationEmail({
        orderNumber: orderData.orderNumber,
        customerName,
        orderDate,
        items: emailItems,
        deliveryMethod: deliveryMethod.name,
        deliveryAddress: fullAddress,
        paymentMethod: paymentMethod.name,
        subtotal,
        deliveryPrice,
        totalPrice,
      })
    );

    // Получаем email пользователя
    const userEmail = orderData.userEmail;

    if (!userEmail) {
      return NextResponse.json(
        { error: "Email пользователя не найден" },
        { status: 400 }
      );
    }

    // Отправляем письмо
    const { data, error } = await resend.emails.send({
      from: "OnlyPC <noreply@only-pc.ru>",
      replyTo: process.env.MAIL_REPLY_TO || "contact@only-pc.ru",
      to: userEmail,
      subject: `Заказ #${orderData.orderNumber} подтвержден - OnlyPC`,
      html: await emailHtml,
    });

    if (error) {
      console.error("Ошибка отправки письма:", error);
      return NextResponse.json(
        { error: `Ошибка отправки письма: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Ошибка отправки письма с подтверждением заказа:", error);
    return NextResponse.json(
      { error: `Ошибка: ${error.message || "Неизвестная ошибка"}` },
      { status: 500 }
    );
  }
}
