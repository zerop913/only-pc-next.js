"use client";

import { useFavorites } from "@/contexts/FavoritesContext";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, AlertTriangle, ShoppingCart, ChevronDown } from "lucide-react";
import ProductCard from "./ProductCard";
import { FavoriteItem } from "@/types/favorite";
import LoadingState from "@/components/common/LoadingState";
import { useState } from "react";
import FavoriteCategory from "./FavoriteCategory";
import Notification from "@/components/common/Notification/Notification";

export default function FavoritesPage() {
  const { isInitialized } = useAuth();
  const { favorites, isLoading } = useFavorites();
  const { user } = useAuth();
  const [collapsedCategories, setCollapsedCategories] = useState<{
    [key: string]: boolean;
  }>({});
  const [showNotification, setShowNotification] = useState(false);

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleItemRemove = () => {
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2000);
  };

  // Добавляем общую проверку инициализации
  if (!isInitialized) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const totalItems = Object.values(favorites).flat().length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-primary rounded-xl p-6 border border-primary-border">
        {/* Header section */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center">
            <Heart className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Избранные товары</h1>
            <p className="text-secondary-light mt-1">
              {totalItems} {totalItems === 1 ? "товар" : "товаров"} в списке
            </p>
          </div>
        </div>

        {!user && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/30"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-medium mb-1">
                  Сохраните ваши избранные товары!
                </h3>
                <p className="text-secondary-light text-sm">
                  Войдите в аккаунт, чтобы ваш список избранного сохранился и
                  был доступен с любого устройства.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {totalItems === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4">
              <Heart className="w-10 h-10 text-secondary-light" />
            </div>
            <h2 className="text-xl text-white mb-2">Список избранного пуст</h2>
            <p className="text-secondary-light text-center max-w-md">
              Добавляйте товары в избранное, чтобы сохранить их и быстро найти
              при следующем посещении
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {Object.entries(favorites).map(([categoryId, products]) => {
                if (!products.length) return null;
                const categoryName =
                  products[0]?.product?.category?.name || "Категория";

                return (
                  <motion.div
                    key={`category-${categoryId}`}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FavoriteCategory
                      categoryName={categoryName}
                      products={products}
                      onItemRemove={handleItemRemove}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Уведомление на уровне страницы */}
        <Notification
          type="error"
          message="Товар удален из избранного"
          isVisible={showNotification}
          onClose={() => setShowNotification(false)}
        />
      </div>
    </div>
  );
}
