"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { useCheckout } from "@/contexts/CheckoutContext";
import { CreditCardIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import OrderSummaryStatic from "@/components/checkout/OrderSummaryStatic";
import { PAGE_TITLES } from "@/config/pageTitles";

export default function CardPaymentPage() {
  useEffect(() => {
    document.title = "Оплата картой - " + PAGE_TITLES.CHECKOUT_PAYMENT;
  }, []);
  const router = useRouter();
  const { cartItems, clearCart } = useCart();
  const { checkoutData, isReadyForPayment } = useCheckout();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [orderCreated, setOrderCreated] = useState(false);

  // Состояние для формы данных карты
  const [cardData, setCardData] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });

  // Состояние для отслеживания ошибок валидации
  const [validationErrors, setValidationErrors] = useState({
    number: false,
    name: false,
    expiry: false,
    cvv: false,
  });

  useEffect(() => {
    // Проверяем наличие всех необходимых данных заказа в контексте
    if (!isReadyForPayment()) {
      setError("Недостаточно данных для оплаты заказа");

      // Если нет данных заказа, возвращаем пользователя на страницу оформления
      setTimeout(() => {
        router.push("/checkout");
      }, 1500);

      return;
    }

    // Перенаправляем на страницу корзины только если корзина пуста И заказ еще не создан
    if (cartItems.length === 0 && !orderCreated) {
      router.push("/cart");
    }
  }, [isReadyForPayment, cartItems, router]);

  // Обработчики изменения полей формы с валидацией
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Убираем все нецифровые символы и форматируем номер карты
    const rawValue = e.target.value.replace(/\D/g, "");
    const formattedValue = formatCardNumber(rawValue);

    // Ограничение на 19 символов (16 цифр + 3 пробела)
    if (formattedValue.length <= 19) {
      setCardData({ ...cardData, number: formattedValue });
      setValidationErrors({
        ...validationErrors,
        number: formattedValue.replace(/\s/g, "").length !== 16,
      });
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Преобразуем в верхний регистр и убираем все, кроме английских букв и пробелов
    const value = e.target.value.toUpperCase().replace(/[^A-Z\s]/g, "");
    setCardData({ ...cardData, name: value });
    setValidationErrors({
      ...validationErrors,
      name: value.trim().split(/\s+/).length < 2,
    });
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Формат MM/YY
    const rawValue = e.target.value.replace(/\D/g, "");
    let formattedValue = rawValue;

    if (rawValue.length > 2) {
      formattedValue = `${rawValue.slice(0, 2)}/${rawValue.slice(2, 4)}`;
    }

    if (formattedValue.length <= 5) {
      setCardData({ ...cardData, expiry: formattedValue });

      let isValid = true;
      // Проверка срока действия карты
      if (rawValue.length === 4) {
        const month = parseInt(rawValue.slice(0, 2), 10);
        const year = parseInt(rawValue.slice(2, 4), 10);
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear() % 100; // Получаем последние 2 цифры текущего года
        const currentMonth = currentDate.getMonth() + 1;

        isValid =
          month >= 1 &&
          month <= 12 &&
          (year > currentYear ||
            (year === currentYear && month >= currentMonth));
      } else {
        isValid = false;
      }

      setValidationErrors({
        ...validationErrors,
        expiry: !isValid,
      });
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Убираем все нецифровые символы
    const value = e.target.value.replace(/\D/g, "");

    if (value.length <= 3) {
      setCardData({ ...cardData, cvv: value });
      setValidationErrors({
        ...validationErrors,
        cvv: value.length !== 3,
      });
    }
  };

  // Функция для форматирования номера карты (XXXX XXXX XXXX XXXX)
  const formatCardNumber = (value: string) => {
    const regex = /(\d{1,4})/g;
    const result = (value.match(regex) || []).join(" ");
    return result;
  };

  // Проверка на заполненность и валидность всех полей
  const isFormValid = () => {
    return (
      cardData.number.replace(/\s/g, "").length === 16 &&
      cardData.name.trim().length >= 3 &&
      cardData.expiry.length === 5 &&
      cardData.cvv.length === 3 &&
      !Object.values(validationErrors).some((error) => error)
    );
  };
  // Обработчик отправки формы
  const handleSubmit = async () => {
    if (!isFormValid() || !isReadyForPayment()) return;

    setSubmitting(true);

    try {
      // Обрабатываем платеж через сервис
      const paymentResult = await fetch("/api/payments/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: checkoutData.total,
          paymentMethodId: checkoutData.paymentMethodId,
          paymentType: "card",
          cardData: {
            cardNumber: cardData.number.replace(/\s/g, ""),
            cardholderName: cardData.name,
            expiryDate: cardData.expiry,
            cvv: cardData.cvv,
          },
        }),
      });

      const paymentData = await paymentResult.json();

      if (!paymentResult.ok || !paymentData.success) {
        throw new Error(paymentData.error || "Ошибка при обработке платежа");
      }      // После успешной оплаты создаем заказ в системе
      // Передаем информацию о всех товарах в корзине
      const orderItems = cartItems.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        image: item.image,
        type: item.type,
        components: item.components,
      }));      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryMethodId: checkoutData.deliveryMethodId,
          paymentMethodId: checkoutData.paymentMethodId,
          deliveryAddressId: checkoutData.deliveryAddressId,
          comment: checkoutData.comment || "",
          paidAt: new Date().toISOString(), // Добавляем информацию о дате оплаты
          paymentStatus: "paid", // Указываем статус оплаты
          paymentId: paymentData.paymentId, // Добавляем ID платежа
          cartItems: orderItems // Добавляем ВСЕ элементы корзины
        }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Ошибка при создании заказа");
      }

      // Устанавливаем флаг, что заказ создан, чтобы избежать перенаправления на корзину
      setOrderCreated(true);

      // Очищаем корзину после успешной оплаты
      clearCart(); // Сначала сохраняем информацию о заказе в localStorage для надежности
      localStorage.setItem(
        "lastSuccessfulOrder",
        JSON.stringify({
          orderNumber: result.order.orderNumber,
          orderId: result.order.id,
          timestamp: new Date().toISOString(),
        })
      );

      // Логируем информацию о заказе для отладки
      console.log(
        "Перенаправление после успешной оплаты картой, номер заказа:",
        result.order.orderNumber
      ); // Перенаправляем на страницу успешного оформления заказа
      router.push(
        `/checkout/success?orderNumber=${result.order.orderNumber}&orderId=${result.order.id}`
      );
    } catch (error) {
      console.error("Ошибка при оплате заказа:", error);
      setError("Ошибка при обработке платежа. Пожалуйста, попробуйте еще раз.");
    } finally {
      setSubmitting(false);
    }
  };

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
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
      <motion.h1
        className="text-2xl sm:text-3xl font-bold text-white mb-8 flex items-center gap-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <CreditCardIcon className="w-7 h-7 text-blue-400" />
        Оплата заказа
      </motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Левая колонка - форма оплаты */}
        <motion.div
          className="lg:col-span-8 space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="bg-gradient-from/10 rounded-xl border border-primary-border overflow-hidden">
            <div className="p-5 border-b border-primary-border/50">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <LockClosedIcon className="w-5 h-5 text-green-400" />
                Данные банковской карты
              </h2>
              <p className="text-sm text-secondary-light mt-1">
                Все данные передаются в зашифрованном виде
              </p>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-1">
                <label
                  htmlFor="card-number"
                  className="block text-sm font-medium text-white"
                >
                  Номер карты
                </label>
                <div
                  className={`relative rounded-lg border ${
                    validationErrors.number && cardData.number
                      ? "border-red-500"
                      : "border-primary-border"
                  }`}
                >
                  <input
                    type="text"
                    id="card-number"
                    placeholder="0000 0000 0000 0000"
                    className="w-full bg-gradient-from/20 py-3 px-4 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    value={cardData.number}
                    onChange={handleNumberChange}
                  />
                </div>
                {validationErrors.number && cardData.number && (
                  <p className="text-xs text-red-500">
                    Введите корректный 16-значный номер карты
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="card-name"
                  className="block text-sm font-medium text-white"
                >
                  Имя держателя карты
                </label>
                <div
                  className={`rounded-lg border ${
                    validationErrors.name && cardData.name
                      ? "border-red-500"
                      : "border-primary-border"
                  }`}
                >
                  <input
                    type="text"
                    id="card-name"
                    placeholder="IVAN IVANOV"
                    className="w-full bg-gradient-from/20 py-3 px-4 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    value={cardData.name}
                    onChange={handleNameChange}
                  />
                </div>
                {validationErrors.name && cardData.name && (
                  <p className="text-xs text-red-500">
                    Введите имя и фамилию как на карте
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label
                    htmlFor="card-expiry"
                    className="block text-sm font-medium text-white"
                  >
                    Срок действия
                  </label>
                  <div
                    className={`rounded-lg border ${
                      validationErrors.expiry && cardData.expiry
                        ? "border-red-500"
                        : "border-primary-border"
                    }`}
                  >
                    <input
                      type="text"
                      id="card-expiry"
                      placeholder="MM/YY"
                      className="w-full bg-gradient-from/20 py-3 px-4 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      value={cardData.expiry}
                      onChange={handleExpiryChange}
                    />
                  </div>
                  {validationErrors.expiry && cardData.expiry && (
                    <p className="text-xs text-red-500">
                      Введите корректный срок действия
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="card-cvv"
                    className="block text-sm font-medium text-white"
                  >
                    CVV/CVC
                  </label>
                  <div
                    className={`relative rounded-lg border ${
                      validationErrors.cvv && cardData.cvv
                        ? "border-red-500"
                        : "border-primary-border"
                    }`}
                  >
                    <input
                      type="password"
                      id="card-cvv"
                      placeholder="•••"
                      className="w-full bg-gradient-from/20 py-3 px-4 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      value={cardData.cvv}
                      onChange={handleCvvChange}
                    />
                  </div>
                  {validationErrors.cvv && cardData.cvv && (
                    <p className="text-xs text-red-500">
                      Введите три цифры на обратной стороне карты
                    </p>
                  )}
                </div>
              </div>

              {/* Кнопка оплаты */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                disabled={submitting || !isFormValid()}
                onClick={handleSubmit}
                className={`w-full relative overflow-hidden bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 group ${
                  submitting
                    ? "opacity-80 cursor-wait"
                    : !isFormValid()
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                }`}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <CreditCardIcon className="w-5 h-5" />
                  {submitting
                    ? "Обработка платежа..."
                    : `Оплатить ${checkoutData.total.toLocaleString()} ₽`}
                </span>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Правая колонка - сводка заказа */}
        <motion.div
          className="lg:col-span-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {" "}
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
