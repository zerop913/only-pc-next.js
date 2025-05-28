import { NextRequest, NextResponse } from "next/server";
import { render } from "@react-email/render";
import OrderConfirmationEmail from "@/emails/OrderConfirmationEmail";
import { db } from "@/lib/db";
import {
  orders,
  orderItems,
  products,
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

// Типы для методов доставки и оплаты
interface DeliveryMethod {
  id: number;
  name: string;
}

interface PaymentMethod {
  id: number;
  name: string;
}

// Типы для элементов письма
interface EmailItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

// Тип пропсов для компонента письма
interface OrderConfirmationEmailProps {
  orderNumber: string;
  customerName: string;
  orderDate: string;
  items: EmailItem[];
  deliveryMethod: string;
  deliveryAddress: string;
  paymentMethod: string;
  subtotal: number;
  deliveryPrice: number;
  totalPrice: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      // Если ID заказа не указан, используем тестовые данные
      const html = await render(
        OrderConfirmationEmail({
          orderNumber: "00000",
          customerName: "Тестовый Пользователь",
          orderDate: new Date().toLocaleDateString("ru-RU"),
          items: [
            {
              id: 1,
              name: "Тестовый товар 1",
              price: 1999,
              quantity: 2,
              imageUrl: "https://example.com/image1.jpg",
            },
            {
              id: 2,
              name: "Тестовый товар 2",
              price: 3499,
              quantity: 1,
              imageUrl: "https://example.com/image2.jpg",
            },
          ],
          deliveryMethod: "Курьерская доставка",
          deliveryAddress: "123456, г. Москва, ул. Примерная, д. 1, кв. 1",
          paymentMethod: "Онлайн оплата",
          subtotal: 7497,
          deliveryPrice: 500,
          totalPrice: 7997,
        })
      );

      return new NextResponse(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Получаем данные заказа
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
      .where(eq(orders.id, parseInt(orderId)));

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

    // Проверяем наличие данных о доставке и оплате
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
    const items = await db
      .select({
        id: orderItems.id,
        quantity: orderItems.quantity,
        buildSnapshot: orderItems.buildSnapshot,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, parseInt(orderId)));

    console.log("Preview Order Items:", JSON.stringify(items, null, 2));

    // Преобразуем товары для письма
    const emailItems = items.map((item) => {
      console.log("Processing preview item:", JSON.stringify(item, null, 2));

      try {
        const snapshot = item.buildSnapshot;
        console.log("Raw preview snapshot:", JSON.stringify(snapshot, null, 2));

        // Проверяем, является ли snapshot строкой и пытаемся его распарсить
        const parsedSnapshot =
          typeof snapshot === "string" ? JSON.parse(snapshot) : snapshot;
        console.log(
          "Parsed preview snapshot:",
          JSON.stringify(parsedSnapshot, null, 2)
        );

        // Получаем данные сборки
        const buildData = parsedSnapshot?.buildData || parsedSnapshot;
        console.log("Preview build data:", JSON.stringify(buildData, null, 2));

        return {
          id: item.id,
          name: buildData?.name || "Сборка ПК",
          price:
            typeof buildData?.totalPrice === "string"
              ? parseFloat(buildData.totalPrice)
              : buildData?.totalPrice || 0,
          quantity: item.quantity || 1,
          imageUrl: undefined,
        };
      } catch (error) {
        console.error("Error processing preview item:", error);
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

    // Общая сумма и стоимость доставки
    const totalPrice = Number(orderData.totalPrice);
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
    const html = await render(
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

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error: any) {
    console.error("Ошибка предпросмотра письма:", error);
    return NextResponse.json(
      { error: `Ошибка: ${error.message || "Неизвестная ошибка"}` },
      { status: 500 }
    );
  }
}
