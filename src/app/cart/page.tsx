"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import CartPageContent from "@/components/cart/CartPageContent";
import EmptyCart from "@/components/cart/EmptyCart";
import { useCart } from "@/contexts/CartContext";

export default function CartPage() {
  const { cartItems, isItemInCart } = useCart();

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
      <motion.h1
        className="text-2xl sm:text-3xl font-bold text-white mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        Корзина
      </motion.h1>

      {cartItems.length > 0 ? <CartPageContent /> : <EmptyCart />}
    </div>
  );
}
