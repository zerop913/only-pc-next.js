"use client";

import { useEffect, useState, useMemo } from "react";
import { PcBuildResponse } from "@/types/pcbuild";
import { Category } from "@/types/category";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, SlidersHorizontal, Star } from "lucide-react";
import BuildCard from "@/components/catalog/BuildCard";
import Select from "@/components/common/ui/Select";
import { useDebounce } from "@/hooks/useDebounce";

type SortOption = "newest" | "price-asc" | "price-desc";

export default function CatalogPage() {
  const [builds, setBuilds] = useState<PcBuildResponse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const debouncedSearch = useDebounce(search, 400);

  const sortOptions = [
    { value: "newest", label: "Сначала новые" },
    { value: "price-asc", label: "Сначала недорогие" },
    { value: "price-desc", label: "Сначала дорогие" },
  ];

  const filteredBuilds = useMemo(() => {
    return builds
      .filter((build) =>
        build.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
      .sort((a, b) => {
        if (sortBy === "newest") {
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        } else if (sortBy === "price-asc") {
          return Number(a.totalPrice) - Number(b.totalPrice);
        } else {
          return Number(b.totalPrice) - Number(a.totalPrice);
        }
      });
  }, [builds, debouncedSearch, sortBy]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [buildsResponse, categoriesResponse] = await Promise.all([
          fetch("/api/builds"),
          fetch("/api/categories"),
        ]);

        const buildsData = await buildsResponse.json();
        const categoriesData = await categoriesResponse.json();

        setBuilds(buildsData.builds || []);
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

  const handleSortChange = (value: string | number) => {
    setSortBy(value as SortOption);
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

  const featuredBuilds = useMemo(() => {
    return builds
      .filter((build) => Number(build.totalPrice) > 50000)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
  }, [builds]);

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-primary rounded-xl p-4 sm:p-6 border border-primary-border">
        {/* Рекомендованные сборки */}
        {!isLoading && featuredBuilds.length > 0 && !debouncedSearch && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-5">
              <Star className="w-5 h-5 text-yellow-400" />
              <h2 className="text-lg font-medium text-white">
                Рекомендуемые сборки
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {featuredBuilds.map((build) => (
                <BuildCard
                  key={`featured-${build.id}`}
                  build={build}
                  categories={categories}
                />
              ))}
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-primary-border/30 to-transparent mt-8" />
          </motion.div>
        )}

        <motion.div
          className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Каталог готовых сборок
            </h1>
            <p className="text-secondary-light">
              {filteredBuilds.length}{" "}
              {filteredBuilds.length === 1
                ? "сборка"
                : filteredBuilds.length > 1 && filteredBuilds.length < 5
                ? "сборки"
                : "сборок"}{" "}
              в каталоге
            </p>
          </div>

          <div className="flex gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-none lg:w-64">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск сборок..."
                className="w-full px-4 py-2.5 pl-10 bg-gradient-from/10 border border-primary-border rounded-lg 
                           text-white placeholder:text-secondary-light/70 focus:outline-none focus:ring-1 focus:ring-blue-500/30"
              />
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-secondary-light/70" />
            </div>

            <div className="w-52">
              <Select
                value={sortBy}
                onChange={handleSortChange}
                options={sortOptions}
                placeholder="Сортировка"
              />
            </div>

            {isAuthenticated && (
              <Link
                href="/configurator"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500/10 
                           hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 
                           transition-all duration-300 border border-blue-500/30 whitespace-nowrap"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Создать сборку</span>
              </Link>
            )}
          </div>
        </motion.div>

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
                className="text-center py-16"
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
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-500/10 
                                 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 
                                 transition-all duration-300 border border-blue-500/30 mt-6"
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
                key={`${debouncedSearch}-${sortBy}`}
              >
                <AnimatePresence mode="wait">
                  {filteredBuilds.map((build) => (
                    <motion.div
                      key={build.id}
                      variants={itemVariants}
                      layout
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <BuildCard build={build} categories={categories} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
