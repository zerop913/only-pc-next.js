import Link from "next/link";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

interface ProductBreadcrumbsProps {
  categoryName: string;
  categorySlug: string;
  subcategoryName?: string;
  subcategorySlug?: string;
  productName: string;
  preservePage?: boolean;
}

export default function ProductBreadcrumbs({
  categoryName,
  categorySlug,
  subcategoryName,
  subcategorySlug,
  productName,
  preservePage = true,
}: ProductBreadcrumbsProps) {
  const [queryParams, setQueryParams] = useState<string>("");

  // Сохраняем все параметры из URL при монтировании
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const currentParams = new URLSearchParams();

      // Копируем все параметры кроме category и subcategory
      urlParams.forEach((value, key) => {
        if (key !== "category" && key !== "subcategory") {
          currentParams.append(key, value);
        }
      });

      const paramsString = currentParams.toString();
      setQueryParams(paramsString ? `&${paramsString}` : "");
    }
  }, []);

  return (
    <nav aria-label="Навигация по сайту">
      <ol className="flex flex-wrap items-center text-sm text-secondary-light mb-5 sm:mb-7 overflow-x-auto whitespace-nowrap pb-2 backdrop-blur-sm bg-gradient-from/5 p-2 rounded-lg">
        <li className="flex items-center">
          <Link
            href={`/configurator${
              queryParams ? `?${queryParams.slice(1)}` : ""
            }`}
            className="hover:text-white transition-colors duration-200 hover:scale-105 transform px-1"
          >
            Конфигуратор
          </Link>
          <ChevronRightIcon className="w-3 h-3 mx-2 flex-shrink-0 text-gradient-from/70" />
        </li>

        <li className="flex items-center">
          <Link
            href={`/configurator?category=${categorySlug}${queryParams}`}
            className="hover:text-white transition-colors duration-200 hover:scale-105 transform px-1"
          >
            {categoryName}
          </Link>
          {(subcategoryName || productName) && (
            <ChevronRightIcon className="w-3 h-3 mx-2 flex-shrink-0 text-gradient-from/70" />
          )}
        </li>

        {subcategoryName && subcategorySlug && (
          <li className="flex items-center">
            <Link
              href={`/configurator?category=${categorySlug}&subcategory=${subcategorySlug}${queryParams}`}
              className="hover:text-white transition-colors duration-200 hover:scale-105 transform px-1"
            >
              {subcategoryName}
            </Link>
            <ChevronRightIcon className="w-3 h-3 mx-2 flex-shrink-0 text-gradient-from/70" />
          </li>
        )}

        <li className="text-white font-medium truncate max-w-[200px] sm:max-w-xs px-1">
          {productName}
        </li>
      </ol>
    </nav>
  );
}
