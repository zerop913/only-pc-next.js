"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CurrencyDollarIcon,
  CreditCardIcon,
  ShoppingBagIcon,
  TruckIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import Image from "next/image";

interface OrderSummaryProps {
  cartItems: any[];
  subtotal: number;
  deliveryPrice: string;
  isSubmitting: boolean;
  onSubmit: () => void;
}

export default function OrderSummary({
  cartItems,
  subtotal,
  deliveryPrice,
  isSubmitting,
  onSubmit,
}: OrderSummaryProps) {
  const deliveryPriceNumber = parseFloat(deliveryPrice) || 0;
  const total = subtotal + deliveryPriceNumber;

  const getImageUrl = (item: any) => {
    if (!item.image) {
      return "/icons/case.svg";
    }

    if (typeof item.image === "string") {
      if (item.image.startsWith("http")) {
        return item.image;
      }
      return `/${item.image}`;
    }

    return "/icons/case.svg";
  };

  return (
    <motion.div
      className="sticky top-24 bg-gradient-from/20 rounded-xl border border-primary-border overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <div className="p-5 border-b border-primary-border/50">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <ShoppingBagIcon className="w-5 h-5 text-blue-400/70" />
          Ваш заказ
        </h2>
      </div>

      <div className="p-5 space-y-5">
        {/* Список товаров */}
        <div className="space-y-4 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
          {cartItems.map((item, index) => (
            <div
              key={index}
              className="flex gap-3 border-b border-primary-border/30 pb-3 last:border-b-0 last:pb-0"
            >
              <div className="w-16 h-16 bg-gradient-from/10 rounded-lg border border-primary-border flex items-center justify-center overflow-hidden shrink-0">
                <Image
                  src={getImageUrl(item)}
                  alt={item.name}
                  width={48}
                  height={48}
                  className="object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm text-white font-medium truncate">
                  {item.name}
                </h3>
                <p className="text-sm text-secondary-light mt-1">
                  Количество: {item.quantity || 1}
                </p>
                <p className="text-sm font-semibold text-white mt-1">
                  {item.price.toLocaleString()} ₽
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Основные блоки с суммами */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-secondary-light">
              Товары ({cartItems.length}):
            </span>
            <span className="text-white">{subtotal.toLocaleString()} ₽</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-secondary-light">Доставка:</span>
            <span className="text-white">
              {deliveryPriceNumber.toLocaleString()} ₽
            </span>
          </div>
          <div className="pt-3 border-t border-primary-border/30 flex justify-between items-center">
            <span className="text-white font-medium">Итого к оплате:</span>
            <span className="text-xl font-bold text-white">
              {total.toLocaleString()} ₽
            </span>
          </div>
        </div>

        {/* Кнопка оформления заказа */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          disabled={isSubmitting}
          onClick={onSubmit}
          className={`w-full relative overflow-hidden bg-blue-500/20 hover:bg-blue-500/30 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 group border border-blue-500/30 ${
            isSubmitting ? "opacity-80 cursor-wait" : ""
          }`}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <CreditCardIcon className="w-5 h-5" />
            {isSubmitting ? "Оформление..." : "Оформить заказ"}
          </span>
        </motion.button>

        {/* Информационные блоки */}
        <div className="space-y-3 pt-3 text-xs text-secondary-light">
          <p>
            Нажимая кнопку "Оформить заказ", вы соглашаетесь с{" "}
            <Link href="/terms" className="text-blue-400 hover:underline">
              условиями использования
            </Link>{" "}
            и{" "}
            <Link href="/privacy" className="text-blue-400 hover:underline">
              политикой конфиденциальности
            </Link>
            .
          </p>

          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="w-4 h-4 text-blue-400/70" />
            <span>Безопасная оплата и гарантия качества</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
