"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Calendar,
  Truck,
  CreditCard,
  User,
  ShoppingBag,
} from "lucide-react";
import AdminOrderEmailPreviewLink from "@/components/admin/AdminOrderEmailPreviewLink";
import SendOrderEmailButton from "@/components/admin/SendOrderEmailButton";

interface OrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | null;
}

export default function OrderDetailModal({
  isOpen,
  onClose,
  orderId,
}: OrderDetailModalProps) {
  const [order, setOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails(orderId);
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${id}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Ошибка получения данных заказа");
      }

      const data = await response.json();
      setOrder(data.order);
    } catch (err) {
      console.error("Error fetching order details:", err);
      setError("Не удалось загрузить данные заказа");
    } finally {
      setIsLoading(false);
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

  const formatPrice = (price: string | number) => {
    const priceNumber = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0,
    }).format(priceNumber);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-primary rounded-lg shadow-xl border border-primary-border w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Заголовок модального окна */}
        <div className="flex justify-between items-center border-b border-primary-border p-4 bg-gradient-from">
          <h3 className="text-xl font-bold text-white">
            {isLoading
              ? "Загрузка данных заказа..."
              : order
                ? `Заказ #${order.orderNumber}`
                : "Детали заказа"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gradient-to rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-secondary-light" />
          </button>
        </div>

        {/* Содержимое модального окна */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading && (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary-border border-t-blue-500 rounded-full"></div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {!isLoading && !error && order && (
            <div className="space-y-6">
              {/* Верхняя панель с основной информацией */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-from/30 rounded-lg p-4 border border-primary-border flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-secondary-light text-sm">Дата заказа</p>
                    <p className="text-white">{formatDate(order.createdAt)}</p>
                  </div>
                </div>

                <div className="bg-gradient-from/30 rounded-lg p-4 border border-primary-border flex items-start space-x-3">
                  <User className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-secondary-light text-sm">Клиент</p>
                    <p className="text-white">
                      {order.userFirstName && order.userLastName
                        ? `${order.userLastName} ${order.userFirstName}`
                        : order.userEmail || "Неизвестно"}
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-from/30 rounded-lg p-4 border border-primary-border flex items-start space-x-3">
                  <ShoppingBag className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-secondary-light text-sm">Статус</p>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          order.statusColor
                            ? `bg-${order.statusColor}-500`
                            : "bg-gray-500"
                        }`}
                      ></span>
                      <span className="text-white">
                        {order.statusName || "Неизвестно"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Панель действий */}
              <div className="bg-gradient-from/20 border border-primary-border rounded-lg p-4">
                {" "}
                <div className="flex flex-wrap gap-3 items-center justify-between">
                  <div className="flex items-center gap-3">
                    {order.id && (
                      <AdminOrderEmailPreviewLink orderId={order.id} />
                    )}
                  </div>

                  <div>
                    {order.id && <SendOrderEmailButton orderId={order.id} />}
                  </div>
                </div>
              </div>

              {/* Информация о доставке и оплате */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-from/30 rounded-lg p-4 border border-primary-border">
                  <div className="flex items-center space-x-2 mb-3">
                    <Truck className="w-5 h-5 text-blue-400" />
                    <h4 className="text-lg text-white font-medium">Доставка</h4>
                  </div>
                  <p className="text-white mb-1">
                    {order.deliveryMethodName || "Не указано"}
                  </p>
                  {order.deliveryAddress && (
                    <p className="text-secondary-light text-sm">
                      {order.deliveryAddress.postalCode},{" "}
                      {order.deliveryAddress.city},{" "}
                      {order.deliveryAddress.streetAddress}
                    </p>
                  )}
                  <p className="text-blue-400 mt-2">
                    {formatPrice(order.deliveryPrice || 0)}
                  </p>
                </div>

                <div className="bg-gradient-from/30 rounded-lg p-4 border border-primary-border">
                  <div className="flex items-center space-x-2 mb-3">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                    <h4 className="text-lg text-white font-medium">Оплата</h4>
                  </div>
                  <p className="text-white mb-1">
                    {order.paymentMethodName || "Не указано"}
                  </p>
                  <p className="text-secondary-light text-sm">
                    {order.paidAt
                      ? `Оплачено ${formatDate(order.paidAt)}`
                      : "Не оплачено"}
                  </p>
                </div>
              </div>

              {/* Товары в заказе */}
              <div className="bg-gradient-from/30 rounded-lg border border-primary-border overflow-hidden">
                <h4 className="text-white font-medium p-4 bg-gradient-from/50 border-b border-primary-border">
                  Товары в заказе
                </h4>
                <div className="divide-y divide-primary-border">
                  {order.items &&
                    order.items.map((item: any) => (
                      <div
                        key={item.id}
                        className="p-4 flex items-center space-x-4"
                      >
                        {item.product?.imageUrl ? (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            className="w-16 h-16 object-contain bg-gradient-from rounded-md border border-primary-border"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-from rounded-md border border-primary-border flex items-center justify-center">
                            <ShoppingBag className="w-6 h-6 text-secondary" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-white font-medium">
                            {item.product?.name ||
                              item.name ||
                              item.buildSnapshot?.name ||
                              "Товар"}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <p className="text-secondary-light text-sm">
                              {item.quantity} шт.
                            </p>
                            <p className="text-blue-400 font-medium">
                              {formatPrice(item.price)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Итоговая сумма */}
                <div className="bg-gradient-from/50 p-4 border-t border-primary-border">
                  <div className="flex justify-between">
                    <p className="text-secondary-light">Товары:</p>
                    <p className="text-white">
                      {formatPrice(
                        order.items?.reduce(
                          (sum: number, item: any) =>
                            sum + parseFloat(item.price) * item.quantity,
                          0
                        ) || 0
                      )}
                    </p>
                  </div>
                  <div className="flex justify-between mt-1">
                    <p className="text-secondary-light">Доставка:</p>
                    <p className="text-white">
                      {formatPrice(order.deliveryPrice || 0)}
                    </p>
                  </div>
                  <div className="flex justify-between mt-2">
                    <p className="text-blue-400 font-medium">Итого:</p>
                    <p className="text-blue-400 font-bold text-lg">
                      {formatPrice(order.totalPrice || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* История заказа */}
              {order.history && order.history.length > 0 && (
                <div className="bg-gradient-from/30 rounded-lg border border-primary-border overflow-hidden">
                  <h4 className="text-white font-medium p-4 bg-gradient-from/50 border-b border-primary-border">
                    История заказа
                  </h4>
                  <div className="divide-y divide-primary-border">
                    {order.history.map((entry: any) => (
                      <div key={entry.id} className="p-4">
                        <div className="flex justify-between">
                          <p className="text-white">{entry.statusName}</p>
                          <p className="text-secondary-light text-sm">
                            {formatDate(entry.createdAt)}
                          </p>
                        </div>
                        {entry.comment && (
                          <p className="text-secondary-light text-sm mt-1">
                            {entry.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Комментарий к заказу */}
              {order.comment && (
                <div className="bg-gradient-from/30 rounded-lg p-4 border border-primary-border">
                  <h4 className="text-white font-medium mb-2">
                    Комментарий к заказу
                  </h4>
                  <p className="text-secondary-light">{order.comment}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Футер модального окна */}
        <div className="border-t border-primary-border p-4 bg-gradient-from flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-primary-border bg-gradient-to hover:bg-blue-600/10 text-white rounded-md transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
