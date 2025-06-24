"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR, { preload as swrPreload } from "swr";
import { useRouter, useSearchParams } from "next/navigation";
import { getApiUrl } from "../../../utils/apiUtils";
import { useCategories } from "./hooks/useCategories";
import { useProducts } from "./hooks/useProducts";
import { MobileView } from "./views/MobileView";
import { DesktopView } from "./views/DesktopView";
import ConfiguratorHeader from "./ConfiguratorHeader";
import ProductList from "../products/ProductList";
import Filters from "../filters/Filters";
import ConfiguratorWelcome from "../welcome/ConfiguratorWelcome";
import SubcategoryWelcome from "../welcome/SubcategoryWelcome";
import { Category } from "@/types/category";
import { Product } from "@/types/product";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { usePreloadData } from "@/hooks/usePreloadData";
import { usePagination } from "@/hooks/usePagination";
import { useConfigurator } from "@/contexts/ConfiguratorContext";
import { DetailedComponent } from "@/types/pcbuild";

// Обновляем функцию fetcher для лучшей обработки ошибок
const fetcher = async (url: string) => {
  if (!url) return null;
  try {
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      // Если сервер вернул ошибку, возвращаем пустой результат вместо выброса исключения
      console.error("Server error:", data.error);
      
      // Для categories API возвращаем пустой массив
      if (url.includes('/api/categories')) {
        return [];
      }
      
      return {
        products: [],
        totalItems: 0,
        totalPages: 1,
        currentPage: 1,
      };
    }

    // Дополнительная проверка для categories API
    if (url.includes('/api/categories') && !Array.isArray(data)) {
      console.error("Categories API returned non-array data:", data);
      return [];
    }

    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    
    // Для categories API возвращаем пустой массив
    if (url.includes('/api/categories')) {
      return [];
    }
    
    return {
      products: [],
      totalItems: 0,
      totalPages: 1,
      currentPage: 1,
    };
  }
};

// Предзагрузка данных категорий
swrPreload(getApiUrl("/api/categories"), fetcher); // Используем swrPreload вместо preload

