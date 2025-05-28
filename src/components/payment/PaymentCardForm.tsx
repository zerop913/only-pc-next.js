"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CreditCardIcon,
  KeyIcon,
  CalendarIcon,
  UserIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";

interface PaymentCardFormProps {
  onPaymentSubmit: (cardData: CardData) => void;
  amount: number;
  isProcessing: boolean;
}

interface CardData {
  number: string;
  name: string;
  expiry: string;
  cvv: string;
}

export default function PaymentCardForm({
  onPaymentSubmit,
  amount,
  isProcessing,
}: PaymentCardFormProps) {
  // Состояние для данных карты
  const [cardData, setCardData] = useState<CardData>({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });

  // Состояние для отображения ошибок валидации
  const [errors, setErrors] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });

  // Состояние для отображения анимации переворота карты
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Функция для форматирования номера карты (XXXX XXXX XXXX XXXX)
  const formatCardNumber = (value: string) => {
    const regex = /(\d{1,4})/g;
    const onlyNums = value.replace(/\D/g, "");
    return onlyNums.substring(0, 16).match(regex)?.join(" ") || "";
  };

  // Обработчики изменения полей ввода с валидацией
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatCardNumber(e.target.value);
    setCardData({ ...cardData, number: formattedValue });

    // Валидация
    if (formattedValue.replace(/\s/g, "").length < 16) {
      setErrors({ ...errors, number: "Номер карты должен содержать 16 цифр" });
    } else {
      setErrors({ ...errors, number: "" });
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Только заглавные английские буквы
    const value = e.target.value.toUpperCase().replace(/[^A-Z\s]/g, "");
    setCardData({ ...cardData, name: value });

    // Валидация
    if (value.trim().length < 2) {
      setErrors({ ...errors, name: "Введите имя держателя карты" });
    } else {
      setErrors({ ...errors, name: "" });
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    let formattedValue = value;

    // Форматирование в MM/YY
    if (value.length > 2) {
      formattedValue = `${value.slice(0, 2)}/${value.slice(2, 4)}`;
    }

    if (formattedValue.length <= 5) {
      setCardData({ ...cardData, expiry: formattedValue });

      // Валидация
      if (value.length < 4) {
        setErrors({ ...errors, expiry: "Введите срок действия карты" });
      } else {
        const month = parseInt(value.slice(0, 2));
        const year = parseInt(value.slice(2, 4));
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear() % 100;
        const currentMonth = currentDate.getMonth() + 1;

        if (month < 1 || month > 12) {
          setErrors({ ...errors, expiry: "Неверный месяц" });
        } else if (
          year < currentYear ||
          (year === currentYear && month < currentMonth)
        ) {
          setErrors({ ...errors, expiry: "Карта просрочена" });
        } else {
          setErrors({ ...errors, expiry: "" });
        }
      }
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");

    if (value.length <= 3) {
      setCardData({ ...cardData, cvv: value });

      // Валидация
      if (value.length !== 3) {
        setErrors({ ...errors, cvv: "CVV должен содержать 3 цифры" });
      } else {
        setErrors({ ...errors, cvv: "" });
      }
    }
  };

  // Проверяем валидность всей формы
  const isFormValid = () => {
    return (
      cardData.number.replace(/\s/g, "").length === 16 &&
      cardData.name.trim().length >= 2 &&
      cardData.expiry.length === 5 &&
      cardData.cvv.length === 3 &&
      !Object.values(errors).some((error) => error)
    );
  };

  // Обработчик отправки формы
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isFormValid() && !isProcessing) {
      onPaymentSubmit(cardData);
    }
  };

  return (
    <div className="bg-gradient-from/10 rounded-xl border border-primary-border overflow-hidden">
      <div className="p-5 border-b border-primary-border/50">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <CreditCardIcon className="w-5 h-5 text-blue-400/70" />
          Данные банковской карты
        </h2>
      </div>

      <div className="p-5">
        {/* Виртуальная карта с анимацией переворота */}
        <div className="relative mb-8 h-52 w-full max-w-md mx-auto">
          <div
            className={`relative w-full h-full transition-transform duration-700 transform-gpu preserve-3d ${
              isCardFlipped ? "rotate-y-180" : ""
            }`}
          >
            {/* Лицевая сторона карты */}
            <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-blue-600 to-indigo-800 rounded-xl p-5 shadow-lg">
              <div className="flex justify-between items-start">
                {/* Убираем логотип карты */}
                <div className="text-white text-lg font-medium">
                  <CreditCardIcon className="h-7 w-7" />
                </div>
                <div className="text-white opacity-80 text-sm">
                  Банковская карта
                </div>
              </div>
              <div className="mt-10">
                <div className="text-white text-xl tracking-wider font-mono">
                  {cardData.number || "•••• •••• •••• ••••"}
                </div>
              </div>

              <div className="flex justify-between mt-6 items-end">
                <div>
                  <div className="text-white/70 text-xs">Владелец</div>
                  <div className="text-white font-mono tracking-wide">
                    {cardData.name || "ИМЯ ВЛАДЕЛЬЦА"}
                  </div>
                </div>
                <div>
                  <div className="text-white/70 text-xs">Срок</div>
                  <div className="text-white font-mono">
                    {cardData.expiry || "MM/YY"}
                  </div>
                </div>
              </div>
            </div>

            {/* Обратная сторона карты */}
            <div className="absolute inset-0 backface-hidden rotate-y-180 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl shadow-lg">
              <div className="w-full h-12 bg-gray-800 mt-5"></div>
              <div className="px-5 mt-5">
                <div className="flex items-center">
                  <div className="flex-grow bg-white/90 h-8 relative">
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black font-mono">
                      {cardData.cvv || "•••"}
                    </div>
                  </div>
                  <div className="ml-3 text-white/70 text-xs">CVV</div>
                </div>
                <div className="mt-6 text-white/50 text-xs">
                  Для безопасности платежа используется 3-значный код на
                  обратной стороне карты.
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Номер карты */}
          <div>
            <label className="block text-sm font-medium text-secondary-light mb-1">
              Номер карты
            </label>
            <div className="relative">
              <input
                type="text"
                value={cardData.number}
                onChange={handleCardNumberChange}
                placeholder="1234 5678 9012 3456"
                className={`w-full px-4 py-3 bg-gradient-from/20 border ${
                  errors.number ? "border-red-500" : "border-primary-border"
                } rounded-lg text-white placeholder-secondary-light/50 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-light">
                {/* Заменяем динамическую иконку на статическую */}
                <CreditCardIcon className="h-5 w-5" />
              </div>
            </div>
            {errors.number && (
              <p className="text-red-500 text-xs mt-1">{errors.number}</p>
            )}
          </div>

          {/* Имя держателя */}
          <div>
            <label className="block text-sm font-medium text-secondary-light mb-1">
              Имя держателя карты
            </label>
            <div className="relative">
              <input
                type="text"
                value={cardData.name}
                onChange={handleNameChange}
                placeholder="IVAN IVANOV"
                className={`w-full px-4 py-3 bg-gradient-from/20 border ${
                  errors.name ? "border-red-500" : "border-primary-border"
                } rounded-lg text-white placeholder-secondary-light/50 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              />
            </div>
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Срок действия */}
            <div>
              <label className="block text-sm font-medium text-secondary-light mb-1">
                Срок действия
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={cardData.expiry}
                  onChange={handleExpiryChange}
                  placeholder="MM/YY"
                  className={`w-full px-4 py-3 bg-gradient-from/20 border ${
                    errors.expiry ? "border-red-500" : "border-primary-border"
                  } rounded-lg text-white placeholder-secondary-light/50 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-light">
                  <CalendarIcon className="h-5 w-5" />
                </div>
              </div>
              {errors.expiry && (
                <p className="text-red-500 text-xs mt-1">{errors.expiry}</p>
              )}
            </div>

            {/* CVV */}
            <div>
              <label className="block text-sm font-medium text-secondary-light mb-1">
                CVV / CVC
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={cardData.cvv}
                  onChange={handleCvvChange}
                  onFocus={() => setIsCardFlipped(true)}
                  onBlur={() => setIsCardFlipped(false)}
                  placeholder="123"
                  maxLength={3}
                  className={`w-full px-4 py-3 bg-gradient-from/20 border ${
                    errors.cvv ? "border-red-500" : "border-primary-border"
                  } rounded-lg text-white placeholder-secondary-light/50 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-light">
                  <KeyIcon className="h-5 w-5" />
                </div>
              </div>
              {errors.cvv && (
                <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="text-secondary-light text-sm mr-2">
              <LockClosedIcon className="h-4 w-4 inline-block" />
            </div>
            <p className="text-secondary-light text-sm">
              Платеж защищен безопасным соединением
            </p>
          </div>

          {/* Кнопка оплаты */}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            disabled={!isFormValid() || isProcessing}
            className={`w-full relative overflow-hidden bg-blue-500/90 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 group ${
              !isFormValid() || isProcessing
                ? "opacity-70 cursor-not-allowed"
                : ""
            }`}
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Обработка...
                </>
              ) : (
                <>
                  <CreditCardIcon className="w-5 h-5" />
                  Оплатить {amount.toLocaleString()} ₽
                </>
              )}
            </span>
          </motion.button>
        </form>
      </div>
    </div>
  );
}
