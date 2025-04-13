import { useEffect, useState } from "react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { FavoriteProduct } from "@/types/favorite";
import FavoriteCategory from "./FavoriteCategory";
import { motion } from "framer-motion";
import { HeartIcon } from "@heroicons/react/24/outline";
import { Heart } from "lucide-react";
import Link from "next/link";

export default function FavoritesPage() {
  const { favorites, isLoading } = useFavorites();
  const [groupedFavorites, setGroupedFavorites] = useState<{
    [key: string]: FavoriteProduct[];
  }>({});
  const [totalFavorites, setTotalFavorites] = useState(0);

  useEffect(() => {
    console.log("Favorites data:", favorites);

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
          {} as Record<string, FavoriteProduct[]>
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
        const grouped = favorites.reduce((acc, item) => {
          const categoryName = item.product?.category?.name || "Другое";
          if (!acc[categoryName]) {
            acc[categoryName] = [];
          }
          acc[categoryName].push(item);
          return acc;
        }, {} as Record<string, FavoriteProduct[]>);

        setGroupedFavorites(grouped);
        setTotalFavorites(favorites.length);
      } catch (error) {
        console.error("Error grouping favorites array:", error);
        setGroupedFavorites({});
        setTotalFavorites(0);
      }
    } else {
      console.error("Favorites is neither object nor array:", favorites);
      setGroupedFavorites({});
      setTotalFavorites(0);
    }
  }, [favorites]);

  // Проверка наличия товаров в избранном
  const hasFavorites = totalFavorites > 0;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12 min-h-[300px]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-4 border-t-blue-400 border-primary-border animate-spin mb-4"></div>
          <p className="text-secondary-light">Загрузка избранного...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-primary rounded-xl p-6 border border-primary-border shadow-xl">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-from/20 rounded-lg border border-primary-border">
                <Heart className="w-5 h-5 text-red-400" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Избранное
              </h1>
            </div>
            <div className="text-sm px-3 py-1.5 bg-gradient-from/10 rounded-lg border border-primary-border text-secondary-light">
              {hasFavorites
                ? `${totalFavorites} ${
                    totalFavorites === 1
                      ? "товар"
                      : totalFavorites < 5
                      ? "товара"
                      : "товаров"
                  }`
                : "Нет товаров"}
            </div>
          </div>

          <div className="py-3 px-4 bg-gradient-from/10 border border-primary-border rounded-lg flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-from/20 flex items-center justify-center">
              <HeartIcon className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-secondary-light text-sm">
              Здесь отображаются все товары, которые вы добавили в избранное. Вы
              можете быстро перейти к ним или удалить из списка.
            </p>
          </div>
        </div>

        {hasFavorites ? (
          <div className="space-y-8">
            {Object.keys(groupedFavorites).length > 0 ? (
              Object.entries(groupedFavorites).map(([categoryName, items]) => (
                <FavoriteCategory
                  key={categoryName}
                  name={categoryName}
                  favoriteItems={items}
                />
              ))
            ) : (
              <div className="text-center py-8 text-secondary-light">
                Ошибка группировки товаров. Пожалуйста, обновите страницу.
              </div>
            )}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-16 h-16 bg-gradient-from/20 rounded-full flex items-center justify-center mb-4 border border-primary-border">
              <HeartIcon className="w-8 h-8 text-secondary-light" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">
              Список избранного пуст
            </h3>
            <p className="text-secondary-light mb-6 max-w-md">
              Вы еще не добавили ни одного товара в избранное. Добавляйте
              товары, которые вам понравились, чтобы быстро к ним вернуться.
            </p>
            <Link
              href="/configurator"
              className="px-5 py-2.5 bg-gradient-from/20 hover:bg-gradient-from/30 transition-all duration-300 rounded-lg border border-primary-border text-white"
            >
              Перейти в каталог
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}
