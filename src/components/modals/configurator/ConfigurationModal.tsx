// (переместить существующий код ConfigurationModal сюда)
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
import SaveBuildModal from "./SaveBuildModal";
import { useModal } from "@/contexts/ModalContext";

interface ConfigurationModalProps {
  categories: Category[];
  selectedProducts: SelectedProduct[];
  progress: number;
  isComplete: boolean;
  onClose: () => void;
  editingBuildName?: string | null; // Обновляем тип, чтобы он мог принимать null
  editingBuildSlug?: string | null; // Добавляем slug редактируемой сборки
}

export default function ConfigurationModal({
  categories,
  selectedProducts,
  progress,
  isComplete,
  onClose,
  editingBuildName,
  editingBuildSlug,
}: ConfigurationModalProps) {
  const router = useRouter();
  const { clearConfiguration } = useConfigurator();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const {
    openSaveBuildModal,
    openReplaceProductModal,
    closeConfigurationModal,
  } = useModal();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // Проверяем авторизацию при монтировании
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check");
        const data = await response.json();
        setIsAuthenticated(data.isAuthenticated);
      } catch (error) {
        console.error("Error checking auth:", error);
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

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

  const handleSaveBuild = async (name: string) => {
    try {
      const components = selectedProducts.reduce((acc, selected) => {
        const category = categories.find(
          (cat) =>
            cat.id === selected.categoryId ||
            cat.children?.some((sub) => sub.id === selected.categoryId)
        );

        if (category) {
          const rootCategory =
            categories.find((c) =>
              c.children?.some((sub) => sub.id === selected.categoryId)
            ) || category;

          acc[rootCategory.slug] = selected.product.slug;
        }
        return acc;
      }, {} as Record<string, string>);

      console.log("Sending data:", { name, components });

      const response = await fetch("/api/builds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          components,
          isEditing: !!editingBuildName,
          buildSlug: editingBuildSlug, // Добавляем slug редактируемой сборки
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server response:", errorData);
        throw new Error(errorData.error || "Failed to save build");
      }

      const result = await response.json();
      console.log("Server response:", result);

      onClose();
      router.push(`/catalog`);
    } catch (error: any) {
      console.error("Error saving build:", error);
      throw new Error(error.message || "Ошибка при сохранении сборки");
    }
  };

  const handleSaveClick = () => {
    openSaveBuildModal({
      onClose: () => setShowSaveModal(false),
      onSave: handleSaveBuild,
      initialName: editingBuildName || "",
      isEditing: !!editingBuildName,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center sm:p-4">
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {isMobile ? (
        <motion.div
          className="relative z-10 w-full h-[100dvh] bg-primary"
          variants={{
            hidden: { opacity: 0, y: "100%" },
            visible: { opacity: 1, y: 0 },
          }}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          <div className="flex flex-col h-full">
            {/* Заголовок */}
            <div className="sticky top-0 z-20 bg-primary p-4 border-b border-primary-border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    Ваша сборка
                  </h2>
                  <p className="text-secondary-light text-sm mt-1">
                    {selectedProducts.length} из {categories.length} компонентов
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="px-3 py-1.5 text-sm text-secondary-light bg-gradient-from/20 rounded-lg border border-primary-border"
                  >
                    Очистить
                  </button>
                  <button onClick={onClose} className="p-2">
                    <XMarkIcon className="w-6 h-6 text-secondary-light" />
                  </button>
                </div>
              </div>
            </div>

            {/* Основной контент */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-4">
                {/* Уведомление о завершении */}
                {isComplete && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="p-3 sm:p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg border border-green-500/20">
                      <div className="flex items-start sm:items-center gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                          <CheckIcon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-grow">
                          <h3 className="text-sm sm:text-base font-medium text-white">
                            Сборка завершена!
                          </h3>
                          <p className="text-xs text-secondary-light">
                            Все необходимые компоненты выбраны
                          </p>
                        </div>
                        <button
                          onClick={handleSaveClick}
                          className="px-3 py-1.5 text-sm bg-blue-500/10 hover:bg-blue-500/20 
                                    text-blue-400 hover:text-blue-300 rounded-md 
                                    border border-blue-500/30 transition-all duration-300"
                        >
                          Сохранить
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Список компонентов */}
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
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 justify-between">
                          <div className="flex items-center gap-3 min-w-0">
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
                              className="flex items-center justify-between sm:justify-end gap-3 cursor-pointer hover:opacity-80 transition-opacity pl-5"
                            >
                              <span className="text-sm text-secondary-light hover:text-white transition-colors truncate max-w-[200px] sm:max-w-[300px]">
                                {selected.product.title}
                              </span>
                              <span className="text-sm text-blue-400 font-medium whitespace-nowrap flex-shrink-0">
                                {selected.product.price.toLocaleString()} ₽
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Футер */}
            <div className="sticky bottom-0 bg-primary border-t border-primary-border">
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-secondary-light text-sm">
                    Общий прогресс
                  </div>
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
                <div className="flex justify-between items-center pt-4 border-t border-primary-border">
                  <span className="text-secondary-light">
                    Итоговая стоимость
                  </span>
                  <span className="text-xl font-semibold text-white">
                    {totalPrice.toLocaleString()} ₽
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        // Десктопная версия
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
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  Ваша сборка
                </h2>
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

            {isComplete && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <div className="p-3 sm:p-4 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg border border-green-500/20">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                      <CheckIcon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-sm sm:text-base font-medium text-white">
                        Сборка завершена!
                      </h3>
                      <p className="text-xs text-secondary-light">
                        Все необходимые компоненты выбраны
                      </p>
                    </div>
                    <button
                      onClick={handleSaveClick}
                      className="px-3 py-1.5 text-sm bg-blue-500/10 hover:bg-blue-500/20 
                                text-blue-400 hover:text-blue-300 rounded-md 
                                border border-blue-500/30 transition-all duration-300"
                    >
                      Сохранить
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

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
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 justify-between">
                      <div className="flex items-center gap-3 min-w-0">
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
                          className="flex items-center justify-between sm:justify-end gap-3 cursor-pointer hover:opacity-80 transition-opacity pl-5"
                        >
                          <span className="text-sm text-secondary-light hover:text-white transition-colors truncate max-w-[200px] sm:max-w-[300px]">
                            {selected.product.title}
                          </span>
                          <span className="text-sm text-blue-400 font-medium whitespace-nowrap flex-shrink-0">
                            {selected.product.price.toLocaleString()} ₽
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

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
      )}
    </div>
  );
}
