"use client";

import React, { createContext, useState, useContext, useEffect } from "react";
import { DeliveryMethod, PaymentMethod, DeliveryAddress } from "@/types/order";
import {
  getStandardCookie,
  setStandardCookie,
  COOKIE_KEYS,
} from "@/utils/cookieUtils";

// Типы для контекста оформления заказа
interface CheckoutData {
  buildId: number | null;
  deliveryMethodId: number | null;
  deliveryMethod: DeliveryMethod | null;
  paymentMethodId: number | null;
  paymentMethod: PaymentMethod | null;
  deliveryAddressId: number | null;
  comment: string;
  subtotal: number;
  deliveryPrice: number;
  total: number;
}

interface CheckoutContextType {
  checkoutData: CheckoutData;
  setCheckoutData: (data: Partial<CheckoutData>) => void;
  clearCheckoutData: () => void;
  isReadyForPayment: () => boolean;
  getTotalPrice: () => number;
}

const initialCheckoutData: CheckoutData = {
  buildId: null,
  deliveryMethodId: null,
  deliveryMethod: null,
  paymentMethodId: null,
  paymentMethod: null,
  deliveryAddressId: null,
  comment: "",
  subtotal: 0,
  deliveryPrice: 0,
  total: 0,
};

const CheckoutContext = createContext<CheckoutContextType | undefined>(
  undefined
);

export const CheckoutProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [checkoutData, setCheckoutDataState] =
    useState<CheckoutData>(initialCheckoutData);
  // Загружаем данные оформления заказа из куков и localStorage при инициализации
  useEffect(() => {
    // Пробуем сначала загрузить из куков
    const cookieCheckoutData = getStandardCookie(COOKIE_KEYS.CHECKOUT);

    if (cookieCheckoutData) {
      try {
        setCheckoutDataState(cookieCheckoutData);
      } catch (error) {
        console.error(
          "Ошибка при загрузке данных оформления заказа из куков:",
          error
        );
        setStandardCookie(COOKIE_KEYS.CHECKOUT, initialCheckoutData);
      }
    } else {
      // Для обратной совместимости проверяем localStorage
      const savedCheckoutData = localStorage.getItem("checkoutData");
      if (savedCheckoutData) {
        try {
          const parsedData = JSON.parse(savedCheckoutData);
          setCheckoutDataState(parsedData);

          // Переносим данные из localStorage в куки
          setStandardCookie(COOKIE_KEYS.CHECKOUT, parsedData);

          // Удаляем из localStorage для предотвращения рассинхронизации
          localStorage.removeItem("checkoutData");
        } catch (error) {
          console.error(
            "Ошибка при загрузке данных оформления заказа из localStorage:",
            error
          );
          localStorage.removeItem("checkoutData");
        }
      }
    }
  }, []);

  // Сохраняем данные оформления заказа в куки при изменении
  useEffect(() => {
    // Сохраняем в куки
    setStandardCookie(COOKIE_KEYS.CHECKOUT, checkoutData);

    // Для обратной совместимости также сохраняем в localStorage
    localStorage.setItem("checkoutData", JSON.stringify(checkoutData));
  }, [checkoutData]);

  // Функция для обновления данных оформления заказа
  const setCheckoutData = (data: Partial<CheckoutData>) => {
    setCheckoutDataState((prev) => {
      const updatedData = { ...prev, ...data };

      // Автоматически обновляем total при изменении subtotal или deliveryPrice
      if ("subtotal" in data || "deliveryPrice" in data) {
        updatedData.total = updatedData.subtotal + updatedData.deliveryPrice;
      }

      return updatedData;
    });
  };
  // Функция для очистки данных оформления заказа
  const clearCheckoutData = () => {
    setCheckoutDataState(initialCheckoutData);
    // Удаляем данные из куков
    setStandardCookie(COOKIE_KEYS.CHECKOUT, "", { maxAge: 0 });
    // Очищаем и localStorage для совместимости
    localStorage.removeItem("checkoutData");
  };

  // Проверка готовности к оплате
  const isReadyForPayment = () => {
    return (
      checkoutData.buildId !== null &&
      checkoutData.deliveryMethodId !== null &&
      checkoutData.paymentMethodId !== null &&
      checkoutData.deliveryAddressId !== null &&
      checkoutData.subtotal > 0
    );
  };

  // Получение общей суммы заказа
  const getTotalPrice = () => {
    return checkoutData.subtotal + checkoutData.deliveryPrice;
  };

  return (
    <CheckoutContext.Provider
      value={{
        checkoutData,
        setCheckoutData,
        clearCheckoutData,
        isReadyForPayment,
        getTotalPrice,
      }}
    >
      {children}
    </CheckoutContext.Provider>
  );
};

export const useCheckout = () => {
  const context = useContext(CheckoutContext);
  if (context === undefined) {
    throw new Error("useCheckout must be used within a CheckoutProvider");
  }
  return context;
};
