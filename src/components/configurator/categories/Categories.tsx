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
import { usePreloadData } from "@/hooks/usePreloadData";
import { usePagination } from "@/hooks/usePagination";
import ConfiguratorWelcome from "../welcome/ConfiguratorWelcome";
import SubcategoryWelcome from "../welcome/SubcategoryWelcome";

// Обновляем функцию fetcher для лучшей обработки ошибок
const fetcher = async (url: string) => {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  } catch (error) {
    console.error("Fetch error:", error);
    return null;
  }
};

// Предзагрузка данных категорий
preload("/api/categories", fetcher);

const Categories = () => {
  const { preload } = usePreloadData();
  // const { resetPagination, getCurrentPage } = usePagination();
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
  const prevPageRef = useRef<string | null>(null); // Добавляем ref снаружи эффекта

  // Оптимизация работы с SWR
  const swrOptions = {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000,
    keepPreviousData: true,
    suspense: false,
    revalidateOnMount: true,
    shouldRetryOnError: true,
    refreshWhenOffline: false,
    refreshWhenHidden: false,
    refreshInterval: 0,
  };

  // Загрузка категорий
  const { data: categories = [], isLoading: isCategoriesLoading } = useSWR<
    Category[]
  >("/api/categories", fetcher, swrOptions);

  // Обновляем URL для загрузки продуктов
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

  // Предзагрузка следующих категорий
  const preloadNextCategory = useCallback(
    (currentIndex: number) => {
      if (!categories || currentIndex >= categories.length - 1) return;

      const nextCategory = categories[currentIndex + 1];
      if (nextCategory) {
        preload(`/api/products/${nextCategory.slug}`);
        if (nextCategory.children?.[0]) {
          preload(
            `/api/products/${nextCategory.slug}/${nextCategory.children[0].slug}`
          );
        }
      }
    },
    [categories, preload]
  );

  // Обновляем логику загрузки продуктов с учетом пагинации
  const { data: productsData, mutate: mutateProducts } = useSWR(
    getProductsUrl(),
    async (url) => {
      try {
        setIsLoadingProducts(true);
        if (!url) return null;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch products");
        return response.json();
      } catch (error) {
        console.error("Error loading products:", error);
        return null;
      } finally {
        setIsLoadingProducts(false);
      }
    },
    {
      ...swrOptions,
      keepPreviousData: false, // Изменяем на false, чтобы предотвратить кеширование между категориями
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  // Обновляем логику загрузки продуктов
  useEffect(() => {
    if (productsData) {
      // Проверяем наличие поля hasSubcategories
      if ("hasSubcategories" in productsData) {
        // Если есть подкатегории, очищаем список продуктов
        setProducts([]);
      } else if ("products" in productsData) {
        // Если есть продукты, устанавливаем их
        setProducts(productsData.products);
      } else if (Array.isArray(productsData)) {
        // Если пришел массив продуктов
        setProducts(productsData);
      } else {
        // По умолчанию устанавливаем пустой массив
        setProducts([]);
      }
      setIsLoadingProducts(false);
    }
  }, [productsData]);

  // На этот, который проверяет действительно ли изменилась страница
  useEffect(() => {
    const currentPage = searchParams.get("page");

    if (currentPage !== prevPageRef.current) {
      prevPageRef.current = currentPage;
      setIsLoadingProducts(true);
      mutateProducts().finally(() => setIsLoadingProducts(false));
    }
  }, [searchParams, mutateProducts]);

  // Обновляем эффект синхронизации URL и категорий
  useEffect(() => {
    const categorySlug = searchParams.get("category");
    const subcategorySlug = searchParams.get("subcategory");

    if (!categories || categories.length === 0) return;

    if (categorySlug) {
      const category = categories.find(
        (c: Category) => c.slug === categorySlug
      );
      if (category) {
        setSelectedCategory(category);

        if (subcategorySlug && category.children) {
          const subcategory = category.children.find(
            (sc: Category) => sc.slug === subcategorySlug
          );
          if (subcategory) {
            setSelectedSubcategory(subcategory);
          } else {
            // Если подкатегория не найдена, очищаем её из URL
            const newParams = new URLSearchParams();
            newParams.set("category", category.slug);
            router.replace(`/configurator?${newParams.toString()}`, {
              scroll: false,
            });
          }
        }
      } else {
        // Если категория не найдена, очищаем URL
        router.replace("/configurator", { scroll: false });
      }
    }
  }, [searchParams, categories, router]);

  // Обновляем эффект для URL
  useEffect(() => {
    const categorySlug = searchParams.get("category");
    const subcategorySlug = searchParams.get("subcategory");

    if (!categories || categories.length === 0) return;

    if (categorySlug) {
      const category = categories.find((c) => c.slug === categorySlug);
      if (category) {
        setSelectedCategory(category);

        if (subcategorySlug && category.children) {
          const subcategory = category.children.find(
            (sc) => sc.slug === subcategorySlug
          );
          setSelectedSubcategory(subcategory || null);
        } else {
          setSelectedSubcategory(null);
        }
      }
    } else {
      setSelectedCategory(null);
      setSelectedSubcategory(null);
    }
  }, [categories, searchParams]);

  // Адаптивная верстка для мобильных устройств
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Обновляем функцию createQueryString (оставляем только эту версию)
  const createQueryString = useCallback(
    (params: Record<string, string | null>) => {
      const currentParams = new URLSearchParams(searchParams.toString());

      // Очищаем все фильтры
      Array.from(currentParams.keys()).forEach((key) => {
        if (
          key.startsWith("char[") ||
          key === "brand" ||
          key.startsWith("price")
        ) {
          currentParams.delete(key);
        }
      });

      // Добавляем новые параметры
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

  // Обновляем обработчик изменения фильтров
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

  // Обновляем обработчик выбора категории
  const handleCategorySelect = useCallback(
    async (category: Category, index: number) => {
      try {
        // Начинаем загрузку
        setIsLoadingProducts(true);
        setSelectedCategory(category);
        setSelectedSubcategory(null);
        setIsDropdownOpen(false);

        preloadNextCategory(index);

        // Принудительно очищаем состояние SWR для предыдущей категории
        await mutateProducts(null, false);

        // Заменяем URL с чистыми параметрами и ждем завершения
        await router.replace(`/configurator?category=${category.slug}`);

        // Ждем следующего тика, чтобы убедиться, что URL обновился
        await new Promise((resolve) => setTimeout(resolve, 0));

        // Загружаем новые данные только если нет подкатегорий
        if (!category.children?.length) {
          await mutateProducts();
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error("Error selecting category:", error);
        setProducts([]);
      } finally {
        setIsLoadingProducts(false);
      }
    },
    [router, mutateProducts, preloadNextCategory]
  );

  // Обновляем обработчик выбора подкатегории
  const handleSubcategorySelect = useCallback(
    async (subcategory: Category) => {
      if (!selectedCategory) return;

      try {
        setIsLoadingProducts(true);
        setSelectedSubcategory(subcategory);

        // Очищаем URL и устанавливаем только категорию и подкатегорию
        const params = new URLSearchParams();
        params.set("category", selectedCategory.slug);
        params.set("subcategory", subcategory.slug);

        await router.replace(`/configurator?${params.toString()}`);

        // Ждем обновления URL перед загрузкой новых данных
        await new Promise((resolve) => setTimeout(resolve, 0));
        await mutateProducts();
      } catch (error) {
        console.error("Subcategory selection error:", error);
        setProducts([]);
      } finally {
        setIsLoadingProducts(false);
      }
    },
    [selectedCategory, router, mutateProducts]
  );

  // Обновляем handlePageChange
  const handlePageChange = useCallback(
    async (page: number) => {
      if (isLoadingProducts) return;

      try {
        setIsLoadingProducts(true);
        const params = new URLSearchParams(searchParams.toString());

        // Сохраняем все текущие параметры и просто обновляем страницу
        params.set("page", page.toString());

        await router.replace(`/configurator?${params.toString()}`, {
          scroll: false,
        });

        await mutateProducts();
      } finally {
        setIsLoadingProducts(false);
      }
    },
    [isLoadingProducts, router, searchParams, mutateProducts]
  );

  // Обновляем эффект для отслеживания изменения страницы
  // useEffect(() => {
  //   const currentPage = searchParams.get("page");
  //   const currentUrl = searchParams.toString();
  //   if (currentUrl && (!currentPage || currentPage === "1")) {
  //     const params = new URLSearchParams(currentUrl);
  //     params.set("page", "1");
  //     router.replace(`/configurator?${params.toString()}`, { scroll: false });
  //   }
  // }, [searchParams, router]);

  // Обновляем рендер
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
                  className="absolute z-10 w-full mt-2 rounded-lg bg-primary border border-primary-border shadow-lg"
                >
                  <div className="py-2">
                    {categories.map((category, index) => (
                      <button
                        key={category.id}
                        onClick={() => handleCategorySelect(category, index)}
                        className={`w-full px-4 py-3 flex items-center hover:bg-gradient-from/20 text-left ${
                          selectedCategory?.id === category.id
                            ? "text-white"
                            : "text-secondary-light hover:text-white"
                        }`}
                      >
                        <span>{category.name}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {selectedCategory && selectedCategory.children.length > 0 && (
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
          </div>
        ) : (
          <div>
            <div className="flex justify-between gap-4">
              {categories.map((category, index) => (
                <CategoryItem
                  key={category.id}
                  category={category}
                  isSelected={selectedCategory?.id === category.id}
                  onClick={() => handleCategorySelect(category, index)}
                />
              ))}
            </div>
            {selectedCategory && selectedCategory.children.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6"
              >
                <div className="bg-gradient-from/10 rounded-xl border border-primary-border/30">
                  {/* Заголовок */}
                  <div className="p-4 border-b border-primary-border/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-medium text-white">
                        {selectedCategory.name}
                      </h3>
                      <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20">
                        {selectedCategory.children.length} подкатегори
                        {selectedCategory.children.length === 1 ? "я" : "и"}
                      </span>
                    </div>
                  </div>

                  {/* Сетка подкатегорий */}
                  <div className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {selectedCategory.children.map((subcategory, index) => (
                        <motion.button
                          key={subcategory.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          onClick={() => handleSubcategorySelect(subcategory)}
                          className={`
                            group relative p-4 rounded-lg border transition-all duration-300
                            ${
                              selectedSubcategory?.id === subcategory.id
                                ? "bg-gradient-to-br from-[#2A2D3E]/80 to-[#353849]/80 border-blue-500/50 hover:border-blue-500"
                                : "bg-gradient-from/20 border-primary-border/30 hover:border-primary-border/50 hover:bg-gradient-from/30"
                            }
                          `}
                        >
                          <div
                            className={`
                              absolute top-0 left-0 right-0 h-1 rounded-t-lg transition-opacity duration-300
                              ${
                                selectedSubcategory?.id === subcategory.id
                                  ? "bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-blue-500/50"
                                  : "bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-blue-500/0 group-hover:from-blue-500/20 group-hover:via-purple-500/20 group-hover:to-blue-500/20"
                              }
                            `}
                          />

                          {/* Иконка категории (если есть) */}
                          {subcategory.icon && (
                            <div
                              className={`
                                w-8 h-8 mb-3 p-1.5 rounded-lg transition-colors duration-300
                                ${
                                  selectedSubcategory?.id === subcategory.id
                                    ? "bg-blue-500/10"
                                    : "bg-gradient-from/30 group-hover:bg-gradient-from/50"
                                }
                              `}
                            >
                              <img
                                src={subcategory.icon}
                                alt=""
                                className="w-full h-full object-contain"
                              />
                            </div>
                          )}

                          {/* Название и количество товаров */}
                          <div className="text-left">
                            <h4
                              className={`
                                font-medium transition-colors duration-300 mb-1
                                ${
                                  selectedSubcategory?.id === subcategory.id
                                    ? "text-white"
                                    : "text-secondary-light group-hover:text-white"
                                }
                              `}
                            >
                              {subcategory.name}
                            </h4>
                            <p
                              className={`
                                text-xs transition-colors duration-300
                                ${
                                  selectedSubcategory?.id === subcategory.id
                                    ? "text-blue-400/80"
                                    : "text-secondary-light/70 group-hover:text-secondary-light"
                                }
                              `}
                            >
                              Выбрать категорию
                            </p>
                          </div>

                          {/* Декоративный эффект при наведении */}
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-blue-500/0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-lg" />
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Показываем Welcome компонент, если категория не выбрана */}
        {!selectedCategory && <ConfiguratorWelcome />}

        {/* Показываем SubcategoryWelcome, если есть подкатегории и не выбрана подкатегория */}
        {selectedCategory &&
          selectedCategory.children?.length > 0 &&
          !selectedSubcategory && (
            <SubcategoryWelcome category={selectedCategory} />
          )}

        {/* Показываем продукты и фильтры, только если выбрана подкатегория или нет подкатегорий */}
        {selectedCategory &&
          (!selectedCategory.children?.length || selectedSubcategory) &&
          productsData && (
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
