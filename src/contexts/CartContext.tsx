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
      const exists = prevItems.some((i) => i.id === item.id);
      if (exists) {
        // Если товар уже есть в корзине, увеличиваем его количество
        return prevItems.map((cartItem) =>
          cartItem.id === item.id
            ? {
                ...cartItem,
                quantity: (cartItem.quantity || 1) + (item.quantity || 1),
                price: cartItem.price + item.price,
              }
            : cartItem
        );
      }
      // Если товара нет, добавляем его с количеством 1 (если не указано иное)
      return [...prevItems, { ...item, quantity: item.quantity || 1 }];
    });
  };

  const removeFromCart = (id: number | string) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + item.price, 0);
  };
  const getItemsCount = () => {
    return cartItems.length;
  };
  const isItemInCart = (id: string | number) => {
    return cartItems.some((item) => item.id.toString() === id.toString());
  };

  const updateItemQuantity = (id: number | string, quantity: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: quantity,
              price: (item.price / (item.quantity || 1)) * quantity,
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
