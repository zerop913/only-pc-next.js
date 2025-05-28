"use client";

import React, { createContext, useState, useContext, useEffect } from "react";

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

  // Загружаем корзину из localStorage при инициализации
  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error("Ошибка при загрузке корзины:", error);
        localStorage.removeItem("cart");
      }
    }
  }, []);

  // Сохраняем корзину в localStorage при изменении
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cartItems));
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
