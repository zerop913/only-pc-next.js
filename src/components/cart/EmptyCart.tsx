"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ShoppingCartIcon,
  ComputerDesktopIcon,
} from "@heroicons/react/24/outline";

export default function EmptyCart() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="w-20 h-20 bg-gradient-from/20 rounded-full flex items-center justify-center mb-6 border border-primary-border">
        <ShoppingCartIcon className="w-10 h-10 text-secondary-light/70" />
      </div>

      <h2 className="text-2xl font-medium text-white mb-3">
        Ваша корзина пуста
      </h2>

      <p className="text-secondary-light mb-8 max-w-lg mx-auto">
        Здесь будут отображаться добавленные вами товары и готовые сборки.
        Перейдите в каталог или конфигуратор, чтобы добавить товары в корзину.
      </p>

      <div className="flex flex-wrap justify-center gap-4">
        <Link href="/catalog">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-5 py-3 rounded-lg bg-gradient-from/20 hover:bg-gradient-from/30 text-white border border-primary-border/70 transition-all"
          >
            <ShoppingCartIcon className="w-5 h-5 text-blue-400" />
            Перейти в каталог
          </motion.button>
        </Link>

        <Link href="/configurator">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-5 py-3 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-white border border-blue-500/30 transition-all"
          >
            <ComputerDesktopIcon className="w-5 h-5 text-blue-400" />
            Собрать компьютер
          </motion.button>
        </Link>
      </div>
    </motion.div>
  );
}
