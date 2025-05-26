"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { ShoppingBagIcon, CheckCircleIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

  const orderNumber = searchParams.get("orderNumber");

  useEffect(() => {
    // Если номер заказа не задан, перенаправляем на страницу профиля
    if (!orderNumber) {
      router.push('/profile?tab=orders');
      return;
    }

    // Автоматическое перенаправление в профиль через 10 секунд
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push(`/profile/orders/${orderNumber}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [orderNumber, router]);

  if (!orderNumber) {
    return null; // Не рендерим контент при перенаправлении
  }

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-3xl">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-from/10 rounded-xl border border-primary-border p-8 text-center"
      >
        <div className="flex justify-center mb-6">
          <CheckCircleIcon className="h-20 w-20 text-green-500" />
        </div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-2xl sm:text-3xl font-bold text-white mb-6"
        >
          Заказ успешно оформлен!
        </motion.h1>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-secondary-light mb-8 space-y-3"
        >
          <p className="text-lg">
            Благодарим вас за покупку!
          </p>
          <p>
            Номер вашего заказа: <span className="text-white font-medium">#{orderNumber}</span>
          </p>
          <p>
            Детали заказа отправлены на вашу электронную почту.
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto"
        >
          <Link
            href={`/profile/orders/${orderNumber}`}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
          >
            <ShoppingBagIcon className="h-5 w-5" />
            <span>Подробности заказа</span>
          </Link>
          
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-transparent hover:bg-primary-border/10 text-blue-400 hover:text-blue-300 border border-primary-border rounded-lg transition"
          >
            <span>Продолжить покупки</span>
            <ArrowRightIcon className="h-5 w-5" />
          </Link>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-10 text-secondary-light/70 text-sm"
        >
          Вы будете автоматически перенаправлены на страницу заказа через {countdown} сек.
        </motion.div>
      </motion.div>
    </div>
  );
}
