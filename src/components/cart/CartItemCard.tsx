"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  TrashIcon,
  MinusIcon,
  PlusIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useCart } from "@/contexts/CartContext";

type CartItemProps = {
  item: {
    id: number | string;
    name: string;
    price: number;
    image?: string;
    slug?: string;
    type?: string;
    quantity?: number;
    components?: Record<string, { name: string; categoryName: string }>;
  };
};

export default function CartItemCard({ item }: CartItemProps) {
  const { removeFromCart, updateItemQuantity } = useCart();
  const [isRemoving, setIsRemoving] = useState(false);

  // Определяем максимальное количество (не более 3)
  const MAX_QUANTITY = 3;

  const handleRemove = () => {
    setIsRemoving(true);
    setTimeout(() => {
      removeFromCart(item.id);
    }, 300);
  };
  const handleChangeQuantity = (newQuantity: number) => {
    if (newQuantity > 0 && newQuantity <= MAX_QUANTITY) {
      updateItemQuantity(item.id, newQuantity);
    }
  };

  const getImageUrl = () => {
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

  const isPc = item.type === "build";
  const itemLink = isPc ? `/catalog/${item.slug}` : `/product/${item.slug}`;
  return (
    <motion.div
      className={`p-5 bg-gradient-from/5 hover:bg-gradient-from/10 transition-all duration-300 relative rounded-xl border border-primary-border/50 hover:border-blue-500/50 group ${isRemoving ? "opacity-50" : "opacity-100"}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, padding: 0, marginBottom: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="absolute inset-0 border-2 border-transparent hover:border-blue-400/20 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
      <div className="flex flex-col sm:flex-row gap-5">
        {/* Изображение */}
        <Link href={itemLink} className="block">
          <div className="w-full sm:w-36 h-36 relative bg-gradient-from/20 rounded-lg overflow-hidden border border-primary-border/40 flex-shrink-0">
            <Image
              src={getImageUrl()}
              alt={item.name}
              fill
              className="object-contain p-2"
            />
          </div>
        </Link>

        {/* Информация о товаре */}
        <div className="flex-1 flex flex-col">
          <Link href={itemLink}>
            <h3 className="text-base font-medium text-white hover:text-blue-300 transition-colors mb-2">
              {item.name}
            </h3>
          </Link>

          {/* Компоненты сборки (если это ПК) */}
          {isPc && item.components && (
            <div className="mt-1 mb-3">
              <div className="text-xs text-secondary-light mb-1">
                Основные компоненты:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {" "}
                {Object.entries(item.components)
                  .slice(0, 4)
                  .map(([key, component]) => (
                    <div
                      key={key}
                      className="px-2 py-0.5 rounded-full bg-gradient-from/20 text-xs text-secondary-light border border-primary-border/30"
                    >
                      {component?.categoryName}:{" "}
                      {component?.name?.length > 15
                        ? component?.name.substring(0, 15) + "..."
                        : component?.name}
                    </div>
                  ))}
                {Object.keys(item.components).length > 4 && (
                  <div className="px-2 py-0.5 rounded-full bg-gradient-from/20 text-xs text-secondary-light border border-primary-border/30">
                    +{Object.keys(item.components).length - 4} компонентов
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Управление количеством и удаление */}
          <div className="mt-auto pt-3 flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center">
              <div className="flex items-center rounded-lg border border-primary-border overflow-hidden">
                <button
                  className="p-2 bg-gradient-from/20 hover:bg-gradient-from/30 text-white transition-all"
                  onClick={() =>
                    handleChangeQuantity(Math.max(1, (item.quantity || 1) - 1))
                  }
                >
                  <MinusIcon className="w-4 h-4" />
                </button>
                <div className="px-4 py-1.5 bg-gradient-from/10 text-white font-medium">
                  {item.quantity || 1}
                </div>
                <button
                  className={`p-2 text-white transition-all ${
                    (item.quantity || 1) >= MAX_QUANTITY
                      ? "bg-gradient-from/10 text-secondary-light cursor-not-allowed"
                      : "bg-gradient-from/20 hover:bg-gradient-from/30"
                  }`}
                  onClick={() =>
                    handleChangeQuantity(
                      Math.min(MAX_QUANTITY, (item.quantity || 1) + 1)
                    )
                  }
                  disabled={(item.quantity || 1) >= MAX_QUANTITY}
                >
                  <PlusIcon className="w-4 h-4" />
                </button>{" "}
              </div>
            </div>

            <button
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all"
              onClick={handleRemove}
              disabled={isRemoving}
            >
              <TrashIcon className="w-4 h-4" />
              <span className="text-sm">Удалить</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
