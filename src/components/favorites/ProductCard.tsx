import Image from "next/image";
import { useRouter } from "next/navigation";
import { FavoriteItem } from "@/types/favorite";
import { Trash2, ImageIcon } from "lucide-react";
import { useFavorites } from "@/contexts/FavoritesContext";
import { useState } from "react";
import Notification from "@/components/common/Notification/Notification";
import { motion } from "framer-motion";
import { getImageUrl } from "@/lib/utils/imageUtils";

interface ProductCardProps {
  favoriteItem: FavoriteItem;
  onRemove?: () => void;
}

export default function ProductCard({
  favoriteItem,
  onRemove,
}: ProductCardProps) {
  const router = useRouter();
  const { removeFromFavorites } = useFavorites();
  const [imageLoading, setImageLoading] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [isRemoving, setIsRemoving] = useState(false);

  // Получаем данные о продукте из favoriteItem
  const product = favoriteItem?.product;

  // Проверка, что favoriteItem и product существуют и имеют id
  if (!favoriteItem || !favoriteItem.id || !product || !product.id) {
    console.error("Invalid favorite item data:", favoriteItem);
    return null;
  }

  const handleClick = () => {
    if (isRemoving || !product) return;
    router.push(
      `/product/${product.slug}?category=${product.category?.slug || ""}`
    );
  };
  const handleRemoveFromFavorites = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isRemoving) return;

    try {
      setIsRemoving(true);

      // Сначала вызываем onRemove для анимации удаления элемента
      // до фактического удаления из контекста
      if (onRemove) {
        onRemove();
      }

      // Запускаем удаление из API
      removeFromFavorites(favoriteItem.id);

      // Показываем уведомление
      setNotificationMessage("Товар удален из избранного");
      setShowNotification(true);

      setTimeout(() => {
        setShowNotification(false);
      }, 2000);
    } catch (error) {
      console.error("Error removing from favorites:", error);
      setIsRemoving(false);
    }
  };
  // Обрабатываем путь к изображению
  const getImagePath = (): string => {
    if (!product.image) return "";

    // Проверяем, является ли путь к изображению абсолютным URL
    if (product.image.startsWith("http")) {
      return product.image;
    }

    // Добавляем слеш в начале, если его нет
    const imagePath = product.image.startsWith("/")
      ? product.image
      : `/${product.image}`;

    // Используем функцию getImageUrl для автоматической конвертации в Cloudinary
    return getImageUrl(imagePath);
  };

  return (
    <>
      {" "}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -20 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
          mass: 0.8,
        }}
        onClick={handleClick}
        className="group relative bg-gradient-from/10 rounded-xl border border-primary-border overflow-hidden transition-all duration-300 hover:bg-gradient-from/20 hover:border-blue-500/30 cursor-pointer"
      >
        {/* Декоративная полоска */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Область изображения */}
        <div className="aspect-square relative bg-gradient-from/20 overflow-hidden border-b border-primary-border/50">
          {product.image ? (
            <>
              <div
                className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 backdrop-blur-sm ${
                  imageLoading ? "opacity-100" : "opacity-0"
                }`}
              >
                <div className="animate-pulse w-12 h-12 rounded-full bg-gradient-from/30" />
              </div>
              <div className="w-full h-full flex items-center justify-center p-6">
                <Image
                  src={getImagePath()}
                  alt={product.title}
                  width={200}
                  height={200}
                  className={`
                    object-contain w-full h-full transition-all duration-300
                    ${
                      imageLoading
                        ? "opacity-0"
                        : "opacity-100 group-hover:scale-[1.02]"
                    }
                  `} // Уменьшен эффект приближения изображения
                  onLoadingComplete={() => setImageLoading(false)}
                  onError={() => {
                    console.error(`Image failed to load: ${product.image}`);
                    setImageLoading(false);
                  }}
                />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-16 h-16 text-secondary-light/30" />
            </div>
          )}

          {/* Кнопка удаления */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleRemoveFromFavorites}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/60 backdrop-blur-sm text-red-400 hover:text-red-300 hover:bg-black/80 transition-colors duration-300 opacity-0 group-hover:opacity-100"
            title="Удалить из избранного"
            disabled={isRemoving}
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>

          {/* Метка категории - удалена для отображения только при наведении */}
        </div>

        {/* Информация о товаре */}
        <div className="p-4 space-y-3">
          <h3 className="text-white font-medium line-clamp-2 leading-snug group-hover:text-blue-400 transition-colors duration-300">
            {product.title}
          </h3>

          {product.brand && (
            <div className="text-sm text-secondary-light/80">
              {product.brand}
            </div>
          )}

          <div className="pt-2 border-t border-primary-border/30">
            <div className="text-xs text-secondary-light mb-1">Цена:</div>
            <div className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
              {product.price.toLocaleString()} ₽
            </div>
          </div>
        </div>
      </motion.div>{" "}
      <Notification
        type="success"
        message={notificationMessage}
        isVisible={showNotification}
        onClose={() => setShowNotification(false)}
      />
    </>
  );
}
