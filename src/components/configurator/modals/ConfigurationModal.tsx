import { AnimatePresence, motion } from "framer-motion";
import { XMarkIcon, CheckIcon } from "@heroicons/react/24/outline";
import { Category } from "@/types/category";
import {
  SelectedProduct,
  useConfigurator,
} from "@/contexts/ConfiguratorContext";
import { Product } from "@/types/product";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface ConfigurationModalProps {
  categories: Category[];
  selectedProducts: SelectedProduct[];
  progress: number;
  isComplete: boolean;
  onClose: () => void;
}

export default function ConfigurationModal({
  categories,
  selectedProducts,
  progress,
  isComplete,
  onClose,
}: ConfigurationModalProps) {
  const router = useRouter();
  const { clearConfiguration } = useConfigurator();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const totalPrice = selectedProducts.reduce(
    (sum, item) => sum + item.product.price,
    0
  );

  // Функция для создания URL товара
  const getProductUrl = (product: Product, category: Category) => {
    const baseUrl = `/product/${product.slug}?category=${category.slug}`;
    const subcategory = category.children?.find(
      (sub) => sub.id === product.categoryId
    );
    return subcategory ? `${baseUrl}&subcategory=${subcategory.slug}` : baseUrl;
  };

  // Следим за изменениями в selectedProducts
  useEffect(() => {
    // Если все товары удалены, закрываем модальное окно
    if (selectedProducts.length === 0) {
      onClose();
    }
  }, [selectedProducts, onClose]);

  const handleClearConfiguration = () => {
    clearConfiguration();
    setShowClearConfirm(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        className="relative z-10 w-full max-w-2xl bg-primary rounded-xl shadow-xl border border-primary-border"
        variants={{
          hidden: { opacity: 0, scale: 0.95 },
          visible: { opacity: 1, scale: 1 },
        }}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        <div className="p-6">
          {/* Заголовок с кнопкой очистки */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-semibold text-white">Ваша сборка</h2>
              <p className="text-secondary-light mt-1">
                {selectedProducts.length} из {categories.length} компонентов
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="px-3 py-1.5 text-sm text-secondary-light hover:text-white bg-gradient-from/20 hover:bg-gradient-from/30 rounded-lg border border-primary-border transition-all duration-300"
                >
                  Очистить
                </button>

                <AnimatePresence>
                  {showClearConfirm && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full mt-2 w-64 p-4 bg-primary rounded-lg border border-primary-border shadow-xl z-50"
                    >
                      <p className="text-sm text-white mb-3">
                        Вы уверены, что хотите очистить конфигурацию?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={handleClearConfiguration}
                          className="flex-1 px-3 py-1.5 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-md border border-red-500/20 transition-all duration-300"
                        >
                          Очистить
                        </button>
                        <button
                          onClick={() => setShowClearConfirm(false)}
                          className="flex-1 px-3 py-1.5 text-sm bg-gradient-from/20 hover:bg-gradient-from/30 text-secondary-light hover:text-white rounded-md border border-primary-border transition-all duration-300"
                        >
                          Отмена
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <button
                onClick={onClose}
                className="text-secondary-light hover:text-white transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Уведомление о завершении */}
          {isComplete && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg border border-green-500/20"
            >
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                  <CheckIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">
                    Сборка завершена!
                  </h3>
                  <p className="text-secondary-light text-sm">
                    Все необходимые компоненты выбраны
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Список компонентов с кликабельными товарами */}
          <div className="space-y-2.5">
            {categories.map((category) => {
              const selected = selectedProducts.find(
                (p) =>
                  category.id === p.product.categoryId ||
                  category.children?.some(
                    (sub) => sub.id === p.product.categoryId
                  )
              );

              return (
                <div
                  key={category.id}
                  className={`p-4 rounded-lg border transition-all duration-300 ${
                    selected
                      ? "bg-gradient-from/30 border-blue-500/30"
                      : "bg-gradient-from/10 border-primary-border"
                  }`}
                >
                  <div className="flex items-center gap-4 justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-shrink">
                      <div
                        className={`w-2 h-2 flex-shrink-0 rounded-full ${
                          selected ? "bg-blue-500" : "bg-secondary-light"
                        }`}
                      />
                      <span className="text-white font-medium truncate">
                        {category.name}
                      </span>
                    </div>
                    {selected && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            getProductUrl(selected.product, category)
                          );
                        }}
                        className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity ml-auto flex-shrink-0"
                      >
                        <span className="text-sm text-secondary-light hover:text-white transition-colors truncate max-w-[300px]">
                          {selected.product.title}
                        </span>
                        <span className="text-sm text-blue-400 font-medium flex-shrink-0">
                          {selected.product.price.toLocaleString()} ₽
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Прогресс и итоговая цена */}
          <div className="mt-6 pt-6 border-t border-primary-border">
            <div className="flex justify-between items-center mb-4">
              <div className="text-secondary-light">Общий прогресс</div>
              <div className="text-white font-medium">
                {progress.toFixed(0)}%
              </div>
            </div>
            <div className="h-2 bg-gradient-from/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-primary-border">
              <span className="text-secondary-light">Итоговая стоимость</span>
              <span className="text-xl font-semibold text-white">
                {totalPrice.toLocaleString()} ₽
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
