import Image from "next/image";
import { Product } from "@/types/product";
import {
  HeartIcon,
  PlusCircleIcon,
  MinusCircleIcon,
} from "@heroicons/react/24/outline";
import { ImageIcon } from "lucide-react";
import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useConfigurator } from "@/contexts/ConfiguratorContext";
import { AnimatePresence } from "framer-motion";
import ReplaceProductModal from "@/components/modals/configurator/ReplaceProductModal";
import Notification from "@/components/common/Notification/Notification";
import { useFavorites } from "@/contexts/FavoritesContext";
import { getImageUrl } from "@/lib/utils/imageUtils";

interface ProductCardProps {
  product: Product;
  onAddToFavorites: (productId: number) => void;
  onAddToConfiguration?: (productId: number) => void;
}

export type NotificationType = "success" | "error" | "info";

export default function ProductCard({
  product,
  onAddToFavorites,
  onAddToConfiguration,
}: ProductCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [imageLoading, setImageLoading] = useState(true);
  const { addProduct, removeProduct, getProductByCategory } = useConfigurator();
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [conflictingProduct, setConflictingProduct] = useState<Product | null>(
    null
  );
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] =
    useState<NotificationType>("success");
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const [showFavNotification, setShowFavNotification] = useState(false);

  const isProductInConfiguration = useCallback(() => {
    const existingProduct = getProductByCategory(product.categoryId);
    return existingProduct?.id === product.id;
  }, [getProductByCategory, product.categoryId, product.id]);

  const categorySlug = searchParams.get("category") || "";
  const subcategorySlug = searchParams.get("subcategory") || "";
  const pageParam = searchParams.get("page") || "";

  const getImagePath = (imageSrc: string | undefined): string => {
    if (!imageSrc) return "";
    const imagePath = imageSrc.startsWith("/") ? imageSrc : `/${imageSrc}`;
    const result = getImageUrl(imagePath);

    // Отладочная информация для первых нескольких продуктов
    if (process.env.NODE_ENV === "development") {
      console.log(`🔍 ProductCard[${product.id}]: ${imagePath} -> ${result}`);
    }

    return result;
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Предотвращаем клик по карточке, если клик был на кнопках
    if ((e.target as Element).closest("button")) {
      return;
    }

    let url = `/product/${product.slug}?category=${categorySlug}`;
    if (subcategorySlug) {
      url += `&subcategory=${subcategorySlug}`;
    }
    if (pageParam) {
      url += `&page=${pageParam}`;
    }

    router.push(url);
  };

  const handleAddOrRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Закрываем предыдущее уведомление, если оно есть
    if (showNotification) {
      setShowNotification(false);
      await new Promise((resolve) => setTimeout(resolve, 100)); // Небольшая задержка для анимации
    }

    try {
      if (isProductInConfiguration()) {
        removeProduct(product.categoryId);
        setNotificationMessage("Товар убран из сборки");
        setNotificationType("error");
      } else {
        await addProduct(product);
        setNotificationMessage("Товар добавлен в сборку");
        setNotificationType("success");
      }
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    } catch (error) {
      if (error instanceof Error && error.message === "REPLACE_CONFLICT") {
        setConflictingProduct(error.cause as Product);
        setShowReplaceModal(true);
      }
    }
  };

  const handleAddToFavorites = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await addToFavorites(product.id);

    setShowFavNotification(true);
    setNotificationType(isFavorite(product.id) ? "error" : "success");
    setNotificationMessage(
      isFavorite(product.id) ? "Удалено из избранного" : "Добавлено в избранное"
    );

    setTimeout(() => setShowFavNotification(false), 2000);
  };

  const ImageComponent = () => (
    <div className="w-full h-full relative bg-gradient-from/30 rounded-lg">
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
      <div
        className="w-full bg-gradient-from/20 rounded-xl border border-primary-border mb-4 group hover:bg-gradient-from/30 transition-all duration-300 cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Мобильная версия */}
        <div className="block sm:hidden">
          <div className="flex flex-col">
            <div className="relative w-full h-40 flex-shrink-0 p-4 pb-0">
              <ImageComponent />
            </div>

            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-lg font-medium text-white group-hover:text-white transition-colors line-clamp-2">
                  {product.title}
                </h3>
                {product.description && (
                  <p className="text-secondary-light text-sm mt-2 line-clamp-2 group-hover:text-secondary-light/90 transition-colors">
                    {product.description}
                  </p>
                )}
              </div>

              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-semibold text-white">
                    {product.price.toLocaleString()} ₽
                  </span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleAddToFavorites}
                    className="p-2.5 rounded-lg bg-gradient-from/20 hover:bg-gradient-from/30 transition-all duration-300 border border-primary-border hover:border-primary-border/50 group/btn"
                  >
                    <HeartIcon
                      className={`w-5 h-5 ${
                        isFavorite(product.id)
                          ? "text-red-400"
                          : "text-secondary-light group-hover/btn:text-white"
                      } transition-colors`}
                    />
                  </button>
                  <button
                    onClick={handleAddOrRemove}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-from/20 hover:bg-gradient-from/30 transition-all duration-300 border border-primary-border hover:border-primary-border/50 group/btn"
                  >
                    {isProductInConfiguration() ? (
                      <>
                        <MinusCircleIcon className="w-5 h-5 text-red-400 group-hover/btn:text-red-300 transition-colors" />
                        <span className="text-red-400 group-hover/btn:text-red-300 transition-colors">
                          Убрать
                        </span>
                      </>
                    ) : (
                      <>
                        <PlusCircleIcon className="w-5 h-5 text-secondary-light group-hover/btn:text-white transition-colors" />
                        <span className="text-secondary-light group-hover/btn:text-white transition-colors">
                          Добавить
                        </span>
                      </>
                    )}
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
                  <h3 className="text-white font-semibold text-lg group-hover:text-white transition-colors line-clamp-2">
                    {product.title}
                  </h3>
                  {product.description && (
                    <p className="text-secondary-light text-sm mt-3 line-clamp-2 group-hover:text-secondary-light/90 transition-colors">
                      {product.description}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-4 flex-shrink-0">
                  <span className="text-xl font-semibold text-white whitespace-nowrap">
                    {product.price.toLocaleString()} ₽
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddToFavorites}
                      className="p-2 rounded-lg bg-gradient-from/20 hover:bg-gradient-from/30 transition-all duration-300 border border-primary-border hover:border-primary-border/50 group/btn"
                      title="Добавить в избранное"
                    >
                      <HeartIcon
                        className={`w-5 h-5 ${
                          isFavorite(product.id)
                            ? "text-red-400"
                            : "text-secondary-light group-hover/btn:text-white"
                        } transition-colors`}
                      />
                    </button>
                    <button
                      onClick={handleAddOrRemove}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-from/20 hover:bg-gradient-from/30 transition-all duration-300 border border-primary-border hover:border-primary-border/50 group/btn"
                      title={
                        isProductInConfiguration()
                          ? "Убрать из конфигурации"
                          : "Добавить в конфигурацию"
                      }
                    >
                      {isProductInConfiguration() ? (
                        <>
                          <MinusCircleIcon className="w-5 h-5 text-red-400 group-hover/btn:text-red-300 transition-colors" />
                          <span className="text-red-400 group-hover/btn:text-red-300 transition-colors">
                            Убрать
                          </span>
                        </>
                      ) : (
                        <>
                          <PlusCircleIcon className="w-5 h-5 text-secondary-light group-hover/btn:text-white transition-colors" />
                          <span className="text-secondary-light group-hover/btn:text-white transition-colors">
                            Добавить
                          </span>
                        </>
                      )}
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

      <Notification
        type={notificationType}
        message={notificationMessage}
        isVisible={showFavNotification}
        onClose={() => setShowFavNotification(false)}
      />

      <AnimatePresence>
        {showReplaceModal && conflictingProduct && (
          <ReplaceProductModal
            currentProduct={conflictingProduct}
            newProduct={product}
            onConfirm={() => {
              addProduct(product, true);
              setShowReplaceModal(false);
              setNotificationMessage("Товар успешно заменен");
              setNotificationType("info");
              setShowNotification(true);
              setTimeout(() => setShowNotification(false), 3000);
            }}
            onCancel={() => {
              setShowReplaceModal(false);
              setConflictingProduct(null);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
