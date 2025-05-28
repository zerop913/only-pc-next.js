"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { useCheckout } from "@/contexts/CheckoutContext";
import { QrCodeIcon } from "@heroicons/react/24/outline";
import OrderSummaryStatic from "@/components/checkout/OrderSummaryStatic";
import PaymentQrCode from "@/components/payment/PaymentQrCode";

export default function QrCodePaymentPage() {
  const router = useRouter();
  const { cartItems, clearCart } = useCart();
  const { checkoutData, isReadyForPayment } = useCheckout();

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [qrData, setQrData] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [orderCreated, setOrderCreated] = useState(false);

  useEffect(() => {
    if (!isReadyForPayment()) {
      setError("Недостаточно данных для оплаты заказа");
      setTimeout(() => {
        router.push("/checkout");
      }, 1500);
      return;
    }

    // Перенаправляем на страницу корзины только если корзина пуста И заказ еще не создан
    if (cartItems.length === 0 && !orderCreated) {
      router.push("/cart");
      return;
    }

    generateQrCode();

    // Очищаем sessionStorage при первоначальной загрузке
    sessionStorage.removeItem("qrCodePaymentData");
  }, [isReadyForPayment, cartItems, router]);
  const generateQrCode = async () => {
    setLoading(true);
    try {
      const orderItems = cartItems.map((item) => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
      }));

      const response = await fetch("/api/payments/qrcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: checkoutData.total,
          description: `Оплата заказа OnlyPC`,
          paymentMethodId: checkoutData.paymentMethodId,
          items: orderItems,
          deliveryMethod: {
            name: checkoutData.deliveryMethod?.name || "Стандартная доставка",
            price: checkoutData.deliveryPrice || 0,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Ошибка при генерации QR-кода");
      }

      console.log("Received QR data:", data);

      // Сохраняем данные платежа в sessionStorage для последующего использования
      if (data.paymentId) {
        const paymentData = {
          paymentId: data.paymentId,
          amount: checkoutData.total,
          items: orderItems,
          deliveryMethod: {
            name: checkoutData.deliveryMethod?.name || "Стандартная доставка",
            price: checkoutData.deliveryPrice || 0,
          },
        };
        sessionStorage.setItem(
          "qrCodePaymentData",
          JSON.stringify(paymentData)
        );
        setPaymentId(data.paymentId);
      }

      setQrData(data.qrCodeUrl);
    } catch (error) {
      console.error("Ошибка при генерации QR-кода:", error);
      setError("Ошибка при генерации QR-кода. Пожалуйста, попробуйте еще раз.");
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    setChecking(true);

    try {
      // Извлекаем paymentId из данных QR-кода
      let paymentId = "";
      try {
        if (qrData && qrData.startsWith("data:image/")) {
          // Если qrData это dataURL, значит платежный идентификатор был сохранен в стейте отдельно
          // Берем его из sessionStorage
          const savedPaymentData = sessionStorage.getItem("qrCodePaymentData");
          if (savedPaymentData) {
            const paymentData = JSON.parse(savedPaymentData);
            paymentId = paymentData.paymentId;
            console.log("Using saved paymentId:", paymentId);
          } else {
            throw new Error("Данные платежа не найдены");
          }
        } else {
          throw new Error("Некорректный формат QR-кода");
        }

        if (!paymentId) {
          throw new Error("paymentId не найден");
        }
      } catch (e) {
        console.error("Ошибка при извлечении ID платежа из QR-кода:", e);
        throw new Error("Не удалось получить ID платежа из QR-кода");
      }

      const response = await fetch(`/api/payments/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });

      const data = await response.json();

      if (data.status === "paid") {
        const orderItems = cartItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1,
          image: item.image,
          type: item.type,
          components: item.components,
        }));

        const orderResponse = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            buildId: checkoutData.buildId,
            deliveryMethodId: checkoutData.deliveryMethodId,
            paymentMethodId: checkoutData.paymentMethodId,
            deliveryAddressId: checkoutData.deliveryAddressId,
            comment: checkoutData.comment || "",
            paidAt: new Date().toISOString(),
            paymentStatus: "paid",
            cartItems: orderItems,
          }),
        });

        const orderResult = await orderResponse.json();

        if (!orderResponse.ok || !orderResult.success) {
          throw new Error(orderResult.error || "Ошибка при создании заказа");
        } // Устанавливаем флаг, что заказ создан, чтобы избежать перенаправления на корзину
        setOrderCreated(true);

        // Очищаем корзину только после установки флага
        clearCart();
        console.log("Заказ успешно создан:", orderResult.order.orderNumber);
        localStorage.setItem(
          "lastSuccessfulOrder",
          JSON.stringify({
            orderNumber: orderResult.order.orderNumber,
            orderId: orderResult.order.id,
            timestamp: new Date().toISOString(),
          })
        );

        // Перенаправляем на страницу успешного оформления заказа
        router.push(
          `/checkout/success?orderNumber=${orderResult.order.orderNumber}&orderId=${orderResult.order.id}`
        );
      } else {
        alert(
          "Оплата еще не поступила. Пожалуйста, завершите оплату или попробуйте еще раз."
        );
      }
    } catch (error) {
      console.error("Ошибка при проверке статуса платежа:", error);
      alert(
        "Ошибка при проверке статуса платежа. Пожалуйста, попробуйте еще раз."
      );
    } finally {
      setChecking(false);
    }
  };

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

  const orderDetails = {
    items: cartItems.map((item) => ({
      name: item.name,
      price: item.price,
      quantity: item.quantity || 1,
      categoryName: item.components
        ? Object.keys(item.components)[0]
        : item.type || "Товар",
    })),
    totalPrice: checkoutData.total,
    deliveryMethod: {
      name: checkoutData.deliveryMethod?.name || "Стандартная доставка",
      price: checkoutData.deliveryPrice || 0,
    },
  };

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
      <motion.h1
        className="text-2xl sm:text-3xl font-bold text-white mb-8 flex items-center gap-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <QrCodeIcon className="w-7 h-7 text-blue-400" />
        Оплата заказа
      </motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <motion.div
          className="lg:col-span-8 space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="bg-gradient-from/10 rounded-xl border border-primary-border overflow-hidden">
            <div className="p-5 border-b border-primary-border/50">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <QrCodeIcon className="w-5 h-5 text-blue-400" />
                Оплата по QR-коду
              </h2>
              <p className="text-sm text-secondary-light mt-1">
                Отсканируйте QR-код с помощью приложения вашего банка
              </p>
            </div>
            <div className="p-6 space-y-6">
              <PaymentQrCode
                orderDetails={orderDetails}
                onCheckPayment={checkPaymentStatus}
                onRefreshQrCode={generateQrCode}
                isLoading={loading}
                isChecking={checking}
                qrCodeUrl={qrData}
              />
            </div>
          </div>
        </motion.div>

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
