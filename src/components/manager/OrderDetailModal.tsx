"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  Truck,
  CreditCard,
  User,
  ShoppingBag,
  ChevronDown,
  Check,
} from "lucide-react";
import type { OrderStatus, OrderDetailModalProps } from "@/types/orders";

export default function OrderDetailModal({
  isOpen,
  onClose,
  orderId,
}: OrderDetailModalProps) {
  const [order, setOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState<string | null>(
    null
  );
  const [orderStatuses, setOrderStatuses] = useState<OrderStatus[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(false);

  // Реф для выпадающего меню статусов
  const statusButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails(orderId);
      fetchOrderStatuses();
    }
  }, [isOpen, orderId]);

  // Закрытие выпадающего списка при клике вне его
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        statusButtonRef.current &&
        !statusButtonRef.current.contains(event.target as Node) &&
        statusDropdownOpen
      ) {
        setStatusDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [statusDropdownOpen]);
  const fetchOrderDetails = async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      // Используем API для получения деталей заказа через менеджерский роут
      const response = await fetch(`/api/manager/orders/${id}`, {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Ошибка получения данных заказа");
      }
      const data = await response.json();
      console.log("Полученные данные заказа:", data);
      console.log("Товары в заказе:", data.order?.items);
      // Отладка цен товаров
      if (data.order?.items) {
        data.order.items.forEach((item: any, index: number) => {
          console.log(`Товар ${index + 1}:`, {
            name: item.product?.name || item.name || item.buildSnapshot?.name,
            price: item.price,
            buildSnapshotPrice: item.buildSnapshot?.totalPrice,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            priceType: typeof item.price,
            quantity: item.quantity,
            quantityType: typeof item.quantity,
            itemStructure: Object.keys(item),
          });
        });
      }

      setOrder(data.order);
    } catch (err) {
      console.error("Error fetching order details:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось загрузить данные заказа"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrderStatuses = async () => {
    setLoadingStatuses(true);

    try {
      const response = await fetch("/api/orders/statuses", {
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        console.error(
          "Ошибка при получении статусов заказов:",
          response.status
        );
        return; // Используем предопределенные статусы как запасной вариант
      }

      const data = await response.json();
      if (data.statuses && Array.isArray(data.statuses)) {
        setOrderStatuses(data.statuses);
      }
    } catch (err) {
      console.error("Ошибка при загрузке статусов заказов:", err);
    } finally {
      setLoadingStatuses(false);
    }
  };

  const updateOrderStatus = async (newStatusId: number) => {
    if (!orderId) return;

    setUpdatingStatus(true);
    setStatusUpdateSuccess(null);
    setError(null);

    try {
      console.log(`Обновление статуса заказа ${orderId} на ${newStatusId}`);

      const response = await fetch(`/api/manager/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
        credentials: "include",
        body: JSON.stringify({
          statusId: newStatusId,
          comment: `Статус изменен на "${orderStatuses.find((s) => s.id === newStatusId)?.name || "Неизвестен"}"`,
        }),
      });

      const data = await response
        .json()
        .catch(() => ({ error: "Ошибка при чтении ответа" }));

      if (!response.ok) {
        console.error("Ошибка обновления статуса:", response.status, data);
        throw new Error(
          data.error ||
            `Ошибка при обновлении статуса заказа (${response.status})`
        );
      }
      console.log("Статус заказа успешно обновлен:", data);

      // Перезагружаем данные заказа после успешного обновления статуса
      if (data.success) {
        await fetchOrderDetails(orderId);
        setStatusUpdateSuccess(
          data.message || "Статус заказа успешно обновлен"
        );
      } else {
        throw new Error(data.error || "Не удалось обновить статус заказа");
      }

      // Скрываем уведомление об успехе через 3 секунды
      setTimeout(() => {
        setStatusUpdateSuccess(null);
      }, 3000);
    } catch (err) {
      console.error("Error updating order status:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Произошла ошибка при обновлении статуса заказа"
      );
    } finally {
      setUpdatingStatus(false);
      setStatusDropdownOpen(false);
    }
  };
  const formatDate = (dateString: string) => {
    console.log("Original date string:", dateString);

    // Проверяем, корректно ли спарсилась дата
    let date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.error("Invalid date string:", dateString);
      return "Некорректная дата";
    }

    console.log("Parsed date (UTC):", date.toISOString());
    console.log("Parsed date (local):", date.toString());

    if (dateString.includes("Z")) {
      console.log("Date with Z suffix - treating as Moscow time stored as UTC");

      // Получаем компоненты времени как если бы это было UTC, но интерпретируем как московское
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();
      const day = date.getUTCDate();
      const hours = date.getUTCHours();
      const minutes = date.getUTCMinutes();

      // Создаем новую дату как локальное время (московское)
      const moscowDate = new Date(year, month, day, hours, minutes);

      const formatted = moscowDate.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      console.log("Formatted date (corrected Moscow time):", formatted);
      return formatted;
    }
    // Если дата содержит информацию о часовом поясе (+03, +00 и т.д.)
    else if (dateString.includes("+")) {
      console.log("Date has explicit timezone info, using as is");

      const formatted = date.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      console.log("Formatted date (with timezone info):", formatted);
      return formatted;
    } else {
      console.log("Date without timezone info, treating as Moscow time");

      // Если дата без указания часового пояса, считаем что это московское время
      const formatted = date.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      console.log("Formatted date (as Moscow time):", formatted);
      return formatted;
    }
  };

  const formatPrice = (price: string | number | undefined | null) => {
    if (price === undefined || price === null || price === "") {
      return "0 ₽";
    }

    let priceNumber: number;

    if (typeof price === "string") {
      // Удаляем все нечисловые символы кроме точки и запятой
      const cleanPrice = price.replace(/[^\d.,]/g, "").replace(",", ".");
      priceNumber = parseFloat(cleanPrice);
    } else {
      priceNumber = Number(price);
    }

    // Проверяем, является ли результат валидным числом
    if (isNaN(priceNumber)) {
      console.warn("Invalid price value:", price);
      return "0 ₽";
    }

    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0,
    }).format(priceNumber);
  };
  const safeParsePrice = (
    price: string | number | undefined | null
  ): number => {
    if (price === undefined || price === null || price === "") {
      return 0;
    }

    let priceNumber: number;

    if (typeof price === "string") {
      // Удаляем все нечисловые символы кроме точки и запятой
      const cleanPrice = price.replace(/[^\d.,]/g, "").replace(",", ".");
      priceNumber = parseFloat(cleanPrice);

      // Отладочная информация
      if (isNaN(priceNumber)) {
        console.log(
          "Failed to parse price string:",
          price,
          "cleaned:",
          cleanPrice
        );
      }
    } else {
      priceNumber = Number(price);

      // Отладочная информация
      if (isNaN(priceNumber)) {
        console.log(
          "Failed to parse price number:",
          price,
          "type:",
          typeof price
        );
      }
    }

    return isNaN(priceNumber) ? 0 : priceNumber;
  };
  // Функция для получения цены товара с учетом всех возможных источников
  const getItemPrice = (item: any): number => {
    // Для сборок - используем цену из buildSnapshot
    if (
      item.buildSnapshot &&
      typeof item.buildSnapshot === "object" &&
      item.buildSnapshot.totalPrice
    ) {
      console.log(
        "Getting price from buildSnapshot:",
        item.buildSnapshot.totalPrice
      );
      return safeParsePrice(item.buildSnapshot.totalPrice);
    }

    // Для обычных товаров - ищем цену в различных полях
    const possiblePrices = [
      item.price,
      item.unitPrice,
      item.totalPrice,
      item.product?.price,
    ];

    for (const price of possiblePrices) {
      if (price !== undefined && price !== null && price !== "") {
        console.log("Getting price from field:", price);
        return safeParsePrice(price);
      }
    }

    console.log("No price found for item:", item);
    return 0;
  }; // Функция для получения названия товара
  const getItemName = (item: any): string => {
    // Безопасная обработка названия товара
    let name = "Товар";

    if (
      item.buildSnapshot &&
      typeof item.buildSnapshot === "object" &&
      item.buildSnapshot.name
    ) {
      name = String(item.buildSnapshot.name);
    } else if (
      item.product &&
      typeof item.product === "object" &&
      item.product.name
    ) {
      name = String(item.product.name);
    } else if (item.name) {
      name = String(item.name);
    }

    return name;
  };

  // Функция для безопасного получения количества товара
  const getItemQuantity = (item: any): number => {
    if (typeof item.quantity === "number") {
      return item.quantity;
    } else if (typeof item.quantity === "string") {
      const parsed = parseInt(item.quantity, 10);
      return isNaN(parsed) ? 1 : parsed;
    }
    return 1;
  };

  // Функция для определения оплачен ли заказ
  const isPaidOrder = (order: any): boolean => {
    // Если есть дата оплаты - заказ точно оплачен
    if (order.paidAt) return true;

    // Статусы, которые указывают на оплаченный заказ
    // ID 3 = "Оплачен", ID 4 = "В сборке", ID 5 = "Отправлен", ID 6 = "Доставлен"
    const paidStatuses = [3, 4, 5, 6];

    if (order.status?.id && paidStatuses.includes(order.status.id)) {
      return true;
    }

    // Альтернативная проверка по названию статуса
    if (order.status?.name) {
      const statusName = order.status.name.toLowerCase();
      const paidKeywords = ["оплачен", "в сборке", "отправлен", "доставлен"];
      return paidKeywords.some((keyword) => statusName.includes(keyword));
    }

    return false;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />{" "}
          <motion.div
            className="relative z-10 bg-primary rounded-lg shadow-2xl border border-primary-border w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col mx-4"
            variants={{
              hidden: { opacity: 0, scale: 0.95, y: 10 },
              visible: { opacity: 1, scale: 1, y: 0 },
            }}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Заголовок модального окна */}
            <div className="flex justify-between items-center border-b border-primary-border p-5">
              <h3 className="text-xl font-semibold text-white">
                {isLoading
                  ? "Загрузка данных заказа..."
                  : order
                    ? `Заказ #${order.orderNumber}`
                    : "Детали заказа"}
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/5 rounded-full text-secondary-light hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* Содержимое модального окна */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Уведомления */}
              <AnimatePresence>
                {updatingStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mb-4 flex items-center"
                  >
                    <div className="animate-spin w-5 h-5 border-2 border-blue-500/50 border-t-blue-500 rounded-full mr-3"></div>
                    <span className="text-blue-400 font-medium">
                      Обновление статуса...
                    </span>
                  </motion.div>
                )}

                {statusUpdateSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mb-4 flex items-center"
                  >
                    <Check className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-green-400 font-medium">
                      {statusUpdateSuccess}
                    </span>
                  </motion.div>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4 flex items-center"
                  >
                    <X className="w-5 h-5 text-red-500 mr-3" />
                    <span className="text-red-400 font-medium">{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>{" "}
              {/* Индикатор загрузки */}
              {isLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12"
                >
                  <div className="animate-spin w-10 h-10 border-3 border-primary-border border-t-blue-500 rounded-full mb-3"></div>
                  <p className="text-secondary-light">
                    Загрузка информации о заказе...
                  </p>
                </motion.div>
              ) : !error && order ? (
                <div className="space-y-4">
                  {/* Компактная верхняя панель с основной информацией */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-gradient-from/20 to-gradient-to/5 rounded-lg p-4 border border-primary-border"
                  >
                    {" "}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Дата заказа */}
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-blue-500/10 flex-shrink-0">
                          <Calendar className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-secondary-light text-xs font-medium">
                            Дата заказа
                          </p>
                          <p className="text-white font-medium text-sm truncate">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Клиент */}
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-blue-500/10 flex-shrink-0">
                          <User className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-secondary-light text-xs font-medium">
                            Клиент
                          </p>{" "}
                          <p className="text-white font-medium text-sm truncate">
                            {order.userFirstName && order.userLastName
                              ? `${String(order.userLastName)} ${String(order.userFirstName)}`
                              : order.userEmail
                                ? String(order.userEmail)
                                : "Неизвестно"}
                          </p>
                        </div>
                      </div>

                      {/* Статус */}
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-blue-500/10 flex-shrink-0">
                          <ShoppingBag className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-secondary-light text-xs font-medium">
                            Статус
                          </p>
                          <div className="flex items-center space-x-2">
                            <span
                              className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor:
                                  order.status?.color || "#6B7280",
                              }}
                            ></span>{" "}
                            <span className="text-white font-medium text-sm truncate">
                              {typeof order.status === "object" &&
                              order.status?.name
                                ? String(order.status.name)
                                : "Неизвестно"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Управление статусом */}
                      <div className="flex justify-end sm:col-span-2 lg:col-span-1">
                        <div
                          className="relative w-full sm:w-auto"
                          ref={statusButtonRef}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setStatusDropdownOpen(!statusDropdownOpen);
                            }}
                            disabled={updatingStatus || loadingStatuses}
                            className="w-full sm:w-auto px-3 py-2 border border-primary-border rounded-lg bg-gradient-from/50 hover:bg-gradient-from/70 transition-colors flex items-center justify-center text-sm text-secondary-light hover:text-white"
                          >
                            {loadingStatuses ? (
                              <>
                                <div className="animate-spin w-3 h-3 border border-blue-400 border-t-blue-200 rounded-full mr-2"></div>
                                <span>Загрузка</span>
                              </>
                            ) : (
                              <>
                                <span>Изменить статус</span>
                                <ChevronDown className="w-4 h-4 ml-1" />
                              </>
                            )}
                          </button>

                          <AnimatePresence>
                            {statusDropdownOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 mt-1 w-56 bg-primary border border-primary-border rounded-lg shadow-xl z-10 overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {loadingStatuses ? (
                                  <div className="py-3 px-4 flex items-center justify-center">
                                    <div className="animate-spin w-5 h-5 border-2 border-blue-500/50 border-t-blue-500 rounded-full mr-2"></div>
                                    <span className="text-secondary-light">
                                      Загрузка...
                                    </span>
                                  </div>
                                ) : orderStatuses.length > 0 ? (
                                  <div className="py-1">
                                    {orderStatuses.map((status) => (
                                      <motion.button
                                        key={status.id}
                                        onClick={() =>
                                          updateOrderStatus(status.id)
                                        }
                                        whileHover={{
                                          backgroundColor:
                                            "rgba(59, 130, 246, 0.1)",
                                        }}
                                        className="w-full text-left px-4 py-2.5 hover:bg-gradient-from/30 flex items-center space-x-2.5 transition-colors"
                                      >
                                        <span
                                          className="block w-3 h-3 rounded-full"
                                          style={{
                                            backgroundColor:
                                              status.color || "#6B7280",
                                          }}
                                        ></span>
                                        <span className="flex-grow text-white">
                                          {status.name}
                                        </span>
                                        {order.statusId === status.id && (
                                          <Check className="h-4 w-4 text-green-500" />
                                        )}
                                      </motion.button>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="py-3 px-4 text-secondary-light">
                                    Не удалось загрузить статусы
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                  </motion.div>{" "}
                  {/* Информация о заказе: доставка, оплата и итоговая сумма */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-gradient-from/20 to-gradient-to/5 rounded-lg border border-primary-border overflow-hidden"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-primary-border">
                      {/* Доставка */}
                      <div className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="p-1.5 rounded-lg bg-blue-500/10">
                            <Truck className="w-4 h-4 text-blue-400" />
                          </div>
                          <h4 className="text-white font-medium">Доставка</h4>
                        </div>
                        <div className="space-y-2">
                          <div>
                            {" "}
                            <p className="text-white font-medium text-sm">
                              {typeof order.deliveryMethod === "object" &&
                              order.deliveryMethod?.name
                                ? String(order.deliveryMethod.name)
                                : "Не указано"}
                            </p>
                            <p className="text-blue-400 font-medium text-sm">
                              {formatPrice(order.deliveryPrice || 0)}
                            </p>
                          </div>
                          {order.deliveryAddress && (
                            <div className="pt-2 border-t border-primary-border/50">
                              <p className="text-secondary-light text-xs font-medium mb-1">
                                Адрес доставки:
                              </p>{" "}
                              <p className="text-secondary-light text-xs leading-relaxed">
                                {String(order.deliveryAddress.postalCode || "")}
                                , {String(order.deliveryAddress.city || "")}
                                <br />
                                {String(
                                  order.deliveryAddress.streetAddress || ""
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Оплата */}
                      <div className="p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="p-1.5 rounded-lg bg-blue-500/10">
                            <CreditCard className="w-4 h-4 text-blue-400" />
                          </div>
                          <h4 className="text-white font-medium">Оплата</h4>
                        </div>
                        <div className="space-y-2">
                          {" "}
                          <p className="text-white font-medium text-sm">
                            {typeof order.paymentMethod === "object" &&
                            order.paymentMethod?.name
                              ? String(order.paymentMethod.name)
                              : "Не указано"}
                          </p>{" "}
                          <div className="pt-2 border-t border-primary-border/50">
                            <p
                              className={`text-xs font-medium ${
                                isPaidOrder(order)
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {order.paidAt
                                ? `Оплачено ${formatDate(order.paidAt)}`
                                : isPaidOrder(order)
                                  ? "Оплачено при оформлении"
                                  : "Ожидает оплаты"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Итоговая сумма */}
                      <div className="p-4 bg-gradient-from/10">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="p-1.5 rounded-lg bg-blue-500/10">
                            <ShoppingBag className="w-4 h-4 text-blue-400" />
                          </div>
                          <h4 className="text-white font-medium">Итого</h4>
                        </div>
                        <div className="space-y-2">
                          {" "}
                          <div className="flex justify-between text-sm">
                            <span className="text-secondary-light">
                              Товары:
                            </span>
                            <span className="text-white">
                              {" "}
                              {formatPrice(
                                order.items?.reduce(
                                  (sum: number, item: any) =>
                                    sum +
                                    getItemPrice(item) * getItemQuantity(item),
                                  0
                                ) || 0
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-secondary-light">
                              Доставка:
                            </span>
                            <span className="text-white">
                              {formatPrice(safeParsePrice(order.deliveryPrice))}
                            </span>
                          </div>
                          <div className="pt-2 border-t border-primary-border/50">
                            <div className="flex justify-between">
                              <span className="text-blue-400 font-bold">
                                К оплате:
                              </span>
                              <span className="text-blue-400 font-bold text-lg">
                                {formatPrice(safeParsePrice(order.totalPrice))}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>{" "}
                  {/* Товары в заказе */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-gradient-from/20 to-gradient-to/5 rounded-lg border border-primary-border overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-primary-border bg-gradient-from/10 flex items-center justify-between">
                      <h4 className="text-white font-medium flex items-center space-x-2">
                        <ShoppingBag className="w-4 h-4" />
                        <span>Товары в заказе</span>
                      </h4>
                      <span className="text-secondary-light text-sm">
                        {order.items?.length || 0} шт.
                      </span>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {order.items && order.items.length > 0 ? (
                        <div className="divide-y divide-primary-border/50">
                          {order.items.map((item: any, index: number) => (
                            <motion.div
                              key={item.id || index}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.1 * index }}
                              className="p-3 flex items-center space-x-3 hover:bg-gradient-from/5 transition-colors"
                            >
                              {item.product?.imageUrl ? (
                                <img
                                  src={item.product.imageUrl}
                                  alt={item.product.name}
                                  className="w-12 h-12 object-contain bg-gradient-from/10 rounded border border-primary-border/50"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gradient-from/10 rounded border border-primary-border/50 flex items-center justify-center">
                                  <ShoppingBag className="w-5 h-5 text-secondary" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-medium text-sm truncate">
                                  {getItemName(item)}
                                </p>{" "}
                                <div className="flex items-center justify-between mt-1">
                                  <span className="text-secondary-light text-xs">
                                    {getItemQuantity(item)} ×{" "}
                                    {formatPrice(getItemPrice(item))}
                                  </span>
                                  <span className="text-blue-400 font-medium text-sm">
                                    {formatPrice(
                                      getItemPrice(item) * getItemQuantity(item)
                                    )}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <ShoppingBag className="w-12 h-12 text-secondary mx-auto mb-3" />
                          <p className="text-secondary-light">
                            Товары не найдены
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>{" "}
                  {/* Дополнительная информация */}
                  {(order.history?.length > 0 || order.comment) && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-gradient-to-br from-gradient-from/20 to-gradient-to/5 rounded-lg border border-primary-border overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-primary-border bg-gradient-from/10">
                        <h4 className="text-white font-medium">
                          Дополнительная информация
                        </h4>
                      </div>

                      <div className="p-4 space-y-4">
                        {" "}
                        {/* История заказа */}
                        {order.history && order.history.length > 0 && (
                          <div>
                            <h5 className="text-white font-medium text-sm mb-3 flex items-center space-x-2">
                              <Calendar className="w-4 h-4" />
                              <span>История изменений</span>
                            </h5>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {order.history.map(
                                (entry: any, index: number) => {
                                  // Отладочная информация для даты в истории
                                  console.log(`History entry ${index}:`, {
                                    createdAt: entry.createdAt,
                                    updatedAt: entry.updatedAt,
                                    status: entry.status?.name,
                                  });

                                  return (
                                    <motion.div
                                      key={entry.id}
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: 0.1 * index }}
                                      className="flex items-start justify-between p-2 bg-gradient-from/5 rounded border border-primary-border/30"
                                    >
                                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                                        <span
                                          className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                                          style={{
                                            backgroundColor: (entry.status
                                              ?.color || "#6B7280") as string,
                                          }}
                                        ></span>{" "}
                                        <div className="min-w-0 flex-1">
                                          <p className="text-white text-sm truncate">
                                            {typeof entry.status === "object" &&
                                            entry.status?.name
                                              ? String(entry.status.name)
                                              : "Неизвестен"}
                                          </p>
                                          {entry.comment && (
                                            <p className="text-secondary-light text-xs mt-1 truncate">
                                              {String(entry.comment)}
                                            </p>
                                          )}
                                        </div>
                                      </div>{" "}
                                      <span className="text-secondary-light text-xs flex-shrink-0 ml-2">
                                        {formatDate(entry.createdAt)
                                          .split(" ")
                                          .slice(0, 2)
                                          .join(" ")}
                                      </span>
                                    </motion.div>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        )}
                        {/* Комментарий к заказу */}
                        {order.comment && (
                          <div>
                            <h5 className="text-white font-medium text-sm mb-2 flex items-center space-x-2">
                              <User className="w-4 h-4" />
                              <span>Комментарий клиента</span>
                            </h5>{" "}
                            <div className="p-3 bg-gradient-from/5 rounded border border-primary-border/30">
                              <p className="text-secondary-light text-sm leading-relaxed">
                                {String(order.comment)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : null}
            </div>{" "}
            {/* Футер модального окна */}
            <div className="border-t border-primary-border p-5 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="px-6 py-2.5 bg-primary hover:bg-gradient-from/10 border border-primary-border text-white rounded-lg transition-colors"
              >
                Закрыть
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
