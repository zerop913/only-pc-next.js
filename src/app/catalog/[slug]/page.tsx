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
  ShoppingCartIcon,
  CalendarIcon,
  ComputerDesktopIcon,
  CurrencyDollarIcon,
  CpuChipIcon,
  WrenchScrewdriverIcon,
  PlusIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import { CATEGORY_PRIORITIES, CategorySlug } from "@/config/categoryPriorities";
import { useCart } from "@/contexts/CartContext";
import { PAGE_TITLES } from "@/config/pageTitles";

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
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "components"
  );
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [buttonState, setButtonState] = useState<"default" | "added" | "cart">(
    "default"
  );
  const router = useRouter();
  const { addToCart, isItemInCart } = useCart();

  // Устанавливаем title страницы
  useEffect(() => {
    if (build) {
      document.title = `${build.name} - Готовая сборка ПК | OnlyPC`;
    } else {
      document.title = PAGE_TITLES.CATALOG;
    }
  }, [build]);

  // Эффект для проверки состояния корзины при изменении slug
  useEffect(() => {
    // Проверяем, есть ли товар в корзине при изменении slug
    const inCart = isItemInCart(slug);
    setIsAddedToCart(inCart);
    setButtonState(inCart ? "cart" : "default");
  }, [slug, isItemInCart]);

  useEffect(() => {
    const fetchBuildDetails = async () => {
      try {
        const buildResponse = await fetch(`/api/builds/${slug}`);
        const buildData = await buildResponse.json();

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

        // Проверяем, есть ли сборка уже в корзине
        if (processedBuild.id) {
          const inCart =
            isItemInCart(processedBuild.id.toString()) || isItemInCart(slug);
          setIsAddedToCart(inCart);

          // Если товар в корзине, устанавливаем состояние кнопки "корзина"
          if (inCart) {
            setButtonState("cart");
          }
        }
      } catch (error) {
        console.error("Error fetching build details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBuildDetails();
  }, [slug, isItemInCart]);

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
                  <div className="w-16 h-16 bg-gradient-from/20 rounded-lg" />
                  <div className="flex-1 space-y-4">
                    <div className="h-4 w-32 bg-gradient-from/20 rounded" />
                    <div className="h-6 w-2/3 bg-gradient-from/20 rounded" />
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
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
      {/* Хлебные крошки */}
      <motion.div
        className="mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Link
          href="/catalog"
          className="flex items-center gap-2 text-sm text-secondary-light hover:text-white transition-colors w-fit"
        >
          ← К списку сборок
        </Link>
      </motion.div>

      {/* Основной контент */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Левая основная колонка с компонентами */}
        <div className="xl:col-span-8 space-y-8">
          {/* Шапка сборки */}
          <motion.div
            className="bg-gradient-from/10 rounded-2xl p-8 border border-primary-border overflow-hidden relative group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Градиентная полоса сверху */}
            <div
              className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/40 via-purple-500/40 to-blue-500/40 
                     opacity-70"
            />
            {/* Графический элемент декора */}
            <div className="absolute top-0 right-0 w-64 h-64 -mr-32 -mt-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>{" "}
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="px-3 py-1 rounded-full bg-blue-500/20 text-white text-sm border border-blue-500/30 backdrop-blur-sm font-medium">
                  Сборка #{build.id}
                </div>
                <div className="bg-gradient-from/30 text-white px-3 py-1 rounded-full text-xs border border-primary-border/40">
                  {new Date(build.createdAt).toLocaleDateString("ru", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white mb-4 leading-tight">
                {build.name}
              </h1>
            </div>
          </motion.div>

          {/* Список компонентов */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <ComputerDesktopIcon className="w-6 h-6 text-blue-400/70" />
              Компоненты сборки
            </h2>

            {sortComponents(build.components).map(
              ({ category, product }, index) => {
                return (
                  <motion.div
                    key={`${product.id}-${index}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="group"
                  >
                    <Link
                      href={`/product/${product.slug}?category=${category.slug}`}
                      className="block"
                    >
                      <div className="p-5 bg-gradient-from/20 rounded-xl border border-primary-border/50 hover:border-blue-500/50 transition-all duration-300 relative overflow-hidden">
                        <div className="absolute inset-0 border-2 border-transparent hover:border-blue-400/20 rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-[auto_auto_1fr] gap-4 items-center">
                          {/* Номер и категория */}
                          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-from/20 border border-primary-border backdrop-blur-sm flex-shrink-0">
                            <span className="text-white font-medium">
                              {index + 1}
                            </span>
                          </div>

                          {/* Изображение */}
                          <div className="w-20 h-20 relative bg-gradient-from/10 rounded-lg overflow-hidden flex-shrink-0 border border-primary-border/40">
                            {product.image ? (
                              <Image
                                src={formatImagePath(
                                  category.slug,
                                  product.image
                                )}
                                alt={product.title}
                                fill
                                className="object-contain p-2"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <PhotoIcon className="w-6 h-6 text-secondary-light/30" />
                              </div>
                            )}
                          </div>

                          {/* Информация о продукте */}
                          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-white text-xs border border-blue-500/30 backdrop-blur-sm inline-block">
                                {category.name}
                              </div>
                              <div className="text-lg font-semibold text-white/90">
                                {Number(product.price).toLocaleString()} ₽
                              </div>
                            </div>
                            <h3 className="text-base font-medium text-white group-hover:text-blue-300 transition-colors line-clamp-2">
                              {product.title}
                            </h3>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              }
            )}
          </div>
        </div>

        {/* Правая боковая колонка с итогами и действиями */}
        <div className="xl:col-span-4">
          <div className="sticky top-24">
            <motion.div
              className="bg-gradient-from/20 rounded-xl border border-primary-border overflow-hidden mb-6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              {/* Заголовок с градиентной линией */}
              <div className="relative p-5 border-b border-primary-border/50">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <ChartBarIcon className="w-6 h-6 text-blue-400/70" />
                  Итоги сборки
                </h2>
              </div>

              <div className="p-5">
                {/* Выделенный блок с ценой */}
                <div className="bg-gradient-from/40 p-4 mb-5 rounded-lg border border-primary-border relative overflow-hidden">
                  {/* Декоративный элемент */}
                  <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 bg-blue-500/5 rounded-full blur-xl pointer-events-none"></div>

                  <div className="flex justify-between items-center relative z-10">
                    <div>
                      <div className="text-sm text-secondary-light mb-1">
                        Общая стоимость
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {Number(build.totalPrice).toLocaleString()} ₽
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/20 border border-blue-500/30">
                      <CurrencyDollarIcon className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>
                </div>

                {/* Автор сборки */}
                <div className="flex items-center gap-3 p-3 bg-gradient-from/30 rounded-lg border border-primary-border/50 mb-5 hover:border-blue-500/30 transition-all duration-300">
                  <UserIcon className="w-5 h-5 text-blue-400/80" />
                  <div>
                    <div className="text-xs text-secondary-light">Автор</div>
                    <div className="text-white font-medium">
                      {getUserName(build)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Кнопка купить */}
              <div className="px-5 mb-4">
                <motion.button
                  className={`w-full relative overflow-hidden font-bold py-3 px-6 rounded-lg transition-all duration-300 group backdrop-blur-sm border ${
                    buttonState === "added"
                      ? "bg-green-500/30 hover:bg-green-500/40 border-green-500/50 text-white"
                      : buttonState === "cart"
                        ? "bg-blue-400/30 hover:bg-blue-400/40 border-blue-400/50 text-white"
                        : "bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30 text-white"
                  }`}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (
                      build &&
                      !isItemInCart(slug) &&
                      buttonState === "default"
                    ) {
                      // Создаем объект с компонентами для отображения в корзине
                      const cartComponents: Record<
                        string,
                        { name: string; categoryName: string }
                      > = {};

                      // Добавляем основные компоненты
                      build.components.forEach(({ category, product }) => {
                        cartComponents[category.slug] = {
                          name: product.title,
                          categoryName: category.name,
                        };
                      });

                      // Добавляем сборку в корзину
                      addToCart({
                        id: build.id,
                        slug: slug,
                        name: build.name,
                        type: "build",
                        price: parseFloat(build.totalPrice),
                        quantity: 1,
                        components: cartComponents,
                        // Используем изображение первого компонента (обычно процессора или видеокарты)
                        image: build.components[0]?.product.image || "",
                      });

                      // Изменяем состояние кнопки на "добавлено"
                      setButtonState("added");

                      // Через 2 секунды меняем на состояние "корзина"
                      setTimeout(() => {
                        setButtonState("cart");
                      }, 2000);
                    } else {
                      // Перенаправляем на страницу корзины
                      router.push("/cart");
                    }
                  }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {buttonState === "added" ? (
                      <>
                        <CheckIcon className="w-5 h-5" />
                        Товар добавлен
                      </>
                    ) : buttonState === "cart" || isItemInCart(slug) ? (
                      <>
                        <ShoppingCartIcon className="w-5 h-5" />
                        Перейти в корзину
                      </>
                    ) : (
                      <>
                        <ShoppingCartIcon className="w-5 h-5" />
                        Добавить в корзину
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-blue-400/10 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                </motion.button>
              </div>

              {/* Кнопка редактирования */}
              <div className="px-5 pb-5">
                <Link
                  href={`/configurator?loadBuild=${build.slug}`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg 
                          bg-gradient-from/30 hover:bg-gradient-from/50 text-white 
                          transition-all duration-300 
                          border border-primary-border text-sm font-medium"
                >
                  <WrenchScrewdriverIcon className="w-5 h-5 text-blue-400/70" />
                  Редактировать в конфигураторе
                </Link>
              </div>
            </motion.div>

            {/* Рекомендуемые дополнения */}
            <motion.div
              className="bg-gradient-from/20 rounded-xl border border-primary-border overflow-hidden"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              {/* Заголовок с градиентной линией */}
              <div className="relative p-5 border-b border-primary-border/50">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  <CpuChipIcon className="w-5 h-5 text-blue-400/70" />
                  Соберите похожую
                </h3>
              </div>

              <div className="p-5">
                <p className="text-secondary-light text-sm mb-4">
                  Возьмите эту сборку за основу для создания собственной
                  конфигурации
                </p>

                <Link
                  href="/configurator"
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg 
                          bg-blue-500/20 hover:bg-blue-500/30 text-white
                          transition-all duration-300 
                          border border-blue-500/30 backdrop-blur-sm text-sm font-medium group relative overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <ComputerDesktopIcon className="w-5 h-5" />
                    Собрать похожую
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-400/10 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildDetailPage;
