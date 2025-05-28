"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCheckout } from "@/contexts/CheckoutContext";
import { useCart } from "@/contexts/CartContext";
import { motion } from "framer-motion";
import { CreditCardIcon, QrCodeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import OrderSummaryStatic from "@/components/checkout/OrderSummaryStatic";

export default function PaymentPage() {
  const router = useRouter();
  const { checkoutData, isReadyForPayment } = useCheckout();
  const { cartItems } = useCart();
  const [error, setError] = useState("");

  useEffect(() => {
    // Проверяем наличие данных для оплаты
    if (!isReadyForPayment()) {
      setError("Недостаточно данных для оплаты заказа");

      // Если не хватает данных для оплаты, возвращаемся на страницу оформления
      setTimeout(() => {
        router.push("/checkout");
      }, 1500);

      return;
    }

    // Если корзина пуста, перенаправляем на страницу корзины
    if (cartItems.length === 0) {
      router.push("/cart");
    }
  }, [isReadyForPayment, cartItems, router]);
  // Если возникла ошибка, показываем сообщение
  if (error) {
    return (
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-3xl text-center">
        <div className="bg-gradient-from/10 rounded-xl border border-primary-border p-8">
          <h1 className="text-2xl text-white font-bold mb-4">Ошибка</h1>
          <p className="text-secondary-light mb-6">{error}</p>
          <Link
            href="/checkout"
            className="inline-block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition"
          >
            Вернуться к оформлению заказа
          </Link>
        </div>
      </div>
    );
  }

  // Если данные заказа загружаются или корзина пуста, показываем загрузку
  if (!isReadyForPayment() || cartItems.length === 0) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-secondary-light">Загрузка данных платежа...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-7xl">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-8">
        Выберите способ оплаты
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Левая колонка - способы оплаты */}
        <div className="lg:col-span-8">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Карта */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-from/10 rounded-xl border border-primary-border hover:border-blue-500/70 transition-all overflow-hidden cursor-pointer"
              onClick={() => router.push("/checkout/payment/card")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                  <CreditCardIcon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Банковская карта
                </h3>
                <p className="text-secondary-light text-sm">
                  Оплата с любой банковской карты Visa, MasterCard или МИР
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <div className="w-10 h-6 bg-white rounded">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png"
                      alt="Visa"
                      className="h-full w-full object-contain p-0.5"
                    />
                  </div>
                  <div className="w-10 h-6 bg-white rounded">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png"
                      alt="MasterCard"
                      className="h-full w-full object-contain p-0.5"
                    />
                  </div>
                  <div className="w-10 h-6 bg-white rounded">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/MIR-logo.SVG/2560px-MIR-logo.SVG.png"
                      alt="МИР"
                      className="h-full w-full object-contain p-0.5"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* QR-код */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-gradient-from/10 rounded-xl border border-primary-border hover:border-blue-500/70 transition-all overflow-hidden cursor-pointer"
              onClick={() => router.push("/checkout/payment/qrcode")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mb-4">
                  <QrCodeIcon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Оплата по QR-коду
                </h3>
                <p className="text-secondary-light text-sm">
                  Быстрая оплата через СБП с помощью QR-кода в приложении вашего
                  банка
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <div className="w-10 h-10 bg-white rounded-full p-2">
                    <img
                      src="https://sbp.nspk.ru/upload/iblock/853/8535a4da3ce72a53ba5d04e7877227f1.png"
                      alt="СБП"
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Правая колонка - сводка заказа */}
        <motion.div
          className="lg:col-span-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <OrderSummaryStatic
            cartItems={cartItems}
            subtotal={checkoutData.subtotal}
            deliveryPrice={checkoutData.deliveryPrice.toString()}
          />
        </motion.div>
      </div>
    </div>
  );
}
