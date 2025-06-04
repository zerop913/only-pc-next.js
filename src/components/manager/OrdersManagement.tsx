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
  Eye,
  ShoppingBag,
  Info as InfoIcon,
} from "lucide-react";
import Button from "@/components/common/Button/Button";
import OrderDetailModal from "./OrderDetailModal";
import type { Order } from "@/types/orders";

// Функция для конвертации HEX-цвета в RGB
const hexToRgb = (hex: string | null): string => {
  if (!hex) return "128, 128, 128"; // Возвращаем серый цвет по умолчанию

  try {
    // Проверяем, является ли color HEX-цветом
    if (hex.startsWith("#")) {
      // Удаляем # если он присутствует
      hex = hex.replace(/^#/, "");

      // Поддержка как трехзначных (#RGB), так и шестизначных (#RRGGBB) HEX-цветов
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }

      // Парсим компоненты RGB
      let bigint = parseInt(hex, 16);
      let r = (bigint >> 16) & 255;
      let g = (bigint >> 8) & 255;
      let b = bigint & 255;

      return `${r}, ${g}, ${b}`;
    }

    // Обработка rgb/rgba формата
    if (hex.startsWith("rgb")) {
      const rgbMatch = hex.match(/(\d+),\s*(\d+),\s*(\d+)/);
      if (rgbMatch) {
        return `${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}`;
      }
    }

    // Если формат не распознан или произошла ошибка, возвращаем серый цвет
    return "128, 128, 128";
  } catch (error) {
    console.error("Error parsing color:", error);
    return "128, 128, 128";
  }
};

