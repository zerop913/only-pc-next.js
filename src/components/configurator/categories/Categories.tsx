"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR, { preload } from "swr";
import CategoryItem from "./CategoryItem";
import ConfiguratorHeader from "./ConfiguratorHeader";
import ProductList from "../products/ProductList";
import Filters from "../filters/Filters";
import { Category } from "@/types/category";
import { Product } from "@/types/product";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

// Функции для загрузки данных
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch data");
  return res.json();
};

// Предзагрузка данных категорий
preload("/api/categories", fetcher);

const Categories = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [selectedSubcategory, setSelectedSubcategory] =
    useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>(
    {}
  );
  const [activePriceRange, setActivePriceRange] = useState<[number, number]>([
    0, 0,
  ]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Оптимизация работы с SWR - более агрессивное кеширование данных
  const swrOptions = {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000, // 1 минута вместо 1 часа для более частого обновления
    suspense: false, // Отключаем подвешивание
  };

  // Загрузка категорий
  const { data: categories = [], isLoading: isCategoriesLoading } = useSWR<
    Category[]
  >("/api/categories", fetcher, swrOptions);

  // Предварительная загрузка популярных категорий
  useEffect(() => {
    if (categories && categories.length > 0) {
      // Предзагружаем первые 3 категории
      categories.slice(0, 3).forEach((category) => {
        preload(`/api/products/${category.slug}`, fetcher);
        if (category.children && category.children.length > 0) {
          // Предзагружаем первую подкатегорию каждой категории
          const firstSubcategory = category.children[0];
          preload(
            `/api/products/${category.slug}/${firstSubcategory.slug}`,
            fetcher
          );
        }
      });
    }
  }, [categories]);

  // Динамический запрос продуктов
  const productsUrl = selectedCategory
    ? `/api/products/${selectedCategory.slug}${
        selectedSubcategory ? `/${selectedSubcategory.slug}` : ""
      }`
    : null;

  const { data: productsData, mutate: mutateProducts } = useSWR<Product[]>(
    productsUrl,
    productsUrl ? fetcher : null,
    {
      ...swrOptions,
      onLoadingSlow: () => setIsLoadingProducts(true),
      onSuccess: () => setIsLoadingProducts(false),
    }
  );

  // Отслеживаем изменения в данных продуктов
  useEffect(() => {
    if (productsData) {
      setProducts(Array.isArray(productsData) ? productsData : []);
    }
  }, [productsData]);

  // Синхронизация URL и выбранных категорий
  useEffect(() => {
    const categorySlug = searchParams.get("category");
    const subcategorySlug = searchParams.get("subcategory");

    if (categorySlug && categories.length > 0) {
      const category = categories.find(
        (c: Category) => c.slug === categorySlug
      );
      if (category) {
        setSelectedCategory(category);

        // Предзагрузка продуктов выбранной категории
        preload(`/api/products/${categorySlug}`, fetcher);

        // Если есть подкатегория, сразу загружаем её фильтры
        if (subcategorySlug) {
          preload(`/api/filters/${categorySlug}/${subcategorySlug}`, fetcher);
        } else {
          // Иначе загружаем фильтры категории
          preload(`/api/filters/${categorySlug}`, fetcher);
        }
      }
    }

    if (subcategorySlug && categorySlug && categories.length > 0) {
      const category = categories.find(
        (c: Category) => c.slug === categorySlug
      );
      if (category?.children) {
        const subcategory = category.children.find(
          (sc: Category) => sc.slug === subcategorySlug
        );
        if (subcategory) {
          setSelectedSubcategory(subcategory);

          // Предзагрузка продуктов выбранной подкатегории
          preload(`/api/products/${categorySlug}/${subcategorySlug}`, fetcher);
        }
      }
    }
  }, [searchParams, categories]);

  // Адаптивная верстка для мобильных устройств
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Функция для создания строки параметров URL
  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const currentParams = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, value]) => {
        if (value === null) {
          currentParams.delete(key);
        } else {
          currentParams.set(key, value);
        }
      });
      return currentParams.toString();
    },
    [searchParams]
  );

  // Изменяем обработчик изменения фильтров
  const handleFilterChange = useCallback(
    async (filters: Record<string, string[]>, priceRange: [number, number]) => {
      if (!selectedCategory) return;

      setIsLoadingProducts(true);

      // Создаем URL с параметрами фильтров
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

      // Добавляем фильтры брендов
      if (filters["brand"]) {
        filters["brand"].forEach((brand) => {
          params.append("brand", brand);
        });
      }

      // Добавляем фильтры характеристик
      Object.entries(filters).forEach(([key, values]) => {
        if (key !== "brand") {
          values.forEach((value) => {
            params.append(`char[${key}]`, value);
          });
        }
      });

      // Добавляем диапазон цен, если он отличается от исходного
      if (priceRange[0] > 0) params.set("priceMin", priceRange[0].toString());
      if (priceRange[1] > 0) params.set("priceMax", priceRange[1].toString());

      // Всегда возвращаемся на первую страницу при изменении фильтров
      params.set("page", "1");

      // Обновляем URL
      router.push(`/configurator?${params.toString()}`, { scroll: false });

      try {
        // Загружаем отфильтрованные продукты
        await mutateProducts();
      } finally {
        setIsLoadingProducts(false);
      }
    },
    [selectedCategory, searchParams, router, mutateProducts]
  );

  // Обработчик выбора категории
  const handleCategorySelect = useCallback(
    async (category: Category) => {
      setIsLoadingProducts(true);
      setSelectedCategory(category);
      setSelectedSubcategory(null);
      setIsDropdownOpen(false);

      // Предварительная загрузка данных
      preload(`/api/products/${category.slug}`, fetcher);
      preload(`/api/filters/${category.slug}`, fetcher);

      const queryString = createQueryString({
        category: category.slug,
        subcategory: null,
      });
      router.push(`/configurator?${queryString}`, { scroll: false });

      if (!category.children?.length) {
        mutateProducts();
      } else {
        setProducts([]);
      }

      // Короткая задержка перед сбросом состояния загрузки
      setTimeout(() => setIsLoadingProducts(false), 500);
    },
    [createQueryString, router, mutateProducts]
  );

  // Обработчик выбора подкатегории
  const handleSubcategorySelect = useCallback(
    async (subcategory: Category) => {
      setIsLoadingProducts(true);
      setSelectedSubcategory(subcategory);

      if (selectedCategory) {
        // Предварительная загрузка данных
        preload(
          `/api/products/${selectedCategory.slug}/${subcategory.slug}`,
          fetcher
        );
        preload(
          `/api/filters/${selectedCategory.slug}/${subcategory.slug}`,
          fetcher
        );

        const queryString = createQueryString({
          category: selectedCategory.slug,
          subcategory: subcategory.slug,
        });
        router.push(`/configurator?${queryString}`, { scroll: false });

        mutateProducts();

        // Короткая задержка перед сбросом состояния загрузки
        setTimeout(() => setIsLoadingProducts(false), 500);
      }
    },
    [selectedCategory, createQueryString, router, mutateProducts]
  );

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
        <ConfiguratorHeader totalPrice={totalPrice} />

        {isMobile ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full p-4 rounded-lg bg-gradient-to-br from-[#1D1E2C] to-[#252736] flex items-center justify-between text-white"
            >
              <span
                className={
                  selectedCategory ? "text-white" : "text-secondary-light"
                }
              >
                {selectedCategory
                  ? selectedCategory.name
                  : "Выберите категорию"}
              </span>
              <ChevronDownIcon
                className={`w-5 h-5 transition-transform duration-300 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute z-10 w-full mt-2 rounded-lg bg-primary border border-primary-border shadow-lg"
                >
                  <div className="py-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategorySelect(category)}
                        className="w-full px-4 py-3 flex items-center hover:bg-gradient-from/20 text-left"
                      >
                        <span className="text-secondary-light hover:text-white">
                          {category.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {selectedCategory?.children &&
                selectedCategory.children.length > 0 &&
                !isDropdownOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4"
                  >
                    <div className="grid gap-2">
                      {selectedCategory.children.map((subcategory) => (
                        <button
                          key={subcategory.id}
                          onClick={() => handleSubcategorySelect(subcategory)}
                          className={`
                          w-full px-4 py-3 rounded-lg text-sm bg-gradient-from/20 border border-primary-border
                          ${
                            selectedSubcategory?.id === subcategory.id
                              ? "text-white bg-gradient-to-br from-[#2A2D3E] to-[#353849]"
                              : "text-secondary-light"
                          }
                        `}
                        >
                          {subcategory.name}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
            </AnimatePresence>
          </div>
        ) : (
          <div>
            <div className="flex justify-between gap-4">
              {categories.map((category) => (
                <CategoryItem
                  key={category.id}
                  category={category}
                  isSelected={selectedCategory?.id === category.id}
                  onClick={() => handleCategorySelect(category)}
                />
              ))}
            </div>

            <AnimatePresence>
              {selectedCategory?.children &&
                selectedCategory.children.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-6"
                  >
                    <div className="p-4 bg-gradient-from/20 rounded-lg border border-primary-border">
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Подкатегории {selectedCategory.name}
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {selectedCategory.children.map((subcategory) => (
                          <button
                            key={subcategory.id}
                            onClick={() => handleSubcategorySelect(subcategory)}
                            className={`
                            px-4 py-2 rounded-lg text-sm transition-all duration-200 whitespace-nowrap
                            ${
                              selectedSubcategory?.id === subcategory.id
                                ? "bg-gradient-from/30 text-white"
                                : "bg-gradient-from/30  text-secondary-light hover:text-white"
                            }
                          `}
                          >
                            {subcategory.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
            </AnimatePresence>
          </div>
        )}
        {products.length > 0 && (
          <div className="mt-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="mt-6 w-full md:w-80">
                <Filters
                  categorySlug={selectedCategory?.slug || ""}
                  subcategorySlug={selectedSubcategory?.slug}
                  onFilterChange={handleFilterChange}
                />
              </div>
              <div className="flex-1">
                <ProductList
                  initialProducts={products}
                  category={selectedCategory?.slug || ""}
                  subcategory={selectedSubcategory?.slug}
                  isLoading={isLoadingProducts}
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
