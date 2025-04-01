import { PlusCircleIcon, MinusCircleIcon } from "@heroicons/react/24/outline";
import { useState, useCallback } from "react";
import { useConfigurator } from "@/contexts/ConfiguratorContext";
import { Product } from "@/types/product";
import { AnimatePresence } from "framer-motion";
import Notification from "@/components/common/Notification/Notification";
import { NotificationType } from "../products/ProductCard";
import { useModal } from "@/contexts/ModalContext";

interface ProductActionsProps {
  product: Product;
}

export default function ProductActions({ product }: ProductActionsProps) {
  const { addProduct, removeProduct, getProductByCategory } = useConfigurator();
  const { openReplaceProductModal, closeModal } = useModal();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] =
    useState<NotificationType>("success");

  const isProductInConfiguration = useCallback(() => {
    const existingProduct = getProductByCategory(product.categoryId);
    return existingProduct?.id === product.id;
  }, [getProductByCategory, product.categoryId, product.id]);

  const handleAddOrRemove = async () => {
    try {
      if (isProductInConfiguration()) {
        removeProduct(product.categoryId);
        setNotificationMessage("Товар убран из сборки");
        setNotificationType("error");
        setShowNotification(true);
      } else {
        await addProduct(product);
        setNotificationMessage("Товар добавлен в сборку");
        setNotificationType("success");
        setShowNotification(true);
      }
    } catch (error) {
      if (error instanceof Error && error.message === "REPLACE_CONFLICT") {
        openReplaceProductModal({
          currentProduct: error.cause as Product,
          newProduct: product,
          onConfirm: () => {
            addProduct(product, true);
            setNotificationMessage("Товар успешно заменен");
            setNotificationType("info");
            setShowNotification(true);
            closeModal(); // Закрываем все модальные окна
          },
          onCancel: () => {
            closeModal(); // Закрываем все модальные окна
          },
        });
      }
    }
  };

  const isInConfiguration = isProductInConfiguration();

  return (
    <>
      <div className="mt-6">
        <button
          onClick={handleAddOrRemove}
          className={`
            w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg 
            transition-all duration-300 border 
            ${
              isInConfiguration
                ? "bg-gradient-from/30 hover:bg-gradient-from/40 border-red-500/30 hover:border-red-500/50"
                : "bg-gradient-from/20 hover:bg-gradient-from/30 border-primary-border hover:border-primary-border/50"
            }
          `}
        >
          {isInConfiguration ? (
            <>
              <MinusCircleIcon className="w-5 h-5 text-red-400 group-hover:text-red-300 transition-colors" />
              <span className="text-red-400 group-hover:text-red-300 transition-colors">
                Убрать из конфигурации
              </span>
            </>
          ) : (
            <>
              <PlusCircleIcon className="w-5 h-5 text-secondary-light group-hover:text-white transition-colors" />
              <span className="text-secondary-light group-hover:text-white transition-colors">
                Добавить в конфигурацию
              </span>
            </>
          )}
        </button>
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