export default function OrdersManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

        console.log("Raw data from API:", data);
        console.log("First order data:", data.orders[0]);

        // Обрабатываем данные и добавляем customerName
        const processedOrders = data.orders.map((order: any) => {
          console.log("Processing order:", order);
          return {
            ...order,
            // Исправляем обработку суммы заказа
            total:
              typeof order.totalPrice === "string"
                ? parseFloat(order.totalPrice)
                : order.totalPrice || 0,
            // Исправляем обработку даты
            date: order.createdAt || new Date().toISOString(),
            customerName:
              order.user?.profile?.firstName && order.user?.profile?.lastName
                ? `${order.user.profile.firstName} ${order.user.profile.lastName}`
                : order.user?.email || order.email || "Неизвестный клиент",
          };
        });

        console.log("Processed orders:", processedOrders);
        setOrders(processedOrders);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError(err instanceof Error ? err.message : "Произошла ошибка");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Возвращает иконку для статуса заказа
  const getStatusIcon = (status: {
    id: number;
    name: string;
    color?: string | null;
  }) => {
    const statusLower = status.name.toLowerCase();

    if (statusLower.includes("нов") || statusLower.includes("ожида")) {
      return <Clock className="w-4 h-4 text-yellow-400" />;
    } else if (
      statusLower.includes("обраб") ||
      statusLower.includes("подтв") ||
      statusLower.includes("опла") ||
      statusLower.includes("сбор")
    ) {
      return <Package className="w-4 h-4 text-blue-400" />;
    } else if (statusLower.includes("отправ")) {
      return <Truck className="w-4 h-4 text-green-400" />;
    } else if (
      statusLower.includes("достав") ||
      statusLower.includes("получ") ||
      statusLower.includes("завер")
    ) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else if (statusLower.includes("отмен")) {
      return <AlertCircle className="w-4 h-4 text-red-400" />;
    } else {
      return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  // Возвращаем текст статуса заказа (используем оригинальный текст из базы данных)
  const getStatusText = (status: {
    id: number;
    name: string;
    color?: string | null;
  }) => {
    return status.name;
  };

  // Возвращает цвет для статуса заказа
  const getStatusColor = (status: {
    id: number;
    name: string;
    color?: string | null;
  }) => {
    const statusLower = status.name.toLowerCase();

    if (statusLower.includes("нов") || statusLower.includes("ожида")) {
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
    } else if (
      statusLower.includes("обраб") ||
      statusLower.includes("подтв") ||
      statusLower.includes("опла") ||
      statusLower.includes("сбор")
    ) {
      return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    } else if (statusLower.includes("отправ")) {
      return "bg-green-500/10 text-green-400 border-green-500/30";
    } else if (
      statusLower.includes("достав") ||
      statusLower.includes("получ") ||
      statusLower.includes("завер")
    ) {
      return "bg-green-500/10 text-green-500 border-green-500/30";
    } else if (statusLower.includes("отмен")) {
      return "bg-red-500/10 text-red-400 border-red-500/30";
    } else {
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
      (order.user?.profile?.firstName &&
        order.user.profile.firstName
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      (order.user?.profile?.lastName &&
        order.user.profile.lastName
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      (order.user?.email &&
        order.user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (order.email &&
        order.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return <div className="animate-pulse">Загрузка заказов...</div>;
  }

  if (error) {
    return <div className="text-red-400">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-medium text-white">Заказы</h2>
              <div className="px-2 py-0.5 text-sm bg-gradient-from/20 text-secondary-light rounded-md border border-primary-border">
                Всего: {orders.length}
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <span className="h-4 w-px bg-primary-border/50" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <span className="text-sm text-secondary-light">
                  Новые:{" "}
                  {
                    orders.filter((o) =>
                      o.status.name.toLowerCase().includes("нов")
                    ).length
                  }
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-sm text-secondary-light">
                  Завершенные:{" "}
                  {
                    orders.filter(
                      (o) =>
                        o.status.name.toLowerCase().includes("достав") ||
                        o.status.name.toLowerCase().includes("получ") ||
                        o.status.name.toLowerCase().includes("завер")
                    ).length
                  }
                </span>
              </div>
            </div>
          </div>
          <div className="relative w-full md:w-72">
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
        </div>

        <div className="flex items-center gap-3 px-4 py-2.5 bg-gradient-from/10 rounded-lg border border-primary-border/50">
          <InfoIcon className="w-5 h-5 text-blue-400" />
          <p className="text-sm text-secondary-light">
            Здесь отображаются все заказы клиентов. Вы можете отслеживать их
            статусы и управлять доставкой.
          </p>
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
        <div className="bg-gradient-from/10 border border-primary-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-from/30">
                  <th className="text-left px-4 py-3 text-secondary-light font-medium text-sm">
                    № заказа
                  </th>
                  <th className="text-left px-4 py-3 text-secondary-light font-medium text-sm">
                    Клиент
                  </th>
                  <th className="text-left px-4 py-3 text-secondary-light font-medium text-sm">
                    Статус
                  </th>
                  <th className="text-left px-4 py-3 text-secondary-light font-medium text-sm">
                    Сумма
                  </th>
                  <th className="text-left px-4 py-3 text-secondary-light font-medium text-sm">
                    Товаров
                  </th>
                  <th className="text-left px-4 py-3 text-secondary-light font-medium text-sm">
                    Дата
                  </th>
                  <th className="text-right px-4 py-3 text-secondary-light font-medium text-sm">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-border/30">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gradient-from/20 transition-colors duration-200"
                  >
                    <td className="px-4 py-3 text-white text-sm">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-white text-sm">
                      {order.customerName}
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${!order.status.color ? getStatusColor(order.status) : ""}`}
                        style={
                          order.status.color
                            ? {
                                backgroundColor: `rgba(${hexToRgb(order.status.color)}, 0.1)`,
                                color: order.status.color,
                                borderColor: `rgba(${hexToRgb(order.status.color)}, 0.3)`,
                              }
                            : undefined
                        }
                      >
                        {getStatusIcon(order.status)}
                        <span className="ml-1.5">
                          {getStatusText(order.status)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white text-sm font-medium">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-4 py-3 text-secondary-light text-sm">
                      {Array.isArray(order.items)
                        ? order.items.length
                        : order.items}
                    </td>
                    <td className="px-4 py-3 text-secondary-light text-sm">
                      {formatDate(order.date)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5 justify-end">
                        <button
                          onClick={() => {
                            setSelectedOrderId(order.id);
                            setIsModalOpen(true);
                          }}
                          className="p-2 text-blue-400 hover:text-blue-300 transition-colors rounded-lg hover:bg-blue-500/10"
                          title="Подробнее"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Модальное окно с деталями заказа */}
      <OrderDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        orderId={selectedOrderId}
      />
    </div>
  );
}
