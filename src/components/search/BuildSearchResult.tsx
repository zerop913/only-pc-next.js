"use client";

import Image from "next/image";
import { PcBuildProduct } from "@/types/search";
import { HeartIcon, ShoppingCartIcon } from "@heroicons/react/24/outline";
import { ImageIcon } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useFavorites } from "@/contexts/FavoritesContext";
import Notification from "@/components/common/Notification/Notification";
import { CATEGORY_PRIORITIES, CategorySlug } from "@/config/categoryPriorities";
import { getImageUrl } from "@/lib/utils/imageUtils";

// Карта соответствий slug категорий их названиям
const CATEGORY_NAMES: Record<string, string> = {
  "materinskie-platy": "Материнская плата",
  processory: "Процессор",
  videokarty: "Видеокарта",
  "operativnaya-pamyat": "Оперативная память",
  nakopiteli: "Накопитель",
  "bloki-pitaniya": "Блок питания",
  korpusa: "Корпус",
  kulery: "Кулер",
};

// Функция для получения имени категории по slug
const getCategoryName = (slug: string): string => {
  return CATEGORY_NAMES[slug] || "Компонент";
};

interface BuildSearchResultProps {
  build: PcBuildProduct;
  query: string;
}

export type NotificationType = "success" | "error" | "info";

export default function BuildSearchResult({
  build,
  query,
}: BuildSearchResultProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const { addToCart, isItemInCart } = useCart();
  const { addToFavorites, isFavorite } = useFavorites();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] =
    useState<NotificationType>("success");  const getImagePath = (imageSrc: string | undefined): string => {
    if (!imageSrc) return "/icons/case.svg";
    if (imageSrc.startsWith("http")) return imageSrc;
    const imagePath = imageSrc.startsWith("/") ? imageSrc : `/${imageSrc}`;
    return getImageUrl(imagePath);
  };
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Создаем объект с компонентами для отображения в корзине
    const cartComponents: Record<
      string,
      { name: string; categoryName: string }
    > = {};

    // Преобразуем формат компонентов для корзины
    if (build.components) {
      Object.entries(build.components).forEach(([categorySlug, component]) => {
        if (typeof component === "object" && component !== null) {
          cartComponents[categorySlug] = component;
        } else {
          // Если компонент представлен не как объект, создаем заглушку
          cartComponents[categorySlug] = {
            name: typeof component === "string" ? component : "Компонент",
            categoryName: getCategoryName(categorySlug),
          };
        }
      });
    }

    // Добавляем сборку в корзину
    addToCart({
      id: build.id,
      name: build.title,
      price: build.price,
      image: build.image || undefined,
      slug: build.slug,
      type: "build",
      quantity: 1,
      components: cartComponents,
    });

    setNotificationMessage("Сборка добавлена в корзину");
    setNotificationType("success");
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleAddToFavorites = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await addToFavorites(build.id);

    setNotificationMessage(
      isFavorite(build.id) ? "Удалено из избранного" : "Добавлено в избранное"
    );
    setNotificationType(isFavorite(build.id) ? "error" : "success");
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const ImageComponent = () => (
    <div className="w-full h-full relative bg-gradient-from/30 rounded-lg">
      {build.image ? (
        <>
          <div
            className={`absolute inset-0 backdrop-blur-sm transition-opacity duration-300 ${
              imageLoading ? "opacity-100" : "opacity-0"
            }`}
          />
          <Image
            src={getImagePath(build.image)}
            alt={build.title}
            fill
            className={`
              object-contain rounded-lg transition-opacity duration-300
              ${imageLoading ? "opacity-0" : "opacity-100"}
            `}
            onLoad={() => setImageLoading(false)}
            priority
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center border border-primary-border">
          <ImageIcon className="w-16 h-16 text-secondary-light" />
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="w-full bg-gradient-from/20 rounded-xl border border-primary-border mb-4 group hover:bg-gradient-from/30 transition-all duration-300 cursor-pointer">
        {/* Мобильная версия */}
        <div className="block sm:hidden">
          <div className="flex flex-col">
            <div className="relative w-full h-40 flex-shrink-0 p-4 pb-0">
              <ImageComponent />
            </div>

            <div className="p-4 space-y-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="bg-blue-500 text-xs px-2 py-1 rounded text-white">
                    ГОТОВАЯ СБОРКА
                  </span>
                </div>
                <h3 className="text-lg font-medium text-white group-hover:text-white transition-colors line-clamp-2 mt-2">
                  {build.title}
                </h3>
                {build.description && (
                  <p className="text-secondary-light text-sm mt-2 line-clamp-2 group-hover:text-secondary-light/90 transition-colors">
                    {build.description}
                  </p>
                )}
              </div>

              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-semibold text-white">
                    {build.price.toLocaleString()} ₽
                  </span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleAddToFavorites}
                    className="p-2.5 rounded-lg bg-gradient-from/20 hover:bg-gradient-from/30 transition-all duration-300 border border-primary-border hover:border-primary-border/50 group/btn"
                  >
                    <HeartIcon
                      className={`w-5 h-5 ${
                        isFavorite(build.id)
                          ? "text-red-400"
                          : "text-secondary-light group-hover/btn:text-white"
                      } transition-colors`}
                    />
                  </button>
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-from/20 hover:bg-gradient-from/30 transition-all duration-300 border border-primary-border hover:border-primary-border/50 group/btn"
                  >
                    <ShoppingCartIcon className="w-5 h-5 text-secondary-light group-hover/btn:text-white transition-colors" />
                    <span className="text-secondary-light group-hover/btn:text-white transition-colors">
                      В корзину
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Десктопная версия */}
        <div className="hidden sm:block p-4">
          <div className="flex items-center gap-6">
            <div className="relative w-32 h-32 flex-shrink-0">
              <ImageComponent />
            </div>

            <div className="flex-grow">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-grow">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-blue-500 text-xs px-2 py-1 rounded text-white">
                      ГОТОВАЯ СБОРКА
                    </span>
                  </div>
                  <h3 className="text-white font-semibold text-lg group-hover:text-white transition-colors line-clamp-2">
                    {build.title}
                  </h3>
                  {build.description && (
                    <p className="text-secondary-light text-sm mt-3 line-clamp-2 group-hover:text-secondary-light/90 transition-colors">
                      {build.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-4 flex-shrink-0">
                  <span className="text-xl font-semibold text-white whitespace-nowrap">
                    {build.price.toLocaleString()} ₽
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddToFavorites}
                      className="p-2 rounded-lg bg-gradient-from/20 hover:bg-gradient-from/30 transition-all duration-300 border border-primary-border hover:border-primary-border/50 group/btn"
                      title="Добавить в избранное"
                    >
                      <HeartIcon
                        className={`w-5 h-5 ${
                          isFavorite(build.id)
                            ? "text-red-400"
                            : "text-secondary-light group-hover/btn:text-white"
                        } transition-colors`}
                      />
                    </button>
                    <button
                      onClick={handleAddToCart}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-from/20 hover:bg-gradient-from/30 transition-all duration-300 border border-primary-border hover:border-primary-border/50 group/btn"
                      title="Добавить в корзину"
                    >
                      <ShoppingCartIcon className="w-5 h-5 text-secondary-light group-hover/btn:text-white transition-colors" />
                      <span className="text-secondary-light group-hover/btn:text-white transition-colors">
                        В корзину
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Notification
        type={notificationType}
        message={notificationMessage}
        isVisible={showNotification}
        onClose={() => setShowNotification(false)}
      />
    </>
  );
}
