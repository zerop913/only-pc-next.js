"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PcBuildResponse } from "@/types/pcbuild";
import { Product } from "@/types/product";
import { Category } from "@/types/category";
import Image from "next/image";
import Link from "next/link";
import {
  PhotoIcon,
  ChartBarIcon,
  ClockIcon,
  UserIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import { CATEGORY_PRIORITIES, CategorySlug } from "@/config/categoryPriorities";

interface DetailedComponent {
  category: Category;
  product: Product;
}

interface DetailedBuild extends Omit<PcBuildResponse, "components"> {
  components: DetailedComponent[];
}

const formatImagePath = (
  categorySlug: string,
  imagePath: string | null
): string => {
  if (!imagePath) return "";
  if (imagePath.startsWith("http")) return imagePath;
  if (imagePath.startsWith("/")) return imagePath;
  return `/${imagePath}`;
};

const getUserName = (build: DetailedBuild) => {
  if (!build.user) return "Пользователь";
  const { profile } = build.user;
  if (profile?.firstName && profile?.lastName)
    return `${profile.firstName} ${profile.lastName}`;
  if (profile?.firstName) return profile.firstName;
  if (profile?.lastName) return profile.lastName;
  return build.user.email?.split("@")[0] || "Пользователь";
};

const sortComponents = (components: DetailedComponent[]) => {
  return [...components].sort((a, b) => {
    const orderA = CATEGORY_PRIORITIES[a.category.slug as CategorySlug] || 999;
    const orderB = CATEGORY_PRIORITIES[b.category.slug as CategorySlug] || 999;
    return orderA - orderB;
  });
};

const BuildDetailPage = ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = use(params);
  const [build, setBuild] = useState<DetailedBuild | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(
    new Set()
  );

  const toggleProductCharacteristics = (productId: number) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  useEffect(() => {
    const fetchBuildDetails = async () => {
      try {
        const buildResponse = await fetch(`/api/builds/${slug}`);
        const buildData = await buildResponse.json();
        console.log("Build data:", buildData); // Добавляем для отладки

        if (!buildResponse.ok) throw new Error(buildData.error);

        if (!buildData.build) {
          throw new Error("Invalid build data received");
        }

        // Проверяем структуру данных перед установкой
        const processedBuild = {
          ...buildData.build,
          user: buildData.build.user || null,
          components: buildData.build.components || [],
        };

        setBuild(processedBuild);
      } catch (error) {
        console.error("Error fetching build details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBuildDetails();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-primary rounded-xl p-6 border border-primary-border">
          <div className="animate-pulse space-y-8">
            {/* Заголовок */}
            <div className="flex flex-col gap-4">
              <div className="h-4 w-32 bg-gradient-from/20 rounded" />
              <div className="h-8 w-2/3 bg-gradient-from/20 rounded" />
              <div className="flex gap-4">
                <div className="h-4 w-24 bg-gradient-from/20 rounded" />
                <div className="h-4 w-24 bg-gradient-from/20 rounded" />
              </div>
            </div>

            {/* Компоненты */}
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-gradient-from/10 rounded-xl p-6 border border-primary-border"
              >
                <div className="flex gap-6">
                  <div className="w-48 h-48 bg-gradient-from/20 rounded-lg" />
                  <div className="flex-1 space-y-4">
                    <div className="h-4 w-32 bg-gradient-from/20 rounded" />
                    <div className="h-6 w-2/3 bg-gradient-from/20 rounded" />
                    <div className="h-4 w-24 bg-gradient-from/20 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!build) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-white">Сборка не найдена</div>
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-primary rounded-xl p-6 border border-primary-border">
        {/* Верхняя часть с навигацией и общей информацией */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          {/* Левая колонка с навигацией и информацией */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4 mb-6">
              <Link
                href="/catalog"
                className="flex items-center gap-2 text-sm text-secondary-light hover:text-white transition-colors"
              >
                ← К списку сборок
              </Link>
              <div className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-sm border border-blue-500/20">
                Сборка #{build.id}
              </div>
            </div>

            <h1 className="text-2xl font-bold text-white mb-4">{build.name}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-secondary-light">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-blue-400" />
                <span>{getUserName(build)}</span>
              </div>
              <div className="flex items-center gap-2">
                <ChartBarIcon className="w-4 h-4 text-blue-400" />
                <span>{build.components.length} компонентов</span>
              </div>
              <div className="flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-blue-400" />
                <span>{new Date(build.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Правая колонка со стоимостью */}
          <div className="lg:w-[300px] shrink-0 bg-gradient-from/10 rounded-lg border border-primary-border p-4">
            <div className="text-sm text-secondary-light mb-1">
              Общая стоимость
            </div>
            <div className="text-2xl font-bold text-white mb-4">
              {Number(build.totalPrice).toLocaleString()} ₽
            </div>
            <Link
              href="/configurator"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg 
                       bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 
                       hover:text-blue-300 transition-all duration-300 
                       border border-blue-500/30 text-sm"
            >
              Собрать похожую
            </Link>
          </div>
        </div>

        {/* Список компонентов */}
        <div className="space-y-6">
          {sortComponents(build.components).map(
            ({ category, product }, index) => {
              const isExpanded = expandedProducts.has(product.id);

              return (
                <motion.div
                  key={`${product.id}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <div className="p-6 bg-gradient-from/10 hover:bg-gradient-from/20 rounded-xl border border-primary-border transition-all duration-300">
                    <div className="flex flex-col gap-6">
                      {/* Заголовок компонента */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20">
                          <span className="text-blue-400 font-medium">
                            {index + 1}
                          </span>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-gradient-from/30 text-secondary-light text-sm border border-primary-border/50">
                          {category.name}
                        </div>
                      </div>

                      {/* Основная информация */}
                      <div className="flex gap-8">
                        {/* Изображение */}
                        <div className="w-40 h-40 relative bg-gradient-from/5 rounded-xl overflow-hidden flex-shrink-0 border border-primary-border/30">
                          {product.image ? (
                            <Image
                              src={formatImagePath(
                                category.slug,
                                product.image
                              )}
                              alt={product.title}
                              fill
                              className="object-contain"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <PhotoIcon className="w-12 h-12 text-secondary-light/30" />
                            </div>
                          )}
                        </div>

                        {/* Информация о продукте */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-medium text-white mb-3">
                            {product.title}
                          </h3>
                          <div className="text-2xl font-semibold text-blue-400 mb-4">
                            {Number(product.price).toLocaleString()} ₽
                          </div>

                          {/* Характеристики */}
                          {product.characteristics && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
                                {(isExpanded
                                  ? product.characteristics
                                  : product.characteristics.slice(0, 6)
                                ).map((char, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-2 text-sm border-b border-primary-border/20 py-2"
                                  >
                                    <div className="flex-1 text-secondary-light">
                                      {char.type}
                                    </div>
                                    <div className="flex-1 text-white font-medium">
                                      {char.value}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {product.characteristics.length > 6 && (
                                <button
                                  onClick={() =>
                                    toggleProductCharacteristics(product.id)
                                  }
                                  className="inline-flex items-center gap-1 px-4 py-2 text-sm text-blue-400 
                                         hover:text-blue-300 transition-colors bg-gradient-from/10 
                                         hover:bg-gradient-from/20 rounded-lg border border-primary-border/30"
                                >
                                  {isExpanded ? "Скрыть" : "Все характеристики"}
                                  <ChevronDownIcon
                                    className={`w-4 h-4 transition-transform duration-300 ${
                                      isExpanded ? "rotate-180" : ""
                                    }`}
                                  />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
};

export default BuildDetailPage;
