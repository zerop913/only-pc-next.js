"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CartItemCard from "./CartItemCard";
import CartSummary from "./CartSummary";
import { useCart } from "@/contexts/CartContext";
import {
  ShoppingCartIcon,
  TrashIcon,
  ShoppingBagIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

export default function CartPageContent() {
  const { cartItems, clearCart } = useCart();
  const [isClearing, setIsClearing] = useState(false);

  const handleClearCart = () => {
    setIsClearing(true);
    setTimeout(() => {
      clearCart();
      setIsClearing(false);
    }, 300);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Левая колонка - список товаров */}
      <motion.div
        className="lg:col-span-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="bg-gradient-from/10 rounded-xl border border-primary-border overflow-hidden">
          <div className="p-5 border-b border-primary-border/50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ShoppingCartIcon className="w-5 h-5 text-blue-400/70" />
              <h2 className="text-xl font-semibold text-white">
                Товары в корзине
              </h2>
              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-sm rounded-full border border-blue-500/20">
                {cartItems.length}
              </span>{" "}
            </div>{" "}
            <motion.button
              whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 ${
                isClearing ? "opacity-50 pointer-events-none" : ""
              }`}
              onClick={handleClearCart}
              disabled={isClearing}
              title="Очистить корзину"
            >
              <TrashIcon className="w-5 h-5" />
            </motion.button>
          </div>

          <div className="space-y-4 p-4">
            <AnimatePresence>
              {cartItems.map((item) => (
                <CartItemCard key={item.id} item={item} />
              ))}
            </AnimatePresence>
          </div>

          {/* Нижний блок со ссылкой на каталог */}
          <div className="p-5 border-t border-primary-border/50 flex justify-between items-center">
            <div className="text-secondary-light text-sm">
              Нужно что-то еще?
            </div>
            <motion.a
              href="/catalog"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-from/30 hover:bg-gradient-from/40 text-white rounded-lg border border-primary-border transition-all duration-300"
            >
              <ShoppingBagIcon className="w-4 h-4" />
              <span>Перейти в каталог</span>
            </motion.a>
          </div>
        </div>
      </motion.div>

      {/* Правая колонка - итоги */}
      <motion.div
        className="lg:col-span-4"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <CartSummary />

        <motion.div
          className="mt-6 p-5 bg-gradient-from/10 rounded-xl border border-primary-border"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-gradient-from/20 border border-primary-border">
              <ExclamationCircleIcon className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-medium mb-1">Нужно больше?</h3>
              <p className="text-sm text-secondary-light">
                Если вам требуется большее количество товаров (более 3-х единиц
                одного наименования) или специальные условия для организаций,
                пожалуйста, напишите нам на
                <a
                  href="mailto:info@onlypc.ru"
                  className="text-blue-400 ml-1 hover:underline"
                >
                  info@onlypc.ru
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
