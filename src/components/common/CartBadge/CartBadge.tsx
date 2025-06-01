import React from "react";
import { useCart } from "@/contexts/CartContext";

interface CartBadgeProps {
  count?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Компонент для отображения счетчика товаров в корзине
 */
const CartBadge: React.FC<CartBadgeProps> = ({
  count,
  size = "md",
  className,
}) => {
  const { getItemsCount } = useCart();

  const itemCount = count !== undefined ? count : getItemsCount();

  if (!itemCount) return null;

  const sizeStyles = {
    sm: "w-4 h-4 -top-1 -right-1 text-[10px]",
    md: "w-5 h-5 -top-1 -right-1 text-xs",
    lg: "w-6 h-6 -top-2 -right-2 text-xs",
  };

  return (
    <div
      className={`
        absolute flex items-center justify-center font-medium rounded-full 
        bg-gradient-to-r from-blue-500 to-purple-500 text-white 
        shadow-sm border border-white/10
        ${sizeStyles[size]} 
        ${className || ""}
      `}
    >
      {itemCount > 99 ? "99+" : itemCount}
    </div>
  );
};

export default CartBadge;
