import React from "react";
import { useCart } from "@/contexts/CartContext";

interface CartBadgeProps {
  count?: number;
  className?: string;
}

/**
 * Компонент для отображения счетчика товаров в корзине
 */
const CartBadge: React.FC<CartBadgeProps> = ({ count, className }) => {
  const { cartItems, getItemsCount } = useCart();

  // Используем переданное значение или количество товаров из контекста
  const itemCount = count !== undefined ? count : getItemsCount();

  if (!itemCount) return null;

  return (
    <div
      className={`absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium ${className || ""}`}
    >
      {itemCount > 99 ? "99+" : itemCount}
    </div>
  );
};

export default CartBadge;
