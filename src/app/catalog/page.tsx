"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { PcBuildResponse } from "@/types/pcbuild";
import { Category } from "@/types/category";
import { useAuth } from "@/contexts/AuthContext";
import { getApiUrl } from "../../utils/apiUtils";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  TrendingUp,
  Cpu,
  Zap,
  Monitor,
  ChevronRight,
  X,
  Gamepad2,
  Package,
  Award,
  Loader2,
  RefreshCw,
  Filter,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { PAGE_TITLES } from "@/config/pageTitles";
import BuildCard from "@/components/catalog/BuildCard";
import Select from "@/components/common/ui/Select";
import { useDebounce } from "@/hooks/useDebounce";
import { EnhancedPcBuild, BuildCategory } from "@/types/enhancedPcBuild";

type SortOption =
  | "newest"
  | "price-asc"
  | "price-desc"
  | "popular"
  | "performance";

export default function CatalogPage() {
  const [builds, setBuilds] = useState<EnhancedPcBuild[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Поиск и фильтры
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [selectedCategory, setSelectedCategory] =
    useState<BuildCategory>("all");
  const [isPriceFilterVisible, setIsPriceFilterVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Элементы для интерактивности
  const debouncedSearch = useDebounce(search, 400);
  const headerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const headerOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0.95]);
  const headerScale = useTransform(scrollYProgress, [0, 0.05], [1, 0.98]);

  // Опции для сортировки
  const sortOptions = [
    { value: "newest", label: "По новизне" },
    { value: "popular", label: "По популярности" },
    { value: "performance", label: "По производительности" },
    { value: "price-asc", label: "Сначала недорогие" },
    { value: "price-desc", label: "Сначала дорогие" },
  ];

  // Категории сборок
  const buildCategories = [
    { id: "all", icon: Package, label: "Все сборки" },
    { id: "gaming", icon: Gamepad2, label: "Игровые" },
    { id: "workstation", icon: Monitor, label: "Рабочие станции" },
    { id: "office", icon: Cpu, label: "Офисные" },
  ];

  // Минимальная и максимальная цены в каталоге
  const minMaxPrice = useMemo(() => {
    if (builds.length === 0) return [0, 0];
    const prices = builds.map((build) => Number(build.totalPrice));
    return [Math.min(...prices), Math.max(...prices)];
  }, [builds]);

  // Отфильтрованные сборки с учетом всех фильтров
  const filteredBuilds = useMemo(() => {
    return builds
      .filter((build) => {
        // Фильтр по поиску
        const matchesSearch = build.name
          .toLowerCase()
          .includes(debouncedSearch.toLowerCase());

        // Фильтр по категории
        const matchesCategory =
          selectedCategory === "all" ||
          (selectedCategory === "gaming" && build.category === "gaming") ||
          (selectedCategory === "workstation" &&
            build.category === "workstation") ||
          (selectedCategory === "office" && build.category === "office");

        // Фильтр по цене
        const price = Number(build.totalPrice);
        const matchesPrice = price >= priceRange[0] && price <= priceRange[1];

        return matchesSearch && matchesCategory && matchesPrice;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        } else if (sortBy === "price-asc") {
          return Number(a.totalPrice) - Number(b.totalPrice);
        } else if (sortBy === "price-desc") {
          return Number(b.totalPrice) - Number(a.totalPrice);
        } else if (sortBy === "popular") {
          // Сортировка по популярности (допустим, по количеству просмотров)
          return (b.viewCount || 0) - (a.viewCount || 0);
        } else {
          // Сортировка по производительности (допустим, по оценке производительности)
          return (b.performanceScore || 0) - (a.performanceScore || 0);
        }
      });
  }, [builds, debouncedSearch, sortBy, selectedCategory, priceRange]);

  // Рекомендуемые сборки - гарантируем наличие минимум 3 рекомендованных сборок
  const featuredBuilds = useMemo(() => {
    // Сначала пробуем найти сборки с высокой ценой или отмеченные как "featured"
    let featured = builds
      .filter((build) => build.featured || Number(build.totalPrice) > 90000)
      .sort(() => Math.random() - 0.5);

    // Если сборок меньше 3, добавляем самые дорогие из оставшихся
    if (featured.length < 3) {
      const otherBuilds = builds
        .filter((build) => !featured.some((f) => f.id === build.id))
        .sort((a, b) => Number(b.totalPrice) - Number(a.totalPrice))
        .slice(0, 3 - featured.length);

      featured = [...featured, ...otherBuilds];
    }

    // Если сборок всё равно меньше 3, добавляем любые оставшиеся
    if (featured.length < 3 && builds.length >= 3) {
      const remaining = builds
        .filter((build) => !featured.some((f) => f.id === build.id))
        .slice(0, 3 - featured.length);

      featured = [...featured, ...remaining];
    }

    return featured.slice(0, 3);
  }, [builds]);

  // Топовые сборки по соотношению цена/качество
  const bestValueBuilds = useMemo(() => {
    return builds
      .filter(
        (build) =>
          Number(build.totalPrice) > 50000 && Number(build.totalPrice) < 100000
      )
      .sort(
        (a, b) =>
          (b.performanceScore || 0) / Number(b.totalPrice) -
          (a.performanceScore || 0) / Number(a.totalPrice)
      )
      .slice(0, 4);
  }, [builds]);

  // Функция для определения категории сборки на основе её компонентов и цены
  const determineBuildCategory = (build: PcBuildResponse): BuildCategory => {
    const price = Number(build.totalPrice);
    let components: Record<string, string> = {};

    try {
      if (typeof build.components === "string") {
        components = JSON.parse(build.components);
      } else {
        components = build.components as any;
      }

      // Проверяем наличие мощной видеокарты для игровой сборки
      const gpuName = components.gpu?.toLowerCase();
      const hasGamingGpu =
        gpuName &&
        (gpuName.includes("rtx") ||
          gpuName.includes("gtx") ||
          gpuName.includes("rx 6") ||
          gpuName.includes("rx 7") ||
          gpuName.includes("radeon"));

      // Проверяем на рабочую станцию (обычно мощный процессор + много памяти)
      const cpuName = components.cpu?.toLowerCase();
      const hasWorkstationCpu =
        cpuName &&
        (cpuName.includes("i9") ||
          cpuName.includes("i7") ||
          cpuName.includes("ryzen 9") ||
          cpuName.includes("ryzen 7") ||
          cpuName.includes("xeon") ||
          cpuName.includes("threadripper"));

      // Определяем категорию по компонентам и цене
      if (hasGamingGpu && price > 80000) {
        return "gaming";
      } else if (hasWorkstationCpu && price > 100000) {
        return "workstation";
      } else if (price < 60000) {
        return "office";
      }

      // По умолчанию
      if (price > 80000) {
        return "gaming";
      } else {
        return "office";
      }
    } catch (e) {
      // Если не удалось определить категорию, используем цену
      if (price > 80000) {
        return "gaming";
      } else if (price > 120000) {
        return "workstation";
      } else {
        return "office";
      }
    }
  };

  // Устанавливаем title страницы
  useEffect(() => {
    document.title = PAGE_TITLES.CATALOG;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [buildsResponse, categoriesResponse] = await Promise.all([
          fetch(getApiUrl("/api/builds")),
          fetch(getApiUrl("/api/categories")),
        ]);

        const buildsData = await buildsResponse.json();
        const categoriesData = await categoriesResponse.json();

        // Добавляем поля для демонстрации интерфейса
        const enhancedBuilds = (buildsData.builds || []).map(
          (build: PcBuildResponse) => {
            // Определяем категорию сборки на основе цены и компонентов
            const category = determineBuildCategory(build);

            return {
              ...build,
              viewCount: Math.floor(Math.random() * 1000),
              performanceScore: Math.floor(Math.random() * 15000) + 5000,
              category: category,
              featured: Math.random() > 0.8,
            };
          }
        );

        setBuilds(enhancedBuilds);
        setCategories(categoriesData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
        setTimeout(() => setIsInitialLoad(false), 100);
      }
    };

    fetchData();
  }, []);

  const refreshData = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      const { fetchApi } = await import("../../utils/apiUtils");
      const response = await fetchApi("/api/builds");
      const data = await response.json();

      const enhancedBuilds = (data.builds || []).map(
        (build: PcBuildResponse) => {
          // Определяем категорию сборки на основе её характеристик
          const category = determineBuildCategory(build);

          return {
            ...build,
            viewCount: Math.floor(Math.random() * 1000),
            performanceScore: Math.floor(Math.random() * 15000) + 5000,
            category: category,
            featured: Math.random() > 0.8,
          };
        }
      );

      setBuilds(enhancedBuilds);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSortChange = (value: string | number) => {
    setSortBy(value as SortOption);
  };

  const handleCategoryChange = (category: BuildCategory) => {
    setSelectedCategory(category);
  };

  const handlePriceRangeChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const newValue = Number(event.target.value);
    setPriceRange((prev) => {
      const newRange = [...prev] as [number, number];
      newRange[index] = newValue;
      return newRange;
    });
  };

  const resetFilters = () => {
    setSearch("");
    setSortBy("newest");
    setPriceRange([0, minMaxPrice[1]]);
    setSelectedCategory("all");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-8">
      {/* Упрощенный минималистичный хедер каталога */}
      <div className="relative mb-8">
        {/* Основной контент хедера с заголовком без фона */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Каталог{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                готовых сборок
              </span>
            </h1>

            <div className="flex items-center gap-4">
              <button
                onClick={refreshData}
                className="p-2 text-secondary-light hover:text-blue-400 transition-colors"
                title="Обновить каталог"
              >
                {isRefreshing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <RefreshCw className="w-5 h-5" />
                )}
              </button>

              {isAuthenticated && (
                <Link href="/configurator">
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-medium transition-colors">
                    <Plus className="w-4 h-4" />
                    <span>Создать сборку</span>
                  </button>
                </Link>
              )}
            </div>
          </div>

          {/* Улучшенная панель фильтров и поиска */}
          <div className="mt-8 bg-primary/30 border border-primary-border/40 rounded-lg p-4">
            {/* Поисковая строка */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск по названию или компонентам..."
                  className="w-full px-4 py-3 pl-10 bg-primary/60 border border-primary-border rounded-lg 
                           text-white placeholder:text-secondary-light focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <Search className="absolute left-3 top-3 w-5 h-5 text-secondary-light" />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-3 text-secondary-light hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Улучшенная панель фильтров */}
            <div className="flex flex-wrap items-stretch gap-4">
              {/* Категории */}
              <div className="flex-1 min-w-[220px]">
                <div className="flex flex-wrap gap-2">
                  {buildCategories.map((category) => {
                    const Icon = category.icon;
                    const isActive = selectedCategory === category.id;
                    return (
                      <button
                        key={category.id}
                        onClick={() =>
                          handleCategoryChange(category.id as BuildCategory)
                        }
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border 
                                  transition-all duration-300 text-sm ${
                                    isActive
                                      ? "bg-gradient-to-b from-blue-500/10 to-blue-600/5 border-blue-500/30 text-blue-400"
                                      : "bg-primary/40 border-primary-border/40 text-secondary-light hover:bg-primary/50"
                                  }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${
                            isActive ? "text-blue-400" : "text-secondary-light"
                          }`}
                        />
                        <span>{category.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-4 flex-wrap">
                {/* Сортировка */}
                <div className="w-[220px]">
                  <Select
                    value={sortBy}
                    onChange={handleSortChange}
                    options={sortOptions}
                    placeholder="Сортировка"
                  />
                </div>

                {/* Фильтры */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setIsPriceFilterVisible(!isPriceFilterVisible)
                    }
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/40 border border-primary-border/40
                            text-secondary-light hover:text-white hover:bg-primary/50 transition-all duration-300 text-sm"
                  >
                    <Filter className="w-4 h-4" />
                    <span>
                      {isPriceFilterVisible ? "Скрыть фильтры" : "Фильтр цены"}
                    </span>
                  </button>

                  {/* Сброс фильтров */}
                  {(search ||
                    sortBy !== "newest" ||
                    selectedCategory !== "all" ||
                    priceRange[0] > 0 ||
                    priceRange[1] < minMaxPrice[1]) && (
                    <button
                      onClick={resetFilters}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/30 text-red-400 
                              hover:bg-red-500/10 transition-all duration-300 text-sm"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Сбросить</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Фильтр по цене */}
            <AnimatePresence>
              {isPriceFilterVisible && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 overflow-hidden"
                >
                  <div className="p-4 border border-primary-border/40 rounded-lg bg-primary/40">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-white font-medium">Диапазон цен</h3>
                      <div className="text-secondary-light text-sm">
                        от {priceRange[0].toLocaleString("ru")} ₽ до{" "}
                        {priceRange[1].toLocaleString("ru")} ₽
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="text-secondary-light text-sm block mb-2">
                          Минимальная цена
                        </label>
                        <input
                          type="range"
                          min={minMaxPrice[0]}
                          max={minMaxPrice[1]}
                          value={priceRange[0]}
                          onChange={(e) => handlePriceRangeChange(e, 0)}
                          step={1000}
                          className="w-full h-2 bg-gradient-from/20 rounded-lg appearance-none cursor-pointer
                                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                                    [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full"
                        />
                        <div className="flex justify-between text-xs text-secondary-light mt-1">
                          <span>{minMaxPrice[0].toLocaleString("ru")} ₽</span>
                          <span>{minMaxPrice[1].toLocaleString("ru")} ₽</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-secondary-light text-sm block mb-2">
                          Максимальная цена
                        </label>
                        <input
                          type="range"
                          min={minMaxPrice[0]}
                          max={minMaxPrice[1]}
                          value={priceRange[1]}
                          onChange={(e) => handlePriceRangeChange(e, 1)}
                          step={1000}
                          className="w-full h-2 bg-gradient-from/20 rounded-lg appearance-none cursor-pointer
                                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                                    [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full"
                        />
                        <div className="flex justify-between text-xs text-secondary-light mt-1">
                          <span>{minMaxPrice[0].toLocaleString("ru")} ₽</span>
                          <span>{minMaxPrice[1].toLocaleString("ru")} ₽</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Основной список сборок */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          {selectedCategory === "all"
            ? "Все сборки"
            : selectedCategory === "gaming"
              ? "Игровые сборки"
              : selectedCategory === "workstation"
                ? "Рабочие станции"
                : "Офисные сборки"}
          <span className="text-secondary-light text-lg font-normal ml-2">
            ({filteredBuilds.length})
          </span>
        </h2>

        {bestValueBuilds.length > 0 &&
          !debouncedSearch &&
          selectedCategory === "all" && (
            <Link
              href="#best-value"
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 transition-colors"
            >
              К лучшим предложениям
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={
            isLoading
              ? "loading"
              : filteredBuilds.length === 0
                ? "empty"
                : "content"
          }
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="animate-pulse bg-gradient-from/10 rounded-xl border border-primary-border overflow-hidden"
                >
                  <div className="aspect-[16/10] bg-gradient-from/20 rounded-t-lg" />
                  <div className="p-4 space-y-2">
                    <div className="h-5 bg-gradient-from/20 rounded w-3/4" />
                    <div className="h-4 bg-gradient-from/20 rounded w-1/2" />
                    <div className="h-px bg-gradient-from/10 my-3" />
                    <div className="flex justify-between">
                      <div className="h-4 bg-gradient-from/20 rounded w-1/3" />
                      <div className="h-4 bg-gradient-from/20 rounded w-1/4" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : filteredBuilds.length === 0 ? (
            <motion.div
              className="text-center py-16 bg-gradient-from/5 backdrop-blur-sm rounded-xl border border-primary-border/50"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <motion.div
                className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full 
                          bg-gradient-from/20 text-secondary-light/50 border border-primary-border/50"
                initial={{ y: 10 }}
                animate={{ y: [10, -10, 10] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }}
              >
                <SlidersHorizontal className="w-10 h-10" />
              </motion.div>
              <h3 className="text-xl font-medium text-white mb-3">
                {debouncedSearch
                  ? "Не найдено подходящих сборок"
                  : "В каталоге пока нет сборок"}
              </h3>
              <p className="text-secondary-light max-w-md mx-auto">
                {debouncedSearch
                  ? "Попробуйте изменить запрос поиска или сбросить фильтры"
                  : "Станьте первым, кто поделится своей конфигурацией ПК"}
              </p>

              {isAuthenticated && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Link
                    href="/configurator"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-500 
                               hover:bg-blue-600 text-white transition-all duration-300 mt-6"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Создать первую сборку</span>
                  </Link>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              key={`${debouncedSearch}-${sortBy}-${selectedCategory}`}
            >
              <AnimatePresence mode="wait">
                {filteredBuilds.map((build, index) => (
                  <motion.div
                    key={build.id}
                    variants={itemVariants}
                    layout
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.03 }}
                  >
                    <div className="relative">
                      <BuildCard build={build} categories={categories} />

                      {/* Интегрированная категория сборки - маленький значок в углу */}
                      {build.category && (
                        <motion.div
                          className="absolute top-3 right-3 z-10"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2 + index * 0.03 }}
                        >
                          {build.category === "gaming" && (
                            <div className="bg-red-500/20 backdrop-blur-sm text-xs px-2 py-1 rounded-full text-red-400 font-medium border border-red-500/20 flex items-center gap-1.5">
                              <Gamepad2 className="w-3 h-3" />
                              <span className="hidden sm:inline">Игровой</span>
                            </div>
                          )}
                          {build.category === "workstation" && (
                            <div className="bg-purple-500/20 backdrop-blur-sm text-xs px-2 py-1 rounded-full text-purple-400 font-medium border border-purple-500/20 flex items-center gap-1.5">
                              <Monitor className="w-3 h-3" />
                              <span className="hidden sm:inline">Рабочий</span>
                            </div>
                          )}
                          {build.category === "office" && (
                            <div className="bg-green-500/20 backdrop-blur-sm text-xs px-2 py-1 rounded-full text-green-400 font-medium border border-green-500/20 flex items-center gap-1.5">
                              <Cpu className="w-3 h-3" />
                              <span className="hidden sm:inline">Офисный</span>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Кнопка прокрутки наверх */}
      <motion.button
        className="fixed bottom-6 right-6 bg-gradient-from/30 backdrop-blur-sm p-3 rounded-full 
                border border-primary-border shadow-lg shadow-blue-900/20 text-secondary-light
                hover:text-white transition-all duration-300 hover:bg-gradient-from/50 z-50"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: scrollYProgress.get() > 0.2 ? 1 : 0, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <ArrowUp className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
