"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import { useCart } from "@/contexts/CartContext";
import { useRouter } from "next/navigation";
import EmptyCart from "@/components/cart/EmptyCart";

export default function CheckoutPage() {
  const { cartItems } = useCart();
  const router = useRouter();

  if (cartItems.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
      <motion.h1
        className="text-2xl sm:text-3xl font-bold text-white mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        Оформление заказа
      </motion.h1>

      <CheckoutForm />
    </div>
  );
}
