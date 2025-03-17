import Image from "next/image";
import { useRouter } from "next/navigation";
import { FavoriteProduct } from "@/types/favorite";
import { Trash2, ImageIcon } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useState } from "react";
import Notification from "@/components/common/Notification/Notification";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: FavoriteProduct;
  onRemove?: () => void;
}

export default function ProductCard({ product, onRemove }: ProductCardProps) {
  const router = useRouter();
  const { removeFromFavorites } = useFavorites();
  const [imageLoading, setImageLoading] = useState(true);
  const [showNotification, setShowNotification] = useState(false);

  const handleClick = () => {
    router.push(
      `/product/${product.slug}?category=${product.category?.slug || ""}`
    );
  };

  const handleRemoveFromFavorites = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      // Сначала вызываем колбэк для уведомления
      onRemove?.();
      // Добавляем небольшую задержку перед удалением
      await new Promise((resolve) => setTimeout(resolve, 100));
      await removeFromFavorites(product.id);
    } catch (error) {
      console.error("Error removing from favorites:", error);
    }
  };

  const getImagePath = (imageSrc: string | undefined): string => {
    if (!imageSrc) return "";
    return imageSrc.startsWith("/") ? imageSrc : `/${imageSrc}`;
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 1, height: "auto" }}
        exit={{
          opacity: 0,
          height: 0,
          marginTop: 0,
          marginBottom: 0,
          transition: {
            opacity: { duration: 0.2 },
            height: { duration: 0.2, delay: 0.1 },
            marginTop: { duration: 0.2 },
            marginBottom: { duration: 0.2 },
          },
        }}
        className="mb-4 last:mb-0"
      >
        <div className="group bg-gradient-from/30 hover:bg-gradient-from/40 rounded-lg border border-primary-border/50 transition-all duration-300">
          <div className="flex flex-col sm:flex-row gap-4 p-4">
            {/* Изображение */}
            <div className="relative w-full sm:w-48 h-48 sm:h-36 flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-from/20 rounded-lg" />
              {product.image ? (
                <>
                  <div
                    className={`absolute inset-0 backdrop-blur-sm transition-opacity duration-300 ${
                      imageLoading ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  <Image
                    src={getImagePath(product.image)}
                    alt={product.title}
                    fill
                    className={`object-contain rounded-lg transition-all duration-300 ${
                      imageLoading ? "opacity-0" : "opacity-100"
                    }`}
                    onLoad={() => setImageLoading(false)}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center rounded-lg border border-primary-border/50">
                  <ImageIcon className="w-8 h-8 text-secondary-light" />
                </div>
              )}
            </div>

            {/* Информация о товаре */}
            <div className="flex flex-col flex-grow min-w-0">
              <div className="flex-grow">
                {/* Верхняя часть с брендом и кнопкой удаления */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  {product.brand && (
                    <span className="text-sm text-secondary-light">
                      {product.brand}
                    </span>
                  )}
                  <button
                    onClick={handleRemoveFromFavorites}
                    className="p-2 rounded-lg bg-gradient-from/20 hover:bg-red-500/20 transition-all duration-300 border border-primary-border hover:border-red-500/30"
                    title="Удалить из избранного"
                  >
                    <Trash2 className="w-5 h-5 text-secondary-light hover:text-red-400 transition-colors" />
                  </button>
                </div>

                {/* Название и описание */}
                <h3
                  onClick={handleClick}
                  className="text-lg font-medium text-white hover:text-blue-400 transition-colors duration-300 mb-2 cursor-pointer line-clamp-2"
                >
                  {product.title}
                </h3>
                {product.description && (
                  <p className="text-sm text-secondary-light line-clamp-2 mb-4">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Цена и характеристики */}
              <div className="mt-auto">
                {product.characteristics &&
                  product.characteristics.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                      {product.characteristics
                        .slice(0, 4)
                        .map((char, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <span className="text-secondary-light">
                              {char.type}:
                            </span>
                            <span className="text-white">{char.value}</span>
                          </div>
                        ))}
                    </div>
                  )}
                <div className="flex items-center justify-between pt-3 border-t border-primary-border">
                  <span className="text-2xl font-semibold text-white">
                    {product.price.toLocaleString()} ₽
                  </span>
                  <button
                    onClick={handleClick}
                    className="px-4 py-2 rounded-lg bg-gradient-from/20 hover:bg-gradient-from/30 text-secondary-light hover:text-white transition-all duration-300 border border-primary-border text-sm"
                  >
                    Подробнее
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <Notification
        type="error"
        message="Удалено из избранного"
        isVisible={showNotification}
        onClose={() => setShowNotification(false)}
      />
    </>
  );
}
