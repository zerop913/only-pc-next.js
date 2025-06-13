import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import {
  FiltersResponse,
  SelectedFilters,
  ProductFilters,
  Filter,
} from "../types/filters";

const INITIAL_VISIBLE_FILTERS = 5; // Добавляем константу

interface UseFiltersProps {
  onFilterChange: (
    filters: Record<string, string[]>,
    priceRange: [number, number]
  ) => void;
  categorySlug: string;
  subcategorySlug?: string;
}

interface UseFiltersReturn {
  filtersData: FiltersResponse | undefined;
  selectedFilters: SelectedFilters;
  expandedFilters: Record<string, boolean>;
  handleFilterChange: (
    filterSlug: string,
    value: string,
    isCharacteristic: boolean
  ) => void;
  toggleFilter: (type: string) => void;
  handlePriceRangeChange: (newRange: [number, number]) => void;
  handleClearFilters: () => void;
  isResetting: boolean;
}

// Функция загрузки фильтров
const fetchFilters = async (url: string) => {
  console.log("Fetching filters from:", url);
  try {
    const response = await fetch(url);
    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", response.status, errorText);
      throw new Error(
        `Failed to fetch filters: ${response.status} ${errorText}`
      );
    }

    const data = await response.json();
    console.log("Filters data received:", data);
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};

export function useFilters({
  onFilterChange,
  categorySlug,
  subcategorySlug,
}: UseFiltersProps): UseFiltersReturn {
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
  const [activeFilters, setActiveFilters] = useState<ProductFilters>({});
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [previousFiltersData, setPreviousFiltersData] = useState<
    FiltersResponse | undefined
  >(undefined);
  const filtersUrl = categorySlug
    ? `/api/products/${categorySlug}${
        subcategorySlug ? `/${subcategorySlug}` : ""
      }?filters=true${
        Object.keys(activeFilters).length > 0
          ? `&dynamic=true&filterData=${encodeURIComponent(JSON.stringify(activeFilters))}`
          : ""
      }`
    : null;

  // Используем SWR для загрузки фильтров с обработчиками для отслеживания состояния загрузки
  const {
    data: filtersData,
    mutate: refreshFiltersData,
    isValidating,
  } = useSWR(
    // Если есть URL, используем его как ключ
    filtersUrl,
    // Типизированная функция для загрузки фильтров
    filtersUrl ? (url: string) => fetchFilters(url) : null,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      dedupingInterval: 60000,
      onLoadingSlow: () => {
        setIsLoadingFilters(true);
      },
      onSuccess: (data) => {
        setIsLoadingFilters(false);
        // Сохраняем текущие данные как предыдущие для следующих обновлений
        if (data) {
          setPreviousFiltersData(data);
        }
      },
      onError: () => {
        setIsLoadingFilters(false);
      },
      // Используем предыдущие данные во время загрузки новых
      fallbackData: previousFiltersData,
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
        .forEach((filter: Filter) => {
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
        }); // Обновляем активные фильтры для динамического обновления состояния фильтров
        const newActiveFilters: ProductFilters = {
          brands:
            newFilters.brand.size > 0
              ? Array.from(newFilters.brand)
              : undefined,
          characteristics: {},
        };

        if (newFilters.priceRange[0] !== 0 || newFilters.priceRange[1] !== 0) {
          newActiveFilters.priceMin = newFilters.priceRange[0];
          newActiveFilters.priceMax = newFilters.priceRange[1];
        }

        newFilters.characteristics.forEach((values, slug) => {
          if (!newActiveFilters.characteristics)
            newActiveFilters.characteristics = {};
          newActiveFilters.characteristics[slug] = Array.from(values);
        });

        // Устанавливаем активные фильтры для получения динамических фильтров
        setActiveFilters(newActiveFilters);

        // И выполняем фильтрацию товаров
        await onFilterChange(apiFilters, newFilters.priceRange);

        // Вручную обновляем данные фильтров
        await refreshFiltersData();
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
    [onFilterChange, refreshFiltersData]
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

      // Обновляем активные фильтры для динамического обновления
      const newActiveFilters: ProductFilters = {
        priceMin: newRange[0],
        priceMax: newRange[1],
        brands:
          selectedFilters.brand.size > 0
            ? Array.from(selectedFilters.brand)
            : undefined,
        characteristics: {},
      };

      selectedFilters.characteristics.forEach((values, slug) => {
        if (!newActiveFilters.characteristics)
          newActiveFilters.characteristics = {};
        newActiveFilters.characteristics[slug] = Array.from(values);
      });

      // Обновляем активные фильтры
      setActiveFilters(newActiveFilters);

      onFilterChange(apiFilters, newRange);

      // Обновляем данные фильтров
      refreshFiltersData();
    },
    [selectedFilters, onFilterChange, refreshFiltersData]
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
      // Очищаем активные фильтры
      setActiveFilters({});

      onFilterChange({}, [
        filtersData.priceRange.min,
        filtersData.priceRange.max,
      ]);

      // Обновляем данные фильтров
      refreshFiltersData();

      setTimeout(() => setIsResetting(false), 100);
    }
  }, [filtersData, onFilterChange, refreshFiltersData]);

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
