import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { FiltersResponse, SelectedFilters } from "../types/filters";

const INITIAL_VISIBLE_FILTERS = 5; // Добавляем константу

interface UseFiltersProps {
  onFilterChange: (
    filters: Record<string, string[]>,
    priceRange: [number, number]
  ) => void;
  categorySlug: string;
  subcategorySlug?: string;
}

// Функция загрузки фильтров
const fetchFilters = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch filters");
  }
  return response.json();
};

export function useFilters({
  onFilterChange,
  categorySlug,
  subcategorySlug,
}: UseFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedFilters, setSelectedFilters] = useState<SelectedFilters>({
    brand: new Set(),
    characteristics: new Map(),
    priceRange: [0, 0],
  });
  const [expandedFilters, setExpandedFilters] = useState<
    Record<string, boolean>
  >({});
  const [isResetting, setIsResetting] = useState(false);

  // URL для загрузки фильтров
  const filtersUrl = categorySlug
    ? `/api/products/${categorySlug}${
        subcategorySlug ? `/${subcategorySlug}` : ""
      }?filters=true`
    : null;

  // Используем SWR для загрузки фильтров
  const { data: filtersData } = useSWR<FiltersResponse>(
    filtersUrl,
    filtersUrl ? fetchFilters : null,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      dedupingInterval: 60000,
    }
  );

  // Инициализация фильтров
  useEffect(() => {
    if (filtersData) {
      const initialExpanded: Record<string, boolean> = {
        brand: true,
        price: true,
      };

      filtersData.characteristics
        .slice(0, INITIAL_VISIBLE_FILTERS - 1)
        .forEach((filter) => {
          initialExpanded[filter.slug] = true;
        });

      setExpandedFilters(initialExpanded);
    }
  }, [filtersData]);

  // Инициализация фильтров из URL
  useEffect(() => {
    if (!filtersData) return;

    const newFilters: SelectedFilters = {
      brand: new Set(),
      characteristics: new Map(),
      priceRange: [filtersData.priceRange.min, filtersData.priceRange.max],
    };

    // Загружаем бренды из URL
    searchParams.getAll("brand").forEach((brand) => {
      newFilters.brand.add(brand);
    });

    // Загружаем характеристики из URL
    for (const [key, value] of searchParams.entries()) {
      if (key.startsWith("char[") && key.endsWith("]")) {
        const slug = key.slice(5, -1);
        const values = newFilters.characteristics.get(slug) || new Set();
        values.add(value);
        newFilters.characteristics.set(slug, values);
      }
    }

    // Загружаем цены из URL
    const priceMin = searchParams.get("priceMin");
    const priceMax = searchParams.get("priceMax");
    if (priceMin || priceMax) {
      newFilters.priceRange = [
        priceMin ? Number(priceMin) : filtersData.priceRange.min,
        priceMax ? Number(priceMax) : filtersData.priceRange.max,
      ];
    }

    setSelectedFilters(newFilters);
  }, [searchParams, filtersData]);

  const handleFilterChange = useCallback(
    async (filterSlug: string, value: string, isCharacteristic: boolean) => {
      // Перемещаем логику в асинхронный колбэк
      const updateFilters = async (newFilters: SelectedFilters) => {
        const apiFilters: Record<string, string[]> = {};
        if (newFilters.brand.size > 0) {
          apiFilters["brand"] = Array.from(newFilters.brand);
        }

        newFilters.characteristics.forEach((values, slug) => {
          apiFilters[`char[${slug}]`] = Array.from(values);
        });

        await onFilterChange(apiFilters, newFilters.priceRange);
      };

      setSelectedFilters((prev) => {
        const newFilters = { ...prev };

        if (isCharacteristic) {
          const values =
            newFilters.characteristics.get(filterSlug) || new Set();
          if (values.has(value)) {
            values.delete(value);
          } else {
            values.add(value);
          }

          if (values.size === 0) {
            newFilters.characteristics.delete(filterSlug);
          } else {
            newFilters.characteristics.set(filterSlug, values);
          }
        } else {
          if (newFilters.brand.has(value)) {
            newFilters.brand.delete(value);
          } else {
            newFilters.brand.add(value);
          }
        }

        // Запускаем асинхронное обновление после обновления состояния
        Promise.resolve().then(() => updateFilters(newFilters));
        return newFilters;
      });
    },
    [onFilterChange]
  );

  const toggleFilter = useCallback((type: string) => {
    setExpandedFilters((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  }, []);

  const handlePriceRangeChange = useCallback(
    (newRange: [number, number]) => {
      setSelectedFilters((prev) => ({
        ...prev,
        priceRange: newRange,
      }));

      // Формируем параметры для API
      const apiFilters: Record<string, string[]> = {};
      if (selectedFilters.brand.size > 0) {
        apiFilters["brand"] = Array.from(selectedFilters.brand);
      }

      selectedFilters.characteristics.forEach((values, slug) => {
        apiFilters[`char[${slug}]`] = Array.from(values);
      });

      onFilterChange(apiFilters, newRange);
    },
    [selectedFilters, onFilterChange]
  );

  const handleClearFilters = useCallback(() => {
    if (filtersData?.priceRange) {
      setIsResetting(true);
      const newFilters: SelectedFilters = {
        brand: new Set<string>(),
        characteristics: new Map<string, Set<string>>(),
        priceRange: [
          filtersData.priceRange.min,
          filtersData.priceRange.max,
        ] as [number, number],
      };

      setSelectedFilters(newFilters);
      onFilterChange({}, [
        filtersData.priceRange.min,
        filtersData.priceRange.max,
      ]);

      setTimeout(() => setIsResetting(false), 100);
    }
  }, [filtersData, onFilterChange]);

  return {
    filtersData,
    selectedFilters,
    expandedFilters,
    handleFilterChange,
    toggleFilter,
    handlePriceRangeChange,
    handleClearFilters,
    isResetting, // Добавляем в возвращаемый объект
  };
}

// Экспортируем по умолчанию именованный хук
export default useFilters;
