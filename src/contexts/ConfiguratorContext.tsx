"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Product } from "@/types/product";
import { Category } from "@/types/category";
import CompatibilityCheckModal from "@/components/modals/configurator/CompatibilityCheckModal";
import { CompatibilityResult } from "@/types/compatibility";
import {
  getStandardCookie,
  setStandardCookie,
  COOKIE_KEYS,
} from "@/utils/cookieUtils";

export interface SelectedProduct {
  categoryId: number;
  product: Product;
}

// Добавляем интерфейс для сохраняемых данных конфигурации
interface SavedConfiguration {
  products: SelectedProduct[];
  timestamp: number;
}

// Добавляем константу для времени жизни - 7 дней (в миллисекундах)
const CONFIG_TTL = 7 * 24 * 60 * 60 * 1000;
const CONFIG_STORAGE_KEY = "pc-configuration";
// Используем константу из cookieUtils
const CONFIG_COOKIE_KEY = COOKIE_KEYS.CONFIGURATOR;

interface ConfiguratorContextType {
  selectedProducts: SelectedProduct[];
  categories: Category[];
  isLoading: boolean;
  addProduct: (product: Product, force?: boolean) => Promise<void>;
  removeProduct: (categoryId: number) => void;
  replaceProduct: (categoryId: number, newProduct: Product) => void;
  getProductByCategory: (categoryId: number) => Product | null;
  getTotalPrice: () => number;
  getProgress: () => number;
  isConfigurationComplete: boolean;
  clearConfiguration: () => void;
  isCompatibilityCheckModalOpen: boolean;
  openCompatibilityCheckModal: () => void;
  closeCompatibilityCheckModal: () => void;
  selectedComponents: Record<string, string>;
  setSelectedComponents: React.Dispatch<
    React.SetStateAction<Record<string, string>>
  >;
}

const ConfiguratorContext = createContext<ConfiguratorContextType | undefined>(
  undefined
);

