"use client";

import { OrderWithRelations } from "@/types/order";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Package2,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Truck,
  CreditCard,
  User,
  MapPin,
  CalendarDays,
  ShoppingBag,
} from "lucide-react";
import { motion } from "framer-motion";
import { useOrderStatuses } from "@/hooks/useOrderStatuses";
import { generateStatusStyles } from "@/utils/statusStyles";

interface OrderDetailsProps {
  order: OrderWithRelations;
}

export function OrderDetails({ order: initialOrder }: OrderDetailsProps) {
  const { user } = useAuth();
  const [order, setOrder] = useState(initialOrder);

  const { getStatusColor, getStatusName } = useOrderStatuses();

  // Закрытие выпадающего списка при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Убираем этот код поскольку больше нет выпадающих списков для управления статусом
    };
  }, []);

  // Функция форматирования даты (скопирована из OrderDetailModal для правильной работы с временными зонами)
  const formatDate = (dateInput: string | Date) => {
    console.log("Original date input:", dateInput, "Type:", typeof dateInput);

    // Если уже объект Date, используем его, иначе парсим строку
    let date: Date;
    let isStringWithZ = false;

    if (dateInput instanceof Date) {
      date = dateInput;
    } else if (typeof dateInput === "string") {
      isStringWithZ = dateInput.includes("Z");
      date = new Date(dateInput);
    } else {
      console.error("Invalid date input type:", typeof dateInput, dateInput);
      return "Некорректная дата";
    }

    // Проверяем, корректно ли спарсилась дата
    if (isNaN(date.getTime())) {
      console.error("Invalid date:", dateInput);
      return "Некорректная дата";
    }

    console.log("Parsed date (UTC):", date.toISOString());
    console.log("Parsed date (local):", date.toString());

    // Если дата в UTC формате (с Z), отображаем в московском часовом поясе
    if (isStringWithZ) {
      console.log("Date with Z suffix - converting UTC to Moscow time");

      const formatted = date.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Moscow",
      });

      console.log("Formatted date (Moscow time):", formatted);
      return formatted;
    }
    // Если дата содержит информацию о часовом поясе (+03, +00 и т.д.)
    else if (typeof dateInput === "string" && dateInput.includes("+")) {
      console.log("Date has explicit timezone info, converting to Moscow time");

      const formatted = date.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Moscow",
      });

      console.log("Formatted date (with timezone info):", formatted);
      return formatted;
    } else {
      console.log("Date object or string without timezone info");

      // Если это объект Date, он может содержать локальное время с часовым поясом
      // Нам нужно отобразить UTC время (которое на 3 часа меньше московского)
      if (dateInput instanceof Date) {
        console.log("Date object - displaying UTC time");

        const formatted = date.toLocaleString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "UTC",
        });

        console.log("Formatted date (UTC time):", formatted);
        return formatted;
      } else {
        // Если строка без часового пояса, отображаем как есть
        const formatted = date.toLocaleString("ru-RU", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        console.log("Formatted date (as is):", formatted);
        return formatted;
      }
    }
  };

  // Форматирование цены в едином стиле
  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  // Преобразование строки цены в число
  const parsePrice = (price: string | number | undefined): number => {
    if (typeof price === "undefined") return 0;
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return Number.isFinite(numPrice) ? numPrice : 0;
  };

  // Расчет общей стоимости товаров (без доставки)
  const subtotal =
    order.items?.reduce((total, item) => {
      // Используем цену из buildSnapshot без модификаций
      const price = parsePrice(item.buildSnapshot?.totalPrice);
      // Умножаем на количество
      return total + price * (item.quantity || 1);
    }, 0) || 0;

  // Цена доставки
  const deliveryPrice = parsePrice(order.deliveryMethod?.price);

  // Общая стоимость заказа
  const totalPrice = subtotal + deliveryPrice;

  // Статус оплаты на основе статуса заказа (3 = "Оплачен")
  const paymentStatus =
    order.statusId === 3 || order.statusId > 3 ? "Оплачен" : null;

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        className="mb-8 flex items-center justify-between"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link
          href="/profile/orders"
          className="inline-flex items-center text-white/70 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 text-blue-400 transition-transform group-hover:-translate-x-1" />
          <span className="border-b border-white/10 group-hover:border-white/40">
            Вернуться к списку заказов
          </span>
        </Link>
        <div
          className="px-4 py-1.5 rounded-lg text-sm font-medium border"
          style={generateStatusStyles(getStatusColor(order.statusId))}
        >
          {getStatusName(order.statusId)}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Основная информация о заказе */}
        <motion.div
          className="lg:col-span-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Инфо о заказе */}
          <div className="bg-gradient-from/10 rounded-xl border border-primary-border overflow-hidden">
            <div className="p-5 border-b border-primary-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package2 className="w-5 h-5 text-blue-400/70" />
                  <h2 className="text-xl font-semibold text-white">
                    Заказ #{order.orderNumber}
                  </h2>
                  {paymentStatus === "Оплачен" && (
                    <div className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-sm rounded-full border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Оплачен</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Список товаров */}
            <div className="space-y-4 p-4">
              {order.items?.map((item) => (
                <motion.div
                  key={item.id}
                  className="group relative bg-gradient-from/10 hover:bg-gradient-from/20 border border-primary-border/20 hover:border-blue-500/50 rounded-xl p-4 transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="absolute inset-0 border-2 border-transparent hover:border-blue-400/20 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                  <div className="flex items-center gap-6">
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gradient-to-br from-primary-lighter/10 to-primary/5 group-hover:shadow-lg transition-all">
                      <Image
                        src={(() => {
                          const caseSlug =
                            item.buildSnapshot?.components?.korpusa;
                          if (!caseSlug) {
                            return "/icons/case.svg";
                          }
                          return `/images/korpusa/${caseSlug}.jpg`;
                        })()}
                        alt={item.buildSnapshot?.name || "Компьютерная сборка"}
                        fill
                        className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="flex-grow">
                      <div className="font-medium text-white/90 group-hover:text-white text-lg transition-colors">
                        {item.buildSnapshot?.name || "Компьютерная сборка"}
                      </div>
                      <div className="text-sm text-white/60 group-hover:text-white/70 mt-1 transition-colors">
                        {item.quantity > 1 ? `${item.quantity} шт.` : "1 шт."}
                      </div>
                    </div>
                    <div className="text-lg font-medium text-white/90 group-hover:text-white transition-colors">
                      {formatPrice(
                        parseFloat(item.buildSnapshot?.totalPrice || "0") *
                          (item.quantity || 1)
                      )}
                      {item.quantity > 1 && (
                        <div className="text-xs text-secondary-light mt-1">
                          {formatPrice(item.buildSnapshot?.totalPrice || "0")} ×{" "}
                          {item.quantity}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Дополнительная информация */}
            <div className="p-5 border-t border-primary-border/50 flex items-center justify-between">
              <div className="text-secondary-light text-sm flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                {formatDate(order.createdAt)}
              </div>
              <Link
                href="/catalog"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-from/30 hover:bg-gradient-from/40 text-white rounded-lg border border-primary-border transition-all duration-300"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>В каталог</span>
              </Link>
            </div>
          </div>

          {/* История статусов заказа */}
          {order.history && order.history.length > 0 && (
            <motion.div
              className="bg-gradient-from/10 rounded-xl border border-primary-border overflow-hidden mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="p-5 border-b border-primary-border/50">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-blue-400/70" />
                  История статусов заказа
                </h2>
              </div>

              <div className="p-5">
                <div className="space-y-4">
                  {order.history &&
                    order.history.length > 0 &&
                    order.history
                      .sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime()
                      )
                      .map((entry, index) => (
                        <motion.div
                          key={entry.id}
                          className="flex items-start gap-4 p-4 bg-gradient-from/10 hover:bg-gradient-from/20 rounded-xl border border-primary-border/20 hover:border-blue-500/30 transition-all duration-300"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          {/* Индикатор статуса */}
                          <div className="flex flex-col items-center mt-1">
                            <div
                              className="w-4 h-4 rounded-full border-2 border-white/20"
                              style={{
                                backgroundColor:
                                  entry.status?.color || "#6B7280",
                                boxShadow: `0 0 0 3px ${entry.status?.color || "#6B7280"}20`,
                              }}
                            />
                            {index < (order.history?.length || 0) - 1 && (
                              <div className="w-px h-8 bg-gradient-to-b from-primary-border/50 to-transparent mt-2" />
                            )}
                          </div>

                          {/* Содержимое записи */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-white/90 font-medium">
                                {entry.status?.name || "Неизвестный статус"}
                              </h3>
                              <span className="text-xs text-white/60 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDate(entry.createdAt)}
                              </span>
                            </div>

                            {entry.comment && (
                              <p className="text-sm text-white/70 leading-relaxed">
                                {entry.comment}
                              </p>
                            )}

                            {entry.user && (
                              <div className="mt-2 flex items-center gap-2 text-xs text-white/50">
                                <User className="w-3 h-3" />
                                <span>
                                  Изменено:{" "}
                                  {(entry.user as any)?.profile?.firstName}{" "}
                                  {(entry.user as any)?.profile?.lastName}
                                  {entry.user.email && ` (${entry.user.email})`}
                                </span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Правая колонка с информацией */}
        <motion.div
          className="lg:col-span-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* Сумма заказа */}
          <div className="sticky top-24 space-y-6">
            <div className="bg-gradient-from/20 rounded-xl border border-primary-border overflow-hidden">
              <div className="p-5 border-b border-primary-border/50">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-400/70" />
                  Сумма заказа
                </h2>
              </div>

              <div className="p-5 space-y-4">
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white/70">Товары:</span>
                    <span className="text-white">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Доставка:</span>
                    <span className="text-white">
                      {formatPrice(deliveryPrice)}
                    </span>
                  </div>
                  <div className="h-px bg-primary-border/50 my-1"></div>
                  <div className="flex justify-between font-medium">
                    <span className="text-white">Итого:</span>
                    <span className="text-white">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Информация о доставке */}
            <div className="bg-gradient-from/20 rounded-xl border border-primary-border overflow-hidden">
              <div className="p-5 border-b border-primary-border/50">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Truck className="w-5 h-5 text-blue-400/70" />
                  Доставка
                </h2>
              </div>

              <div className="p-5 space-y-4">
                <div className="px-4 py-3 bg-gradient-from/10 rounded-lg border border-primary-border/30">
                  <div className="text-sm font-medium text-white/90 mb-1">
                    {order.deliveryMethod?.name || "Способ доставки не указан"}
                  </div>
                  {order.deliveryMethod?.description && (
                    <div className="text-xs text-white/70">
                      {order.deliveryMethod.description}
                    </div>
                  )}
                </div>

                {order.deliveryAddress && (
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-white/90">
                      <User className="w-4 h-4 text-blue-400/70" />
                      <span>{order.deliveryAddress.recipientName}</span>
                    </div>
                    <div className="flex gap-2">
                      <MapPin className="w-4 h-4 text-blue-400/70 mt-0.5 flex-shrink-0" />
                      <div className="text-white/70">
                        {order.deliveryAddress.postalCode},{" "}
                        {order.deliveryAddress.country},{" "}
                        {order.deliveryAddress.city},{" "}
                        {order.deliveryAddress.streetAddress}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Комментарий к заказу */}
            {order.comment && (
              <div className="bg-gradient-from/20 rounded-xl border border-primary-border overflow-hidden p-5">
                <div className="text-white/90 font-medium mb-2">
                  Комментарий к заказу
                </div>
                <div className="text-sm text-white/70">{order.comment}</div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
