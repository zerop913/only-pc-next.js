"use client";

import React, { createContext, useState, useContext, useEffect } from "react";
import {
  getStandardCookie,
  setStandardCookie,
  COOKIE_KEYS,
} from "@/utils/cookieUtils";

type CartItem = {
  id: number | string;
  name: string;
  price: number;
  image?: string;
  slug?: string; // Добавляем поле для хранения slug сборки
  type?: string;
  quantity?: number; // Добавляем количество товара
  components?: Record<string, { name: string; categoryName: string }>;
};

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: number | string) => void;
  clearCart: () => void;
  updateItemQuantity: (id: number | string, quantity: number) => void;
  getTotalPrice: () => number;
  getItemsCount: () => number;
  isItemInCart: (id: string | number) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Загружаем корзину из кук при инициализации
  useEffect(() => {
    const savedCart = getStandardCookie(COOKIE_KEYS.CART);
    if (savedCart) {
      try {
        setCartItems(savedCart);
      } catch (error) {
        console.error("Ошибка при загрузке корзины из кук:", error);
        setStandardCookie(COOKIE_KEYS.CART, []);
      }
    } else {
      // Для совместимости: попробуем загрузить из localStorage, если в куках ничего нет
      const localStorageCart = localStorage.getItem("cart");
      if (localStorageCart) {
        try {
          const parsedCart = JSON.parse(localStorageCart);
          setCartItems(parsedCart);
          // Перенесем данные в куки
          setStandardCookie(COOKIE_KEYS.CART, parsedCart);
          // Удалим данные из localStorage для предотвращения рассинхронизации
          localStorage.removeItem("cart");
        } catch (error) {
          console.error("Ошибка при загрузке корзины из localStorage:", error);
          localStorage.removeItem("cart");
        }
      }
    }
  }, []);

  // Сохраняем корзину в куках при изменении
  useEffect(() => {
    setStandardCookie(COOKIE_KEYS.CART, cartItems);
  }, [cartItems]);
  const addToCart = (item: CartItem) => {
    setCartItems((prevItems) => {
      // Проверяем, есть ли уже такой товар в корзине
      const existingItem = prevItems.find((i) => i.id === item.id);
      if (existingItem) {
        // Если товар уже есть, обновляем количество
        const newQuantity = (existingItem.quantity || 1) + (item.quantity || 1);
        // Базовая цена за единицу товара
        const basePrice = item.price / (item.quantity || 1);

        return prevItems.map((cartItem) =>
          cartItem.id === item.id
            ? {
                ...cartItem,
                quantity: newQuantity,
                // Устанавливаем новую общую цену
                price: basePrice * newQuantity,
              }
            : cartItem
        );
      }
      // Если товара нет, добавляем его
      return [...prevItems, { ...item, quantity: item.quantity || 1 }];
    });
  };

  const removeFromCart = (id: number | string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      // Базовая цена за единицу товара
      const basePrice = item.price / (item.quantity || 1);
      // Умножаем на количество
      return total + basePrice * (item.quantity || 1);
    }, 0);
  };
  const getItemsCount = () => {
    return cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
  };
  const isItemInCart = (id: string | number) => {
    return cartItems.some((item) => item.id.toString() === id.toString());
  };

  const updateItemQuantity = (id: number | string, newQuantity: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: newQuantity,
              // Устанавливаем новую цену на основе базовой цены за единицу
              price: (item.price / (item.quantity || 1)) * newQuantity,
            }
          : item
      )
    );
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        updateItemQuantity,
        getTotalPrice,
        getItemsCount,
        isItemInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
