import { redirect } from "next/navigation";
import { OrderDetails } from "@/components/profile/OrderDetails";
import { getOrderByNumber } from "@/services/orderService";
import { cookies } from "next/headers";
import { verify } from "jsonwebtoken";
import { Metadata } from "next";

interface OrderPageProps {
  params: Promise<{ number: string }>;
}

export async function generateMetadata({
  params,
}: OrderPageProps): Promise<Metadata> {
  const { number } = await params;

  return {
    title: `Заказ #${number} - OnlyPC`,
    description: `Информация о заказе #${number} в магазине OnlyPC`,
  };
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