export const ConfiguratorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    []
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfigurationComplete, setIsConfigurationComplete] = useState(false);
  const [isCompatibilityCheckModalOpen, setIsCompatibilityCheckModalOpen] =
    useState(false);
  const [selectedComponents, setSelectedComponents] = useState<
    Record<string, string>
  >({});
  const [compatibilityResults, setCompatibilityResults] =
    useState<CompatibilityResult | null>(null);

  // Обновляем selectedComponents при изменении selectedProducts
  useEffect(() => {
    const componentsMap: Record<string, string> = {};

    selectedProducts.forEach((item) => {
      // Находим категорию продукта
      const category = categories.find((c) => c.id === item.product.categoryId);
      if (category && category.slug) {
        componentsMap[category.slug] = item.product.slug;
      }
    });

    console.log("Обновление selectedComponents:", componentsMap);
    setSelectedComponents(componentsMap);
  }, [selectedProducts, categories]);

  // Загрузка категорий при монтировании
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Функция для определения завершенности сборки
  const checkConfigurationComplete = useCallback(
    (products: SelectedProduct[], cats: Category[]) => {
      // Сборка считается завершенной только если количество выбранных товаров
      // равно количеству обязательных категорий
      return cats.length > 0 && products.length === cats.length;
    },
    []
  );

  // Загружаем сохраненную конфигурацию при инициализации
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        // Сначала пробуем загрузить из куков
        const cookieConfig = getStandardCookie(
          CONFIG_COOKIE_KEY
        ) as SavedConfiguration | null;

        // Если в куках нет данных, пробуем localStorage для обратной совместимости
        const savedConfigStr = cookieConfig
          ? null
          : localStorage.getItem(CONFIG_STORAGE_KEY);
        const savedConfig =
          cookieConfig ||
          (savedConfigStr
            ? (JSON.parse(savedConfigStr) as SavedConfiguration)
            : null);

        if (savedConfig) {
          // Проверяем, не устарели ли данные
          const now = Date.now();
          if (
            savedConfig.timestamp &&
            now - savedConfig.timestamp < CONFIG_TTL
          ) {
            setSelectedProducts(savedConfig.products);

            // Статус завершенности устанавливаем только после загрузки категорий
            if (categories.length > 0) {
              setIsConfigurationComplete(
                checkConfigurationComplete(savedConfig.products, categories)
              );
            }

            // Если данные были в localStorage, переносим их в куки и удаляем из localStorage
            if (savedConfigStr && !cookieConfig) {
              setStandardCookie(CONFIG_COOKIE_KEY, savedConfig, {
                maxAge: CONFIG_TTL / 1000,
              });
              localStorage.removeItem(CONFIG_STORAGE_KEY);
            }
          } else {
            // Если конфигурация устарела, удаляем её
            localStorage.removeItem(CONFIG_STORAGE_KEY);
            setStandardCookie(CONFIG_COOKIE_KEY, "", { maxAge: 0 });
          }
        }
      } catch (error) {
        console.error("Error loading saved configuration:", error);
        // При ошибке чтения просто удаляем повреждённые данные
        localStorage.removeItem(CONFIG_STORAGE_KEY);
      }
    }
  }, [categories, checkConfigurationComplete]);

  // Обновляем статус завершенности всякий раз, когда меняются товары или категории
  useEffect(() => {
    if (categories.length > 0) {
      setIsConfigurationComplete(
        checkConfigurationComplete(selectedProducts, categories)
      );
    }
  }, [selectedProducts, categories, checkConfigurationComplete]);

  // Сохраняем конфигурацию при изменениях
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (selectedProducts.length > 0) {
        const configToSave: SavedConfiguration = {
          products: selectedProducts,
          timestamp: Date.now(),
        };
        // Сохраняем в куки
        setStandardCookie(CONFIG_COOKIE_KEY, configToSave, {
          maxAge: CONFIG_TTL / 1000,
        });
        // Для обратной совместимости сохраняем также и в localStorage
        localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(configToSave));
      } else {
        // Если конфигурация пуста, удаляем куки и localStorage
        setStandardCookie(CONFIG_COOKIE_KEY, "", { maxAge: 0 });
        localStorage.removeItem(CONFIG_STORAGE_KEY);
      }
    }
  }, [selectedProducts]);

  // Вспомогательная функция для проверки конфликтов
  const checkProductConflict = useCallback(
    (product: Product): SelectedProduct | null => {
      // Находим категорию продукта
      const productCategory = categories.find(
        (c) =>
          c.id === product.categoryId ||
          c.children?.some((sc) => sc.id === product.categoryId)
      );

      if (!productCategory) return null;

      // Проверяем, есть ли уже продукт в этой категории или её подкатегориях
      return (
        selectedProducts.find((selected) => {
          const selectedCategory = categories.find(
            (c) =>
              c.id === selected.categoryId ||
              c.children?.some((sc) => sc.id === selected.categoryId)
          );
          return selectedCategory?.id === productCategory.id;
        }) || null
      );
    },
    [categories, selectedProducts]
  );

  // Добавление продукта
  const addProduct = useCallback(
    async (product: Product, force: boolean = false): Promise<void> => {
      const conflictingProduct = checkProductConflict(product);

      if (conflictingProduct && !force) {
        throw new Error("REPLACE_CONFLICT", {
          cause: conflictingProduct.product,
        });
      }

      if (force || !conflictingProduct) {
        setSelectedProducts((prev) => {
          // Находим категорию продукта
          const productCategory = categories.find(
            (c) =>
              c.id === product.categoryId ||
              c.children?.some((sc) => sc.id === product.categoryId)
          );

          if (!productCategory) return prev;

          // Удаляем существующий продукт из той же категории или подкатегории
          const filtered = prev.filter((selected) => {
            const selectedCategory = categories.find(
              (c) =>
                c.id === selected.categoryId ||
                c.children?.some((sc) => sc.id === selected.categoryId)
            );
            return selectedCategory?.id !== productCategory.id;
          });

          // Добавляем новый продукт
          return [...filtered, { categoryId: product.categoryId, product }];
        });
      }
    },
    [categories, checkProductConflict]
  );

  const removeProduct = useCallback((categoryId: number) => {
    setSelectedProducts((prev) =>
      prev.filter((item) => item.categoryId !== categoryId)
    );
  }, []);

  const replaceProduct = useCallback(
    (categoryId: number, newProduct: Product) => {
      setSelectedProducts((prev) =>
        prev.map((item) =>
          item.categoryId === categoryId
            ? { categoryId, product: newProduct }
            : item
        )
      );
    },
    []
  );

  const getProductByCategory = useCallback(
    (categoryId: number): Product | null => {
      const selectedProduct = selectedProducts.find(
        (item) => item.product.categoryId === categoryId
      );
      return selectedProduct ? selectedProduct.product : null;
    },
    [selectedProducts]
  );

  const getTotalPrice = useCallback((): number => {
    return selectedProducts.reduce(
      (total, item) => total + item.product.price,
      0
    );
  }, [selectedProducts]);

  const getProgress = useCallback((): number => {
    if (categories.length === 0) return 0;
    return (selectedProducts.length / categories.length) * 100;
  }, [categories.length, selectedProducts.length]);

  const clearConfiguration = useCallback(() => {
    setSelectedProducts([]);
    setIsConfigurationComplete(false);
    localStorage.removeItem(CONFIG_STORAGE_KEY);
  }, []);

  // Обработчики для модального окна проверки совместимости
  const openCompatibilityCheckModal = useCallback(async () => {
    console.log(
      "Открытие модального окна проверки совместимости, выбранные компоненты:",
      selectedComponents
    );

    // Более глубокая отладка для выявления проблемы
    console.log(
      "Формат selectedComponents:",
      Object.entries(selectedComponents || {}).map(
        ([categorySlug, productSlug]) => ({
          categorySlug,
          slug: productSlug,
        })
      )
    );

    try {
      // Получаем результаты проверки совместимости
      const response = await fetch("/api/compatibility/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          components: Object.entries(selectedComponents || {}).map(
            ([categorySlug, productSlug]) => ({
              categorySlug,
              productSlug,
            })
          ),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCompatibilityResults(data);
        setIsCompatibilityCheckModalOpen(true);
      } else {
        console.error(
          "Ошибка при проверке совместимости:",
          response.statusText
        );
        // Создаем базовый результат при ошибке
        setCompatibilityResults({
          compatible: false,
          issues: [],
          componentPairs: [],
        });
        setIsCompatibilityCheckModalOpen(true);
      }
    } catch (error) {
      console.error("Ошибка при проверке совместимости:", error);
      // Создаем базовый результат при ошибке
      setCompatibilityResults({
        compatible: false,
        issues: [],
        componentPairs: [],
      });
      setIsCompatibilityCheckModalOpen(true);
    }
  }, [selectedComponents]);

  const closeCompatibilityCheckModal = () => {
    setIsCompatibilityCheckModalOpen(false);
  };

  const value = {
    selectedProducts,
    categories,
    isLoading,
    addProduct,
    removeProduct,
    replaceProduct,
    getProductByCategory,
    getTotalPrice,
    getProgress,
    isConfigurationComplete,
    clearConfiguration,
    isCompatibilityCheckModalOpen,
    openCompatibilityCheckModal,
    closeCompatibilityCheckModal,
    selectedComponents,
    setSelectedComponents,
  };

  return (
    <ConfiguratorContext.Provider value={value}>
      {children}
      <CompatibilityCheckModal
        isOpen={isCompatibilityCheckModalOpen}
        onClose={closeCompatibilityCheckModal}
        results={
          compatibilityResults || {
            compatible: true,
            issues: [],
            componentPairs: [],
          }
        }
      />
    </ConfiguratorContext.Provider>
  );
};

export const useConfigurator = () => {
  const context = useContext(ConfiguratorContext);
  if (context === undefined) {
    throw new Error(
      "useConfigurator must be used within a ConfiguratorProvider"
    );
  }
  return context;
};
