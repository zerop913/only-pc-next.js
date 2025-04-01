"use client";

import { useEffect, useState } from "react";
import { PcBuildResponse } from "@/types/pcbuild";
import { Product } from "@/types/product";
import { Category } from "@/types/category";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { ChartBarIcon, ClockIcon, UserIcon } from "@heroicons/react/24/outline";
import { CATEGORY_PRIORITIES, CategorySlug } from "@/config/categoryPriorities";

const getPriorityComponents = (components: Record<string, string>) => {
  return Object.entries(components)
    .sort((a, b) => {
      const orderA = CATEGORY_PRIORITIES[a[0] as CategorySlug] || 999;
      const orderB = CATEGORY_PRIORITIES[b[0] as CategorySlug] || 999;
      return orderA - orderB;
    })
    .map(([category, slug]) => ({ category, slug }));
};

const getUserName = (build: PcBuildResponse) => {
  if (!build.user?.profile) return "Пользователь";
  const { firstName, lastName } = build.user.profile;
  if (firstName && lastName) return `${firstName} ${lastName}`;
  if (firstName) return firstName;
  if (lastName) return lastName;
  return build.user.email.split("@")[0];
};

export default function CatalogPage() {
  const [builds, setBuilds] = useState<PcBuildResponse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const [productsCache, setProductsCache] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    const fetchBuilds = async () => {
      try {
        const response = await fetch("/api/builds");
        const data = await response.json();
        setBuilds(data.builds || []);
      } catch (error) {
        console.error("Error fetching builds:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBuilds();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProductsInfo = async () => {
      const productMap = new Map<string, string>();

      for (const build of builds) {
        const components =
          typeof build.components === "string"
            ? JSON.parse(build.components)
            : build.components;

        for (const [categorySlug, productSlug] of Object.entries(components)) {
          if (!productMap.has(productSlug as string)) {
            try {
              const response = await fetch(
                `/api/products/${categorySlug}/${productSlug}-p-${productSlug}`
              );
              if (!response.ok) throw new Error("Product not found");

              const data = await response.json();
              if (data && data.title) {
                productMap.set(productSlug as string, data.title);
              }
            } catch (error) {
              console.error(`Error fetching product ${productSlug}:`, error);
              productMap.set(productSlug as string, "Товар не найден");
            }
          }
        }
      }

      setProductsCache(Object.fromEntries(productMap));
    };

    if (builds.length > 0) {
      fetchProductsInfo();
    }
  }, [builds]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-primary rounded-xl p-6 border border-primary-border">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Каталог готовых сборок
            </h1>
            <p className="text-secondary-light">
              {builds.length} {builds.length === 1 ? "сборка" : "сборок"} в
              каталоге
            </p>
          </div>

          {isAuthenticated && (
            <Link
              href="/configurator"
              className="px-4 py-2 rounded-lg bg-gradient-from/20 
                       hover:bg-gradient-from/30 text-secondary-light 
                       hover:text-white transition-all duration-300 
                       border border-primary-border text-sm"
            >
              Создать сборку
            </Link>
          )}
        </div>

        {builds.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-secondary-light">Сборки не найдены</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {builds.map((build) => (
              <Link key={build.id} href={`/catalog/${build.slug}`}>
                <div
                  className="group relative bg-gradient-from/10 rounded-xl border border-primary-border overflow-hidden
                             transition-all duration-300 hover:bg-gradient-from/20 hover:border-blue-500/30"
                >
                  <div
                    className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 
                                opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  />

                  <div className="p-5 border-b border-primary-border/30">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <h3 className="text-lg font-medium text-white line-clamp-1 group-hover:text-blue-400 transition-colors">
                        {build.name}
                      </h3>
                      <span className="flex-shrink-0 px-2 py-0.5 bg-gradient-from/30 rounded-full text-sm text-secondary-light border border-primary-border/50">
                        #{build.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <UserIcon className="w-4 h-4 text-blue-400" />
                        <span className="text-secondary-light group-hover:text-white transition-colors">
                          {getUserName(build)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-secondary-light">
                        <ClockIcon className="w-4 h-4 text-blue-400" />
                        <span>
                          {new Date(build.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="mb-4 space-y-2">
                      {getPriorityComponents(build.components)
                        .slice(0, 3)
                        .map(({ category, slug }) => (
                          <div
                            key={`${category}-${slug}`}
                            className="flex items-center gap-2.5 text-sm text-secondary-light"
                          >
                            <div className="w-6 h-6 rounded-md bg-gradient-from/30 p-1 flex-shrink-0">
                              <img
                                src={`/${
                                  categories.find((c) => c.slug === category)
                                    ?.icon || ""
                                }`}
                                alt=""
                                className="w-full h-full opacity-70 group-hover:opacity-100 transition-opacity"
                              />
                            </div>
                            <span className="truncate group-hover:text-white transition-colors">
                              {productsCache[slug as string] || "Загрузка..."}
                            </span>
                          </div>
                        ))}
                      {Object.keys(build.components).length > 3 && (
                        <div className="text-sm text-blue-400 pl-8">
                          и ещё {Object.keys(build.components).length - 3}...
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-primary-border/30">
                      <div>
                        <div className="text-sm text-secondary-light">
                          Стоимость
                        </div>
                        <div className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                          {Number(build.totalPrice).toLocaleString()} ₽
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <ChartBarIcon className="w-4 h-4 text-blue-400" />
                        <span className="text-secondary-light">
                          {Object.keys(build.components).length} компонентов
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
