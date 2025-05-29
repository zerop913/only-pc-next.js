import { useEffect, useState, useRef } from "react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { FavoriteItem } from "@/types/favorite";
import FavoriteCategory from "./FavoriteCategory";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartIcon,
  ShoppingBagIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { Heart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function FavoritesPage() {
  const router = useRouter();
  const { favorites, isLoading, clearAllFavorites } = useFavorites();
  const [groupedFavorites, setGroupedFavorites] = useState<{
    [key: string]: FavoriteItem[];
  }>({});
  const [totalFavorites, setTotalFavorites] = useState(0);
  const [isClearing, setIsClearing] = useState(false);
  
  // Отслеживаем, была ли выполнена обработка данных
  const processingRef = useRef(false);

  useEffect(() => {
    if (processingRef.current && !isLoading && Object.keys(groupedFavorites).length > 0) {
      return; // Если данные уже обработаны и отображены, не делаем повторную обработку
    }
    
    processingRef.current = true;

    console.log("Processing favorites data:", favorites);

    // Проверяем, что favorites является объектом с ключами и значениями
    if (
      favorites &&
      typeof favorites === "object" &&
      !Array.isArray(favorites)
    ) {
      // Если структура данных соответствует { categoryId: [favorites] }
      try {
        const mapped = Object.entries(favorites).reduce(
          (acc, [categoryId, items]) => {
            if (Array.isArray(items) && items.length > 0) {
              // Получаем имя категории из первого товара (если есть)
              const categoryName =
                items[0]?.product?.category?.name || `Категория ${categoryId}`;
              acc[categoryName] = items;
            }
            return acc;
          },
          {} as Record<string, FavoriteItem[]>
        );

        setGroupedFavorites(mapped);

        // Считаем общее количество товаров
        const total = Object.values(favorites).reduce(
          (count, items) => count + (Array.isArray(items) ? items.length : 0),
          0
        );
        setTotalFavorites(total);
      } catch (error) {
        console.error("Error processing favorites:", error);
        setGroupedFavorites({});
        setTotalFavorites(0);
      }
    } else if (Array.isArray(favorites)) {
      // Если favorites - это массив (на случай, если формат API изменится)
      try {
        const grouped = favorites.reduce(
          (acc, item) => {
            const categoryName = item.product?.category?.name || "Другое";
            if (!acc[categoryName]) {
              acc[categoryName] = [];
            }
            acc[categoryName].push(item);
            return acc;
          },
          {} as Record<string, FavoriteItem[]>
        );

        setGroupedFavorites(grouped);
        setTotalFavorites(favorites.length);
      } catch (error) {
        console.error("Error grouping favorites array:", error);
        setGroupedFavorites({});
        setTotalFavorites(0);
      }    } else {
      console.error("Favorites is neither object nor array:", favorites);
      setGroupedFavorites({});
      setTotalFavorites(0);
    }
  }, [favorites, isLoading]);

  // Проверка наличия товаров в избранном
  const hasFavorites = totalFavorites > 0;
  // Функция очистки всех избранных товаров с анимацией
  const handleClearAll = () => {
    setIsClearing(true);
    
    // Сначала очищаем локальное состояние для анимации
    setGroupedFavorites({});
    setTotalFavorites(0);
    
    // Затем вызываем API для очистки на сервере
    setTimeout(() => {
      clearAllFavorites();
      setIsClearing(false);
    }, 500); // Даем время для анимации
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-pulse flex flex-col items-center py-20">
          <div className="w-14 h-14 rounded-full border-4 border-t-blue-400 border-primary-border animate-spin mb-6"></div>
          <p className="text-lg text-secondary-light">Загрузка избранного...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-6"
      >
        <div className="flex items-center gap-2 mb-2">
          <Heart className="w-5 h-5 text-red-400" />
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Избранные товары
          </h1>
        </div>
        <p className="text-secondary-light">
          Здесь собраны товары, которые вы отметили как избранные
        </p>
      </motion.div>

      <div>
        <motion.div
          className="lg:col-span-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          {hasFavorites ? (
            <div className="bg-gradient-from/10 rounded-xl border border-primary-border overflow-hidden">
              <div className="p-5 border-b border-primary-border/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <HeartIcon className="w-5 h-5 text-red-400/70" />
                  <h2 className="text-xl font-semibold text-white">
                    Избранные товары
                  </h2>
                  <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-sm rounded-full border border-red-500/20">
                    {totalFavorites}
                  </span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className={`p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 ${
                    isClearing ? "opacity-50 pointer-events-none" : ""
                  }`}
                  onClick={handleClearAll}
                  disabled={isClearing}
                  title="Очистить избранное"
                >
                  <TrashIcon className="w-5 h-5" />
                </motion.button>
              </div>              <motion.div className="space-y-4 p-4" layout>
                <AnimatePresence mode="popLayout">
                  {Object.entries(groupedFavorites).map(
                    ([categoryName, items]) => (
                      <motion.div 
                        key={categoryName}
                        layout 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{
                          layout: { type: "spring", stiffness: 300, damping: 30 }
                        }}
                      >
                        <FavoriteCategory
                          name={categoryName}
                          favoriteItems={items}
                        />
                      </motion.div>
                    )
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Нижний блок со ссылкой на каталог */}
              <div className="p-5 border-t border-primary-border/50 flex justify-between items-center">
                <div className="text-secondary-light text-sm">
                  Хотите посмотреть больше товаров?
                </div>
                <motion.a
                  href="/catalog"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-from/30 hover:bg-gradient-from/40 text-white rounded-lg border border-primary-border transition-all duration-300"
                >
                  <ShoppingBagIcon className="w-4 h-4" />
                  <span>Перейти в каталог</span>
                </motion.a>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-from/10 rounded-xl border border-primary-border overflow-hidden p-10"
            >
              <div className="flex flex-col items-center justify-center text-center py-10">
                <div className="w-20 h-20 bg-gradient-from/20 rounded-full flex items-center justify-center mb-6 border border-primary-border">
                  <HeartIcon className="w-10 h-10 text-red-400/50" />
                </div>
                <h3 className="text-2xl font-medium text-white mb-3">
                  У вас пока нет избранных товаров
                </h3>
                <p className="text-secondary-light mb-8 max-w-md">
                  Добавляйте понравившиеся товары в избранное, нажимая на иконку
                  сердечка. Это поможет вам быстро найти их позже.
                </p>

                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Link
                    href="/configurator"
                    className="flex items-center gap-2 px-5 py-3 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-white border border-blue-500/30 transition-all"
                  >
                    <ShoppingBagIcon className="w-5 h-5" />
                    Перейти в конфигуратор
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
