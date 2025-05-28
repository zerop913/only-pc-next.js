"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShoppingBagIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import { sendOrderConfirmationEmail } from "@/services/orderEmailService";
import Link from "next/link";

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);
  const [isVisible, setIsVisible] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailSending, setEmailSending] = useState(false);

  const orderNumber = searchParams.get("orderNumber");
  const orderId = searchParams.get("orderId");

  // Состояние для отслеживания необходимости перенаправления
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Эффект для обработки отсутствующего номера заказа
  useEffect(() => {
    // Если номер заказа не задан через URL, попробуем получить его из localStorage
    if (!orderNumber) {
      const lastOrderData = localStorage.getItem("lastSuccessfulOrder");
      if (lastOrderData) {
        try {
          const {
            orderNumber: lastOrderNumber,
            orderId: lastOrderId,
            timestamp,
          } = JSON.parse(lastOrderData);
          // Проверяем, что заказ был создан не более 5 минут назад
          const orderTime = new Date(timestamp);
          const now = new Date();
          const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

          if (orderTime > fiveMinutesAgo) {
            // Заказ свежий, используем его номер
            router.replace(
              `/checkout/success?orderNumber=${lastOrderNumber}&orderId=${lastOrderId}`
            );
            return;
          }
        } catch (e) {
          console.error("Ошибка при чтении данных последнего заказа:", e);
        }
      }

      // Если не удалось получить номер заказа, перенаправляем на страницу профиля
      router.push("/profile?tab=orders");
      return;
    }

    // Задержка перед показом анимации для плавного перехода
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);

    // Отправляем письмо с подтверждением заказа
    if (orderId && !emailSent && !emailSending) {
      setEmailSending(true);
      const orderIdNum = parseInt(orderId);
      if (!isNaN(orderIdNum)) {
        sendOrderConfirmationEmail(orderIdNum)
          .then((success) => {
            setEmailSent(success);
            console.log("Письмо с подтверждением заказа отправлено:", success);
          })
          .catch((error) => {
            console.error(
              "Ошибка при отправке письма с подтверждением заказа:",
              error
            );
          })
          .finally(() => {
            setEmailSending(false);
          });
      }
    }

    // Автоматическое перенаправление в профиль через 10 секунд
    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          // Устанавливаем флаг для перенаправления вместо непосредственного вызова router.push
          setShouldRedirect(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(countdownTimer);
    };
  }, [orderNumber, router]);

  // Отдельный эффект для перенаправления, который выполнится после рендеринга
  useEffect(() => {
    if (shouldRedirect && orderNumber) {
      router.push(`/profile/orders/${orderNumber}`);
    }
  }, [shouldRedirect, orderNumber, router]);

  if (!orderNumber) {
    return null; // Не рендерим контент при перенаправлении
  }

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.9 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="bg-gradient-from/10 rounded-xl border border-primary-border p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{
            scale: isVisible ? [0.5, 1.2, 1] : 0.5,
            opacity: isVisible ? 1 : 0,
          }}
          transition={{
            duration: 0.9,
            times: [0, 0.7, 1],
            ease: "easeOut",
          }}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping opacity-75" />
            <CheckCircleIcon className="h-24 w-24 text-green-500 relative z-10" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-2xl sm:text-3xl font-bold text-white mb-6"
        >
          Заказ успешно оформлен и оплачен!
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-secondary-light mb-10 space-y-3"
        >
          <p className="text-lg text-blue-400">Благодарим вас за покупку!</p>
          <p className="text-xl">
            Номер вашего заказа:{" "}
            <span className="text-white font-bold">#{orderNumber}</span>
          </p>
          <p className="text-lg">
            Статус заказа:{" "}
            <span className="text-purple-400 font-medium">Оплачен</span>
          </p>
          <p>Детали заказа отправлены на вашу электронную почту.</p>

          {/* Индикатор отправки письма */}
          <div className="flex items-center justify-center gap-2 text-sm mt-2 py-2 px-4 rounded-full bg-gradient-from/40">
            <EnvelopeIcon className="h-4 w-4" />
            <span>
              {emailSent
                ? "Письмо с подтверждением отправлено на вашу почту"
                : emailSending
                  ? "Отправляем письмо с подтверждением..."
                  : "Письмо с подтверждением будет отправлено на вашу почту"}
            </span>
          </div>

          <div className="w-full max-w-xs mx-auto h-0.5 bg-gradient-to-r from-transparent via-primary-border to-transparent my-8" />
          <p>
            Вы будете перенаправлены на страницу заказа через{" "}
            <span className="text-white font-medium">{countdown}</span> сек.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto"
        >
          <Link
            href={`/profile/orders/${orderNumber}`}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
          >
            <ShoppingBagIcon className="h-5 w-5" />
            <span>Подробности заказа</span>
          </Link>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-4 bg-transparent hover:bg-primary-border/20 text-blue-400 hover:text-blue-300 border border-primary-border rounded-lg transition"
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
          Вы будете автоматически перенаправлены на страницу заказа через{" "}
          {countdown} сек.
        </motion.div>
      </motion.div>
    </div>
  );
}
