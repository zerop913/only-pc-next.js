"use client";

import { motion } from "framer-motion";
import { ShoppingBagIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { useCheckout } from "@/contexts/CheckoutContext";
import { getImageUrl } from "@/lib/utils/imageUtils";

interface OrderSummaryStaticProps {
  cartItems: any[];
  subtotal: number;
  deliveryPrice: string;
}

export default function OrderSummaryStatic({
  cartItems,
  subtotal,
  deliveryPrice,
}: OrderSummaryStaticProps) {
  const { checkoutData } = useCheckout();
  
  // Используем данные из контекста, если они есть, иначе используем переданные параметры
  const actualSubtotal = checkoutData.subtotal || subtotal;
  const actualDeliveryPrice = checkoutData.deliveryPrice || parseFloat(deliveryPrice) || 0;
  const total = actualSubtotal + actualDeliveryPrice;

  const getImageUrlForStatic = (item: any) => {
    if (!item.image) {
      return "/icons/case.svg";
    }

    // Если это уже полный URL, возвращаем как есть
    if (item.image.startsWith("http")) {
      return item.image;
    }

    // Нормализуем путь и используем getImageUrl для Cloudinary
    const imagePath = item.image.startsWith("/") ? item.image : `/${item.image}`;
    return getImageUrl(imagePath);
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
                  src={getImageUrlForStatic(item)}
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
        </div>          {/* Основные блоки с суммами */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-secondary-light">
              Товары ({cartItems.length}):
            </span>
            <span className="text-white">{actualSubtotal.toLocaleString()} ₽</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-secondary-light">Доставка:</span>
            <span className="text-white">
              {actualDeliveryPrice.toLocaleString()} ₽
            </span>
          </div>
          <div className="pt-3 border-t border-primary-border/30 flex justify-between items-center">
            <span className="text-white font-medium">Итого к оплате:</span>
            <span className="text-xl font-bold text-white">
              {total.toLocaleString()} ₽
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