const Categories = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMobile, setIsMobile] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const { addProduct } = useConfigurator(); // Получаем addProduct из контекста
  const [editingBuildName, setEditingBuildName] = useState<string | null>(null);
  const [editingBuildSlug, setEditingBuildSlug] = useState<string | null>(null);

  // Получаем категории
  const { data: categories = [], isLoading: isCategoriesLoading } = useSWR(
    getApiUrl("/api/categories"),
    fetcher
  );

  // Обновляем инициализацию хука useCategories, передавая categories
  const [categoryState, categoryActions] = useCategories(
    () => mutateProducts(),
    categories
  );
  const { selectedCategory, selectedSubcategory } = categoryState;

  // Формируем URL для загрузки продуктов
  const getProductsUrl = useCallback(() => {
    if (!selectedCategory) return null;

    let url = `/api/products/${selectedCategory.slug}`;
    if (selectedSubcategory) {
      url += `/${selectedSubcategory.slug}`;
    }

    // Добавляем все параметры из URL кроме category и subcategory
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("subcategory");
    const queryString = params.toString();

    return queryString ? `${url}?${queryString}` : url;
  }, [selectedCategory, selectedSubcategory, searchParams]);

  // Инициализируем хук для работы с продуктами
  const {
    productsData,
    state: productState,
    setState: setProductState,
    mutate: mutateProducts,
    handlePageChange,
  } = useProducts(getProductsUrl);

  // Обработчик изменения фильтров
  const handleFilterChange = useCallback(
    async (filters: Record<string, string[]>, priceRange: [number, number]) => {
      if (!selectedCategory) return;

      const updateFilters = async () => {
        try {
          setIsLoadingProducts(true);
          const params = new URLSearchParams(searchParams.toString());

          // Очищаем старые фильтры
          Array.from(params.keys()).forEach((key) => {
            if (
              key.startsWith("char[") ||
              key === "brand" ||
              key.startsWith("price")
            ) {
              params.delete(key);
            }
          });

          // Добавляем базовые параметры
          params.set("category", selectedCategory.slug);
          if (selectedSubcategory) {
            params.set("subcategory", selectedSubcategory.slug);
          }

          // Сбрасываем страницу
          params.set("page", "1");

          // Добавляем новые фильтры
          Object.entries(filters).forEach(([key, values]) => {
            values.forEach((value) => {
              params.append(key, value);
            });
          });

          // Добавляем цены
          if (priceRange[0] > 0)
            params.set("priceMin", priceRange[0].toString());
          if (priceRange[1] > 0)
            params.set("priceMax", priceRange[1].toString());

          await router.replace(`/configurator?${params.toString()}`, {
            scroll: false,
          });
          await mutateProducts();
        } catch (error) {
          console.error("Error applying filters:", error);
        } finally {
          setIsLoadingProducts(false);
        }
      };

      // Запускаем обновление в следующем тике
      Promise.resolve().then(updateFilters);
    },
    [
      selectedCategory,
      selectedSubcategory,
      router,
      searchParams,
      mutateProducts,
    ]
  );

  // Эффект для определения мобильного устройства
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const loadBuildSlug = searchParams.get("loadBuild");
    if (loadBuildSlug) {
      const loadSavedBuild = async () => {
        try {
          const response = await fetch(`/api/builds/${loadBuildSlug}`);
          const data = await response.json();

          if (response.ok && data.build) {
            // Сохраняем название редактируемой сборки
            setEditingBuildName(data.build.name);
            setEditingBuildSlug(data.build.slug); // Сохраняем slug редактируемой сборки

            // Загружаем компоненты только один раз
            const componentsToAdd = new Set();
            data.build.components.forEach((component: DetailedComponent) => {
              if (!componentsToAdd.has(component.product.id)) {
                componentsToAdd.add(component.product.id);
                addProduct(component.product, true);
              }
            });

            // Очищаем параметр loadBuild из URL
            const newParams = new URLSearchParams(searchParams.toString());
            newParams.delete("loadBuild");
            router.replace(`/configurator?${newParams.toString()}`, {
              scroll: false,
            });
          }
        } catch (error) {
          console.error("Error loading build:", error);
        }
      };

      loadSavedBuild();
    }
  }, [searchParams, addProduct, router]); // Добавляем router в зависимости

  if (isCategoriesLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-primary rounded-xl p-4 sm:p-6 shadow-lg border border-primary-border">
        <ConfiguratorHeader
          editingBuildName={editingBuildName}
          editingBuildSlug={editingBuildSlug}
        />

        {isMobile ? (
          <MobileView
            categories={categories}
            state={categoryState}
            actions={categoryActions}
          />
        ) : (
          <DesktopView
            categories={categories}
            state={categoryState}
            actions={categoryActions}
          />
        )}

        {/* Показываем Welcome компонент, если категория не выбрана */}
        {!selectedCategory && <ConfiguratorWelcome />}

        {/* Показываем SubcategoryWelcome, если есть подкатегории и не выбрана подкатегория */}
        {selectedCategory &&
          selectedCategory.children &&
          selectedCategory.children.length > 0 &&
          !selectedSubcategory && (
            <SubcategoryWelcome category={selectedCategory} />
          )}

        {/* Показываем продукты и фильтры, только если выбрана подкатегория или нет подкатегорий */}
        {selectedCategory &&
          (!selectedCategory.children?.length || selectedSubcategory) &&
          productsData && (
            <div className="mt-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-80 flex-shrink-0">
                  <Filters
                    categorySlug={selectedCategory?.slug || ""}
                    subcategorySlug={selectedSubcategory?.slug}
                    onFilterChange={handleFilterChange}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <ProductList
                    data={productsData}
                    category={selectedCategory?.slug || ""}
                    subcategory={selectedSubcategory?.slug}
                    isLoading={isLoadingProducts}
                    onPageChange={handlePageChange}
                  />
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default Categories;
