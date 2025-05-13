import { useState, useEffect } from "react";
import Link from "next/link";
import { ChartBarIcon, ClockIcon, UserIcon } from "@heroicons/react/24/outline";
import { PcBuildResponse } from "@/types/pcbuild";
import { Category } from "@/types/category";
import { formatPrice } from "@/utils/formatters";
import BuildCarousel from "./BuildCarousel";
import Image from "next/image";
import { CATEGORY_PRIORITIES, CategorySlug } from "@/config/categoryPriorities";

interface BuildCardProps {
  build: PcBuildResponse;
  categories: Category[];
}

// Определяем общий интерфейс для компонента изображения
interface ComponentImageType {
  image: string | null;
  categoryName: string;
  categoryIcon: string | undefined;
  title: string;
  categorySlug: string;
}

const BuildCard: React.FC<BuildCardProps> = ({ build, categories }) => {
  const [componentImages, setComponentImages] = useState<ComponentImageType[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchComponentImages = async () => {
      try {
        setIsLoading(true);
        const components =
          typeof build.components === "string"
            ? JSON.parse(build.components)
            : build.components;

        const componentsData = await Promise.all(
          Object.entries(components).map(
            async ([categorySlug, productSlug]) => {
              try {
                const url = `/api/products/${categorySlug}/${productSlug}-p-${productSlug}`;

                const response = await fetch(url);
                if (!response.ok) return null;

                const product = await response.json();

                const category = categories.find(
                  (cat) => cat.slug === categorySlug
                );

                return {
                  image: product.image
                    ? product.image.startsWith("http")
                      ? product.image
                      : `/${product.image}`
                    : null,
                  categoryName: category?.name || categorySlug,
                  categoryIcon: category?.icon,
                  title: product.title || "Компонент",
                  categorySlug: categorySlug,
                };
              } catch (error) {
                console.error(
                  `Error fetching product ${categorySlug}/${productSlug}:`,
                  error
                );
                return null;
              }
            }
          )
        );

        // Используем type guard для фильтрации и приведения типов
        const filteredComponents: ComponentImageType[] = componentsData.filter(
          (item): item is ComponentImageType => item !== null
        );

        setComponentImages(filteredComponents);
      } catch (error) {
        console.error("Error loading component images:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComponentImages();
  }, [build, categories]);

  const getUserName = () => {
    if (!build.user?.profile) return "Пользователь";
    const { firstName, lastName } = build.user.profile;
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (lastName) return lastName;
    return build.user.email?.split("@")[0] || "Пользователь";
  };

  const getPriorityComponents = (components: Record<string, string>) => {
    return Object.entries(components)
      .sort((a, b) => {
        const orderA = CATEGORY_PRIORITIES[a[0] as CategorySlug] || 999;
        const orderB = CATEGORY_PRIORITIES[b[0] as CategorySlug] || 999;
        return orderA - orderB;
      })
      .map(([category, slug]) => ({ category, slug }));
  };

  const prioritizedComponents =
    typeof build.components === "string"
      ? getPriorityComponents(JSON.parse(build.components))
      : getPriorityComponents(build.components);

  const formattedDate = new Date(build.createdAt).toLocaleDateString("ru", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Link href={`/catalog/${build.slug}`}>
      <div
        className="group relative bg-gradient-from/10 rounded-xl border border-primary-border overflow-hidden
                   transition-all duration-300 hover:bg-gradient-from/20 hover:border-blue-500/30 h-full"
      >
        <div
          className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 
                     opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        />

        {isLoading ? (
          <div className="aspect-[16/10] bg-gradient-from/20 animate-pulse" />
        ) : (
          <BuildCarousel images={componentImages} />
        )}

        <div className="p-4">
          <div className="mb-2">
            <div className="flex items-start justify-between mb-1.5">
              <h3 className="text-base font-medium text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                {build.name}
              </h3>
              <span className="flex-shrink-0 px-1.5 py-0.5 bg-gradient-from/30 rounded-full text-xs text-secondary-light border border-primary-border/50">
                #{build.id}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-secondary-light">
              <div className="flex items-center gap-0.5">
                <UserIcon className="w-3 h-3 text-blue-400" />
                <span className="truncate group-hover:text-white transition-colors">
                  {getUserName()}
                </span>
              </div>
              <div className="h-3 w-px bg-primary-border/50"></div>
              <div className="flex items-center gap-0.5">
                <ClockIcon className="w-3 h-3 text-blue-400" />
                <span>{formattedDate}</span>
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-1.5">
            {prioritizedComponents
              .slice(0, 3)
              .map(({ category, slug }, index) => {
                const cat = categories.find((c) => c.slug === category);
                const componentData = componentImages.find(
                  (img) => img.categorySlug === category
                );

                return (
                  <div
                    key={`${category}-${index}`}
                    className="flex items-center gap-1.5 text-xs text-secondary-light overflow-hidden"
                  >
                    {cat?.icon && (
                      <div className="w-4 h-4 flex-shrink-0 bg-gradient-from/30 rounded p-0.5">
                        <div className="relative w-full h-full">
                          <Image
                            src={`/${cat.icon}`}
                            alt=""
                            width={12}
                            height={12}
                            className="opacity-70 group-hover:opacity-100 transition-opacity"
                          />
                        </div>
                      </div>
                    )}
                    <span className="truncate group-hover:text-white transition-colors">
                      {componentData?.title || "Загрузка..."}
                    </span>
                  </div>
                );
              })}
          </div>

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-primary-border/30">
            <div>
              <div className="text-xs text-secondary-light mb-0">Цена</div>
              <div className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors">
                {formatPrice(Number(build.totalPrice))} ₽
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <ChartBarIcon className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-secondary-light">
                {
                  Object.keys(
                    typeof build.components === "string"
                      ? JSON.parse(build.components)
                      : build.components
                  ).length
                }{" "}
                комп.
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default BuildCard;
