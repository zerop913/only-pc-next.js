"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  Package,
  CheckCircle,
  Truck,
  AlertCircle,
  Search,
  ChevronDown,
} from "lucide-react";
import Button from "@/components/common/Button/Button";

interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  status: string;
  total: number;
  items: number;
  date: string;
}

export default function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/manager/orders", {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Ошибка при получении заказов");
        }

        const data = await response.json();
        setOrders(data.orders);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError(err instanceof Error ? err.message : "Произошла ошибка");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case "processing":
        return <Package className="w-4 h-4 text-blue-400" />;
      case "shipped":
        return <Truck className="w-4 h-4 text-green-400" />;
      case "delivered":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "cancelled":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Ожидает обработки";
      case "processing":
        return "В обработке";
      case "shipped":
        return "Отправлен";
      case "delivered":
        return "Доставлен";
      case "cancelled":
        return "Отменен";
      default:
        return "Неизвестен";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
      case "processing":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "shipped":
        return "bg-green-500/10 text-green-400 border-green-500/30";
      case "delivered":
        return "bg-green-500/10 text-green-500 border-green-500/30";
      case "cancelled":
        return "bg-red-500/10 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/30";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0,
    }).format(price);
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-border border-t-blue-500 rounded-full mx-auto mb-4"></div>
          <p className="text-secondary-light">Загрузка заказов...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-lg">
        <h3 className="text-red-400 font-medium mb-2">Ошибка загрузки</h3>
        <p className="text-secondary-light">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-secondary-light" />
          <input
            placeholder="Поиск по заказам..."
            className="w-full px-4 py-2 pl-10 rounded-lg bg-gradient-from/20 border border-primary-border focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white"
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearchQuery(e.target.value)
            }
          />
        </div>
        <div className="flex gap-2">
          <Button className="flex items-center">
            <span className="hidden sm:inline mr-2">Статус</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button className="flex items-center">
            <span className="hidden sm:inline mr-2">Дата</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-8">
          <Package className="mx-auto h-12 w-12 text-secondary-light opacity-50 mb-3" />
          <h3 className="text-lg font-medium text-white mb-1">
            Заказы не найдены
          </h3>
          <p className="text-secondary-light">
            {searchQuery
              ? "Попробуйте изменить параметры поиска"
              : "В данный момент заказов нет"}
          </p>
        </div>
      ) : (
        <div className="bg-gradient-from/5 border border-primary-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-from/20 border-b border-primary-border">
                  <th className="text-left text-xs font-medium text-secondary-light uppercase tracking-wider py-3 px-4">
                    № заказа
                  </th>
                  <th className="text-left text-xs font-medium text-secondary-light uppercase tracking-wider py-3 px-4">
                    Клиент
                  </th>
                  <th className="text-left text-xs font-medium text-secondary-light uppercase tracking-wider py-3 px-4">
                    Статус
                  </th>
                  <th className="text-left text-xs font-medium text-secondary-light uppercase tracking-wider py-3 px-4">
                    Сумма
                  </th>
                  <th className="text-left text-xs font-medium text-secondary-light uppercase tracking-wider py-3 px-4">
                    Товаров
                  </th>
                  <th className="text-left text-xs font-medium text-secondary-light uppercase tracking-wider py-3 px-4">
                    Дата
                  </th>
                  <th className="text-right text-xs font-medium text-secondary-light uppercase tracking-wider py-3 px-4">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-border">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gradient-from/20 transition-colors"
                  >
                    <td className="py-3 px-4 text-sm text-secondary-light">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-4 text-sm text-white">
                      {order.customerName}
                    </td>
                    <td className="py-3 px-4">
                      <div
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}
                      >
                        {getStatusIcon(order.status)}
                        <span className="ml-1.5">
                          {getStatusText(order.status)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-white font-medium">
                      {formatPrice(order.total)}
                    </td>
                    <td className="py-3 px-4 text-sm text-secondary-light">
                      {order.items}
                    </td>
                    <td className="py-3 px-4 text-sm text-secondary-light">
                      {formatDate(order.date)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button className="text-sm py-1 px-3">Подробнее</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
