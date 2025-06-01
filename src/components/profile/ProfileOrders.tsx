"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/utils/formatters";
import { Loader2, ArrowRight } from "lucide-react";
import { fetchApi } from "../../utils/apiUtils";

interface Order {
  id: number;
  orderNumber: string;
  statusId: number;
  totalPrice: string;
  createdAt: string;
  status: {
    name: string;
    color: string;
  };
  items: Array<{
    buildSnapshot: {
      name: string;
    };
  }>;
}

export default function ProfileOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const response = await fetchApi("/api/profile/orders");
        if (!response.ok) {
          throw new Error("Не удалось загрузить заказы");
        }
        const { data } = await response.json();
        setOrders(data.orders);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Произошла ошибка");
        console.error("Error fetching orders:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20"></div>
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20"></div>
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20"></div>
        <div className="text-center py-8">
          <p className="text-secondary-light">У вас пока нет заказов</p>
          <Link
            href="/catalog"
            className="inline-flex items-center mt-4 text-blue-400 hover:text-blue-300 transition-colors"
          >
            Перейти в каталог
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-6 shadow-md relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20"></div>
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white">История заказов</h2>
        <p className="text-secondary-light mt-1">
          Просмотр и отслеживание ваших заказов
        </p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/profile/orders/${order.orderNumber}`}
            className="block"
          >
            <div className="bg-gradient-from/5 hover:bg-gradient-from/10 border border-primary-border/50 hover:border-blue-500/30 rounded-lg p-4 transition-all duration-300 group">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                    Заказ #{order.orderNumber}
                  </h3>
                  <p className="text-sm text-secondary-light">
                    {order.items[0]?.buildSnapshot.name || "Сборка ПК"}
                  </p>
                </div>
                <div className="space-y-2 text-right">
                  <p className="font-semibold text-white">
                    {formatPrice(order.totalPrice)}
                  </p>
                  <p className="text-sm text-secondary-light">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span
                  className="px-3 py-1 text-xs rounded-full font-medium"
                  style={{
                    backgroundColor: `${order.status.color}15`,
                    color: order.status.color,
                  }}
                >
                  {order.status.name}
                </span>
                <ArrowRight className="w-5 h-5 text-secondary-light group-hover:text-blue-400 transform group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
