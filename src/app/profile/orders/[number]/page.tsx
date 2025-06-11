import { redirect } from "next/navigation";
import { OrderDetails } from "@/components/profile/OrderDetails";
import { getOrderByNumber } from "@/services/orderService";
import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import { Metadata } from "next";
import { PAGE_TITLES } from "@/config/pageTitles";
import { getStatusDisplayName } from "@/utils/orderStatusUtils";

interface OrderPageProps {
  params: Promise<{ number: string }>;
}

export async function generateMetadata({
  params,
}: OrderPageProps): Promise<Metadata> {
  const { number } = await params;

  try {
    // Получаем данные заказа для метаданных
    const cookiesList = await cookies();
    const token = cookiesList.get("token")?.value;

    if (!token) {
      return {
        title: PAGE_TITLES.ORDER_DETAIL(number),
        description: `Информация о заказе #${number} в магазине OnlyPC`,
      };
    }

    const decoded = verify(
      token,
      process.env.JWT_SECRET || "default_secret"
    ) as { userId: number };

    const order = await getOrderByNumber(number);

    if (!order || order.userId !== decoded.userId) {
      return {
        title: PAGE_TITLES.ORDER_DETAIL(number),
        description: `Информация о заказе #${number} в магазине OnlyPC`,
      };
    }

    // Формируем детальное описание на основе данных заказа
    const itemCount = order.items?.length || 0;
    
    // Получаем человекочитаемое название статуса
    const statusText = await getStatusDisplayName(order.statusId);

    const description = `Заказ #${number} (${statusText}) на сумму ${order.totalPrice}₽. ${itemCount} товар${itemCount === 1 ? "" : itemCount < 5 ? "а" : "ов"} в заказе. Дата: ${new Date(order.createdAt).toLocaleDateString("ru-RU")}.`;

    return {
      title: PAGE_TITLES.ORDER_DETAIL(number),
      description,
      keywords: `заказ ${number}, OnlyPC, компьютерные комплектующие, ${statusText}`,
      openGraph: {
        title: PAGE_TITLES.ORDER_DETAIL(number),
        description,
        type: "website",
        locale: "ru_RU",
      },
      twitter: {
        card: "summary",
        title: PAGE_TITLES.ORDER_DETAIL(number),
        description,
      },
    };
  } catch (error) {
    console.error("Error generating metadata for order:", error);
    return {
      title: PAGE_TITLES.ORDER_DETAIL(number),
      description: `Информация о заказе #${number} в магазине OnlyPC`,
    };
  }
}

async function getOrderData(orderNumber: string) {
  const cookiesList = await cookies();
  const token = cookiesList.get("token")?.value;

  if (!token) {
    return redirect("/login");
  }

  try {
    const decoded = verify(
      token,
      process.env.JWT_SECRET || "default_secret"
    ) as { userId: number };
    const userId = decoded.userId;

    const order = await getOrderByNumber(orderNumber);
    if (!order || order.userId !== userId) {
      return redirect("/profile/orders");
    }

    return { order, orderNumber };
  } catch (error) {
    console.error("Error in getOrderData:", error);
    return redirect("/login");
  }
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { number } = await params;
  const data = await getOrderData(number);

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
      <OrderDetails order={data.order} />
    </div>
  );
}
