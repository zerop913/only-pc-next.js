"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CurrencyDollarIcon,
  CreditCardIcon,
  TruckIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useCart } from "@/contexts/CartContext";
import { useRouter } from "next/navigation";

export default function CartSummary() {
  const { getTotalPrice, cartItems } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const totalPrice = getTotalPrice();
  const deliveryPrice = 600; // Стоимость доставки СДЭК
  const grandTotal = totalPrice + deliveryPrice;

  const handleCheckout = () => {
    setIsProcessing(true);
    // Здесь будет навигация на страницу оформления заказа
    setTimeout(() => {
      router.push("/checkout");
      setIsProcessing(false);
    }, 500);
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
          <CurrencyDollarIcon className="w-5 h-5 text-blue-400/70" />
          Итог заказа
        </h2>
      </div>

      <div className="p-5 space-y-5">
        {/* Основные блоки с суммами */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-secondary-light">
              Товары ({cartItems.length}):
            </span>
            <span className="text-white">{totalPrice.toLocaleString()} ₽</span>
          </div>{" "}
          <div className="flex justify-between items-center text-sm">
            <span className="text-secondary-light">Доставка:</span>
            <span className="text-white">
              {deliveryPrice.toLocaleString()} ₽
            </span>
          </div>
          <div className="pt-3 border-t border-primary-border/30 flex justify-between items-center">
            <span className="text-white font-medium">Итого:</span>
            <span className="text-xl font-bold text-white">
              {grandTotal.toLocaleString()} ₽
            </span>
          </div>
        </div>
        {/* Кнопка оформления заказа */}{" "}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full relative overflow-hidden bg-blue-500/20 hover:bg-blue-500/30 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 group border border-blue-500/30 ${
            isProcessing ? "opacity-80 cursor-wait" : ""
          }`}
          onClick={handleCheckout}
          disabled={isProcessing}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <CreditCardIcon className="w-5 h-5" />
            {isProcessing ? "Обработка..." : "Оформить заказ"}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-blue-400/20 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
        </motion.button>{" "}
        {/* Информационные блоки */}{" "}
        <div className="space-y-3 pt-3">
          <div className="flex items-center gap-2 text-xs text-secondary-light">
            <TruckIcon className="w-4 h-4 text-blue-400/70" />
            <span>Доставка СДЭК — 600 ₽, Почта России — 800 ₽</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-secondary-light">
            <ShieldCheckIcon className="w-4 h-4 text-blue-400/70" />
            <span>Гарантия качества на все товары</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
