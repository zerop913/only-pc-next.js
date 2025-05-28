"use client";

import { motion } from "framer-motion";
import { ShoppingBagIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

interface PaymentOrderSummaryProps {
  orderData: {
    items: Array<{
      id: number;
      name: string;
      price: number;
      image?: string;
      quantity?: number;
    }>;
    deliveryMethod: {
      name: string;
      price: string;
      id?: number;
    };
    deliveryPrice: string;
    totalPrice: string;
    orderNumber?: string;
    statusId?: number;
  };
}

export default function PaymentOrderSummary({
  orderData,
}: PaymentOrderSummaryProps) {
  console.log("PaymentOrderSummary - Начало рендеринга");
  console.log("Полученные данные заказа:", JSON.stringify(orderData, null, 2));

  if (!orderData || !orderData.items) {
    console.log("PaymentOrderSummary - Нет данных заказа");
    return null;
  }

  // Вспомогательная функция для отображения изображений
  const getImageUrl = (item: any) => {
    if (!item.image) {
      return "/icons/case.svg";
    }
    return item.image.startsWith("http") ? item.image : `/${item.image}`;
  };

  // Получаем подытог (сумма товаров без доставки)
  const subtotal = orderData.items.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0
  );
  console.log("Подытог (сумма товаров):", subtotal);

  // Получаем цену доставки
  const deliveryPriceString =
    orderData.deliveryPrice || orderData.deliveryMethod?.price || "0";
  const deliveryPriceNumber = parseFloat(deliveryPriceString);
  console.log("Цена доставки (строка):", deliveryPriceString);
  console.log("Цена доставки (число):", deliveryPriceNumber);

  // Получаем общую сумму
  const totalFromProps = parseFloat(orderData.totalPrice || "0");
  const calculatedTotal = subtotal + deliveryPriceNumber;
  console.log("Общая сумма из props:", totalFromProps);
  console.log("Расчётная общая сумма:", calculatedTotal);

  // Форматирование цены
  const formatPrice = (price: number) => {
    return price.toLocaleString("ru-RU") + " ₽";
  };

  console.log("PaymentOrderSummary - Перед рендерингом компонента");

  return (
    <motion.div
      className="sticky top-24 bg-gradient-from/20 rounded-xl border border-primary-border overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <div className="p-5 border-b border-primary-border/50">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <ShoppingBagIcon className="w-5 h-5 text-blue-400/70" />
          Сводка заказа
          {orderData.orderNumber && (
            <span className="text-sm text-secondary-light">
              #{orderData.orderNumber}
            </span>
          )}
        </h2>
      </div>

      {/* Список товаров */}
      <div className="p-5">
        <div className="space-y-4">
          {orderData.items.map((item, index) => (
            <div key={index} className="flex gap-4">
              <div className="relative w-16 h-16 bg-gradient-from/10 rounded-lg border border-primary-border overflow-hidden">
                <Image
                  src={getImageUrl(item)}
                  alt={item.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate">{item.name}</h3>
                <p className="text-secondary-light">
                  {formatPrice(item.price)} × {item.quantity || 1}
                </p>
              </div>
              <div className="text-white font-medium">
                {formatPrice(item.price * (item.quantity || 1))}
              </div>
            </div>
          ))}
        </div>

        {/* Итоги */}
        <div className="mt-6 space-y-3 text-sm">
          <div className="flex justify-between text-secondary-light">
            <span>Подытог</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-secondary-light">
            <span>Доставка ({orderData.deliveryMethod.name})</span>
            <span>{formatPrice(deliveryPriceNumber)}</span>
          </div>
          <div className="flex justify-between text-white font-semibold text-base pt-3 border-t border-primary-border/50">
            <span>Итого</span>
            <span>{formatPrice(calculatedTotal)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
