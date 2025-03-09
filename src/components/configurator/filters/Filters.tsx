import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FunnelIcon,
  XMarkIcon,
  ChevronDownIcon,
  CheckIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";
import useSWR from "swr";
import { useSearchParams } from "next/navigation";

// Опция фильтра с значением, меткой и количеством
interface FilterOption {
  value: string;
  label: string;
  count: number;
}

// Диапазон цен
interface PriceRange {
  min: number;
  max: number;
}

// Характеристика с опциями
interface Filter {
  id: number;
  name: string;
  slug: string;
  options: FilterOption[];
}

// Ответ API с фильтрами
interface FiltersResponse {
  priceRange: PriceRange;
  brands: FilterOption[];
  characteristics: Filter[];
}

// Фильтры, которые будем передавать в API
interface ProductFilters {
  priceMin?: number;
  priceMax?: number;
  brands?: string[];
  characteristics?: Record<string, string[]>;
}

interface FiltersProps {
  categorySlug: string;
  subcategorySlug?: string;
  onFilterChange: (
    filters: Record<string, string[]>,
    priceRange: [number, number]
  ) => void;
}

const INITIAL_VISIBLE_FILTERS = 5;
const INITIAL_VISIBLE_VALUES = 5;

// Функция для парсинга параметров фильтров из URL
const parseFilterQueryString = async (
  queryString: string
): Promise<ProductFilters> => {
  const params = new URLSearchParams(queryString);
  const result: ProductFilters = {};

  // Парсим диапазон цен
  const priceMin = params.get("priceMin");
  const priceMax = params.get("priceMax");
  if (priceMin) result.priceMin = Number(priceMin);
  if (priceMax) result.priceMax = Number(priceMax);

  // Парсим бренды
  const brands = params.getAll("brand");
  if (brands.length > 0) result.brands = brands;

  // Парсим характеристики
  const characteristics: Record<string, string[]> = {};
  for (const [key, value] of params.entries()) {
    if (key.startsWith("char[") && key.endsWith("]")) {
      const charSlug = key.slice(5, -1);
      if (!characteristics[charSlug]) {
        characteristics[charSlug] = [];
      }
      characteristics[charSlug].push(value);
    }
  }

  if (Object.keys(characteristics).length > 0) {
    result.characteristics = characteristics;
  }

  return result;
};

const Filters = ({
  categorySlug,
  subcategorySlug,
  onFilterChange,
}: FiltersProps) => {
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, string[]>
  >({});
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<
    [number, number]
  >([0, 0]);
  const [isDraggingMin, setIsDraggingMin] = useState(false);
  const [isDraggingMax, setIsDraggingMax] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const [isMobile, setIsMobile] = useState(false);
  const [showAllFilters, setShowAllFilters] = useState(false);
  const [expandedFilters, setExpandedFilters] = useState<
    Record<string, boolean>
  >({});

  // URL для загрузки фильтров
  const filtersUrl = categorySlug
    ? `/api/products/${categorySlug}${
        subcategorySlug ? `/${subcategorySlug}` : ""
      }?filters=true`
    : null;

  // Загружаем фильтры с помощью SWR
  const { data: filtersData } = useSWR<FiltersResponse>(
    filtersUrl,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch filters");
      const data = await res.json();

      // Изменим преобразование данных, используя slug вместо type
      return {
        ...data,
        filters: [
          {
            id: -1,
            name: "Производитель",
            slug: "brand",
            options: data.brands,
          },
          ...data.characteristics,
        ],
      };
    },
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      dedupingInterval: 60000,
      suspense: false,
    }
  );

  // Устанавливаем диапазон цен после загрузки данных
  useEffect(() => {
    if (filtersData?.priceRange) {
      const min = filtersData.priceRange.min;
      const max = filtersData.priceRange.max;
      setPriceRange([min, max]);
      setSelectedPriceRange([min, max]);
    }
  }, [filtersData]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (filtersData) {
      const initialExpanded: Record<string, boolean> = {};
      // Всегда разворачиваем фильтр "Производитель"
      initialExpanded["brand"] = true;
      // Разворачиваем "Цена"
      initialExpanded["price"] = true;

      // Разворачиваем первые характеристики
      filtersData.characteristics
        .slice(0, INITIAL_VISIBLE_FILTERS - 1)
        .forEach((filter) => {
          if (filter.slug) {
            initialExpanded[filter.slug] = true;
          }
        });
      setExpandedFilters(initialExpanded);
    }
  }, [filtersData]);

  const handleFilterChange = useCallback(
    (filterName: string, value: string) => {
      setSelectedFilters((prev) => {
        const newFilters = { ...prev };
        if (!newFilters[filterName]) {
          newFilters[filterName] = [value];
        } else if (newFilters[filterName]?.includes(value)) {
          newFilters[filterName] = newFilters[filterName].filter(
            (v) => v !== value
          );
          if (newFilters[filterName].length === 0) {
            delete newFilters[filterName];
          }
        } else if (newFilters[filterName]) {
          newFilters[filterName] = [...newFilters[filterName], value];
        }

        // Преобразуем внутренний формат фильтров в формат API
        const apiFilters: Record<string, string[]> = {};

        // Выделяем бренды отдельно
        if (newFilters["Производитель"]) {
          apiFilters["brand"] = newFilters["Производитель"];
        }

        // Преобразуем характеристики, используя slug
        Object.entries(newFilters).forEach(([key, values]) => {
          if (key !== "Производитель" && filtersData?.characteristics) {
            const characteristic = filtersData.characteristics.find(
              (c) => c.name === key
            );
            if (characteristic?.slug) {
              apiFilters[`char[${characteristic.slug}]`] = values;
            }
          }
        });

        onFilterChange(apiFilters, selectedPriceRange);
        return newFilters;
      });
    },
    [onFilterChange, selectedPriceRange, filtersData]
  );

  // Обработчик изменения диапазона цен
  const handlePriceRangeChange = useCallback(
    (newRange: [number, number]) => {
      setSelectedPriceRange(newRange);

      // Преобразуем внутренний формат фильтров в формат API
      const apiFilters: Record<string, string[]> = {};

      // Выделяем бренды отдельно
      if (selectedFilters["brand"]) {
        apiFilters["brand"] = selectedFilters["brand"];
      }

      // Все остальные фильтры - это характеристики
      Object.entries(selectedFilters).forEach(([key, values]) => {
        if (key !== "brand") {
          apiFilters[key] = values;
        }
      });

      onFilterChange(apiFilters, newRange);
    },
    [selectedFilters, onFilterChange]
  );

  const toggleFilter = useCallback((type: string) => {
    setExpandedFilters((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  }, []);

  const getProgressPercent = useCallback(
    (value: number) => {
      if (priceRange[0] === priceRange[1]) return 0;
      return ((value - priceRange[0]) / (priceRange[1] - priceRange[0])) * 100;
    },
    [priceRange]
  );

  // Обработчики для слайдера цены
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, isMin: boolean) => {
      if (isMin) {
        setIsDraggingMin(true);
      } else {
        setIsDraggingMax(true);
      }

      // Сразу обрабатываем первое перемещение
      if (sliderRef.current) {
        const rect = sliderRef.current.getBoundingClientRect();
        const pos = ((e.clientX - rect.left) / rect.width) * 100;
        const min = priceRange[0];
        const max = priceRange[1];
        const range = max - min;

        const clampedPos = Math.max(0, Math.min(100, pos));
        const newPrice = min + (range * clampedPos) / 100;

        if (isMin) {
          const newValue = Math.min(
            newPrice,
            selectedPriceRange[1] - range * 0.05
          );
          handlePriceRangeChange([
            Math.max(min, Math.round(newValue)),
            selectedPriceRange[1],
          ]);
        } else {
          const newValue = Math.max(
            newPrice,
            selectedPriceRange[0] + range * 0.05
          );
          handlePriceRangeChange([
            selectedPriceRange[0],
            Math.min(max, Math.round(newValue)),
          ]);
        }
      }
    },
    [priceRange, selectedPriceRange, handlePriceRangeChange]
  );

  // Обработка перемещения ползунков
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!sliderRef.current || (!isDraggingMin && !isDraggingMax)) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const pos = ((e.clientX - rect.left) / rect.width) * 100;
      const min = priceRange[0];
      const max = priceRange[1];
      const range = max - min;

      // Ограничиваем положение ползунков
      const clampedPos = Math.max(0, Math.min(100, pos));
      const newPrice = min + (range * clampedPos) / 100;

      if (isDraggingMin) {
        const newValue = Math.min(
          newPrice,
          selectedPriceRange[1] - range * 0.05
        );
        handlePriceRangeChange([
          Math.max(min, Math.round(newValue)),
          selectedPriceRange[1],
        ]);
      } else if (isDraggingMax) {
        const newValue = Math.max(
          newPrice,
          selectedPriceRange[0] + range * 0.05
        );
        handlePriceRangeChange([
          selectedPriceRange[0],
          Math.min(max, Math.round(newValue)),
        ]);
      }
    },
    [
      isDraggingMin,
      isDraggingMax,
      priceRange,
      selectedPriceRange,
      handlePriceRangeChange,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsDraggingMin(false);
    setIsDraggingMax(false);
  }, []);

  // Функция для установки популярных ценовых диапазонов
  const applyPricePreset = useCallback(
    (min: number, max: number) => {
      const newMin = Math.max(priceRange[0], min);
      const newMax = Math.min(priceRange[1], max);
      handlePriceRangeChange([newMin, newMax]);
    },
    [priceRange, handlePriceRangeChange]
  );

  // Генерируем популярные ценовые диапазоны
  const getPricePresets = useCallback(() => {
    if (!filtersData?.priceRange) return [];

    const min = filtersData.priceRange.min;
    const max = filtersData.priceRange.max;
    const range = max - min;

    // Массив со значениями популярных диапазонов
    const presets: Array<{ label: string; min: number; max: number }> = [];

    // Диапазон до 5000
    if (min < 5000 && max > 5000) {
      presets.push({ label: "До 5 000 ₽", min, max: 5000 });
    }

    // Диапазон 5000-15000
    if (min < 15000 && max > 5000) {
      presets.push({
        label: "5 000 - 15 000 ₽",
        min: Math.max(min, 5000),
        max: Math.min(max, 15000),
      });
    }

    // Диапазон 15000-30000
    if (min < 30000 && max > 15000) {
      presets.push({
        label: "15 000 - 30 000 ₽",
        min: Math.max(min, 15000),
        max: Math.min(max, 30000),
      });
    }

    // Диапазон от 30000
    if (max > 30000) {
      presets.push({ label: "От 30 000 ₽", min: Math.max(min, 30000), max });
    }

    // Добавляем "Премиум" диапазон (верхние 40% цен)
    if (range > 1000) {
      const premiumThreshold = max - range * 0.4;
      presets.push({
        label: "Премиум",
        min: Math.round(premiumThreshold),
        max,
      });
    }

    return presets;
  }, [filtersData]);

  useEffect(() => {
    const filterQuery = searchParams.toString();
    if (filterQuery && filtersData?.priceRange) {
      // Используем parseFilterQueryString для парсинга всех параметров URL
      parseFilterQueryString(filterQuery).then((parsedFilters) => {
        // Инициализируем выбранные фильтры
        const initFilters: Record<string, string[]> = {};

        // Добавляем бренды
        if (parsedFilters.brands) {
          initFilters["brand"] = parsedFilters.brands;
        }

        // Инициализируем характеристики
        if (parsedFilters.characteristics) {
          Object.entries(parsedFilters.characteristics).forEach(
            ([slug, values]) => {
              // Найдем соответствующий фильтр по slug
              const filter = filtersData.characteristics.find(
                (f) => f.slug === slug
              );
              if (filter) {
                initFilters[filter.name] = values;
              }
            }
          );
        }

        // Инициализируем диапазон цен
        const minPrice = parsedFilters.priceMin ?? filtersData.priceRange.min;
        const maxPrice = parsedFilters.priceMax ?? filtersData.priceRange.max;

        setSelectedFilters(initFilters);
        setSelectedPriceRange([minPrice, maxPrice]);

        // Преобразуем в формат API
        const apiFilters: Record<string, string[]> = {};

        // Выделяем бренды отдельно
        if (initFilters["brand"]) {
          apiFilters["brand"] = initFilters["brand"];
        }

        // Все остальные фильтры - это характеристики
        Object.entries(initFilters).forEach(([key, values]) => {
          if (key !== "brand") {
            // Находим slug для этого ключа
            const characteristic = filtersData.characteristics.find(
              (c) => c.name === key
            );
            if (characteristic) {
              apiFilters[characteristic.slug] = values;
            }
          }
        });

        // Вызываем обработчик фильтрации с инициализированными данными
        onFilterChange(apiFilters, [minPrice, maxPrice]);
      });
    }
  }, [searchParams, filtersData, onFilterChange]);

  // Добавляем обработчики для перетаскивания
  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mouseleave", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mouseleave", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const renderFilterValues = useCallback(
    (filter: Filter) => {
      const values = showAllFilters
        ? filter.options
        : filter.options.slice(0, INITIAL_VISIBLE_VALUES);

      return (
        <div className="space-y-2.5 pl-1">
          {values.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-3 cursor-pointer group hover:bg-gradient-from/10 py-1.5 px-2 rounded-md transition-all duration-200"
            >
              <div className="relative flex-shrink-0">
                <input
                  type="checkbox"
                  checked={
                    selectedFilters[filter.name]?.includes(option.value) ||
                    false
                  }
                  onChange={() => handleFilterChange(filter.name, option.value)}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-md border transition-all duration-200 flex items-center justify-center ${
                    selectedFilters[filter.name]?.includes(option.value)
                      ? "bg-blue-500 border-blue-500"
                      : "border-primary-border bg-gradient-from/20 group-hover:border-blue-400"
                  }`}
                >
                  {selectedFilters[filter.name]?.includes(option.value) && (
                    <CheckIcon className="w-3.5 h-3.5 text-white" />
                  )}
                </div>
              </div>
              <span
                className={`text-sm transition-colors flex-1 flex justify-between items-center ${
                  selectedFilters[filter.name]?.includes(option.value)
                    ? "text-white"
                    : "text-secondary-light group-hover:text-white"
                }`}
              >
                <span>{option.label}</span>
                <span className="text-secondary-light text-xs">
                  {option.count}
                </span>
              </span>
            </label>
          ))}
          {filter.options.length > INITIAL_VISIBLE_VALUES &&
            !showAllFilters && (
              <button
                onClick={() => setShowAllFilters(true)}
                className="text-sm text-blue-500 hover:text-blue-400 mt-3 ml-2 flex items-center gap-1.5 group"
              >
                <span>Показать все</span>
                <span className="text-blue-400 group-hover:text-blue-300">
                  ({filter.options.length})
                </span>
              </button>
            )}
        </div>
      );
    },
    [selectedFilters, handleFilterChange, showAllFilters]
  );

  // Рендер слайдера для ценового диапазона
  const renderPriceRange = useCallback(() => {
    if (!filtersData?.priceRange) return null;

    const min = filtersData.priceRange.min;
    const max = filtersData.priceRange.max;

    if (min === max) return null; // Не показываем фильтр, если цены одинаковые

    const minPercent = getProgressPercent(selectedPriceRange[0]);
    const maxPercent = getProgressPercent(selectedPriceRange[1]);
    const pricePresets = getPricePresets();

    return (
      <div className="bg-gradient-from/10 rounded-lg p-4 mb-6 border border-primary-border/30 hover:border-primary-border/50 transition-all duration-300">
        <button
          onClick={() => toggleFilter("price")}
          className="w-full flex items-center justify-between text-white font-medium text-left"
        >
          <span className="text-left flex items-center gap-2">
            <AdjustmentsHorizontalIcon className="w-5 h-5 text-blue-400" />
            <span>Цена</span>
          </span>
          <ChevronDownIcon
            className={`w-5 h-5 transition-transform flex-shrink-0 ${
              expandedFilters["price"] ? "rotate-180" : ""
            }`}
          />
        </button>
        <AnimatePresence>
          {expandedFilters["price"] && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col space-y-6 mt-4">
                {/* Популярные диапазоны */}
                {pricePresets.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-sm text-secondary-light">
                      Популярные диапазоны
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {pricePresets.map((preset, index) => (
                        <button
                          key={index}
                          onClick={() =>
                            applyPricePreset(preset.min, preset.max)
                          }
                          className={`px-3 py-1.5 text-sm rounded-full border transition-all ${
                            selectedPriceRange[0] === preset.min &&
                            selectedPriceRange[1] === preset.max
                              ? "bg-blue-500 border-blue-500 text-white"
                              : "bg-gradient-from/20 border-primary-border/50 text-secondary-light hover:text-white hover:border-blue-400"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <label className="text-secondary-light text-sm mb-1.5 block">
                      От
                    </label>
                    <input
                      type="number"
                      min={min}
                      max={selectedPriceRange[1]}
                      value={selectedPriceRange[0]}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        handlePriceRangeChange([
                          Math.max(min, Math.min(value, selectedPriceRange[1])),
                          selectedPriceRange[1],
                        ]);
                      }}
                      className="w-full bg-gradient-from/30 border border-primary-border rounded-md p-2 text-white text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <div className="absolute right-3 top-[2.4rem] text-secondary-light text-sm">
                      ₽
                    </div>
                  </div>
                  <div className="relative">
                    <label className="text-secondary-light text-sm mb-1.5 block">
                      До
                    </label>
                    <input
                      type="number"
                      min={selectedPriceRange[0]}
                      max={max}
                      value={selectedPriceRange[1]}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        handlePriceRangeChange([
                          selectedPriceRange[0],
                          Math.min(max, Math.max(value, selectedPriceRange[0])),
                        ]);
                      }}
                      className="w-full bg-gradient-from/30 border border-primary-border rounded-md p-2 text-white text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <div className="absolute right-3 top-[2.4rem] text-secondary-light text-sm">
                      ₽
                    </div>
                  </div>
                </div>

                <div className="relative pt-5" ref={sliderRef}>
                  {/* Фон слайдера */}
                  <div className="absolute h-1.5 w-full bg-primary-border/50 rounded-full" />

                  {/* Активная часть слайдера */}
                  <div
                    className="absolute h-1.5 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
                    style={{
                      left: `${minPercent}%`,
                      width: `${maxPercent - minPercent}%`,
                    }}
                  />

                  {/* Ползунок минимума */}
                  <div
                    className={`absolute w-6 h-6 bg-blue-500 rounded-full shadow-lg -mt-2 transform -translate-x-1/2 cursor-pointer transition-transform duration-200 will-change-transform ${
                      isDraggingMin
                        ? "scale-110 ring-2 ring-blue-300"
                        : "hover:scale-110"
                    }`}
                    style={{ left: `${minPercent}%` }}
                    onMouseDown={(e) => handleMouseDown(e, true)}
                    onTouchStart={() => setIsDraggingMin(true)}
                  ></div>

                  {/* Ползунок максимума */}
                  <div
                    className={`absolute w-6 h-6 bg-blue-500 rounded-full shadow-lg -mt-2 transform -translate-x-1/2 cursor-pointer transition-transform duration-200 will-change-transform ${
                      isDraggingMax
                        ? "scale-110 ring-2 ring-blue-300"
                        : "hover:scale-110"
                    }`}
                    style={{ left: `${maxPercent}%` }}
                    onMouseDown={(e) => handleMouseDown(e, false)}
                    onTouchStart={() => setIsDraggingMax(true)}
                  ></div>

                  {/* Невидимая область для перетаскивания */}
                  <div
                    className="w-full h-10 absolute top-[-1rem] cursor-pointer opacity-0"
                    onMouseDown={(e) => {
                      const rect = sliderRef.current?.getBoundingClientRect();
                      if (!rect) return;

                      const clickPos = (e.clientX - rect.left) / rect.width;
                      const minPos =
                        (selectedPriceRange[0] - priceRange[0]) /
                        (priceRange[1] - priceRange[0]);
                      const maxPos =
                        (selectedPriceRange[1] - priceRange[0]) /
                        (priceRange[1] - priceRange[0]);

                      // Определяем, какой ползунок ближе к месту клика
                      if (
                        Math.abs(clickPos - minPos) <=
                        Math.abs(clickPos - maxPos)
                      ) {
                        // Ближе к минимальному
                        handleMouseDown(e, true);
                      } else {
                        // Ближе к максимальному
                        handleMouseDown(e, false);
                      }
                    }}
                  ></div>
                </div>

                <div className="flex justify-between text-secondary-light text-sm pt-2">
                  <span>{min.toLocaleString("ru-RU")} ₽</span>
                  <span>{max.toLocaleString("ru-RU")} ₽</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }, [
    filtersData,
    expandedFilters,
    selectedPriceRange,
    handlePriceRangeChange,
    toggleFilter,
    getProgressPercent,
    isDraggingMin,
    isDraggingMax,
    handleMouseDown,
    getPricePresets,
    applyPricePreset,
  ]);

  const renderFilters = useCallback(() => {
    if (
      !filtersData ||
      (!filtersData.brands.length && !filtersData.characteristics.length)
    ) {
      return (
        <div className="text-secondary-light text-center py-4 bg-gradient-from/10 rounded-lg">
          Фильтры не найдены
        </div>
      );
    }

    // Создаем массив всех фильтров, включая бренды
    const allFilters: Filter[] = [
      {
        id: -1,
        name: "Производитель",
        slug: "brand",
        options: filtersData.brands,
      },
      ...filtersData.characteristics,
    ];

    const visibleFilters = showAllFilters
      ? allFilters
      : allFilters.slice(0, INITIAL_VISIBLE_FILTERS);

    return (
      <div className="space-y-5">
        {renderPriceRange()}
        {visibleFilters.map((filter) => (
          <div
            key={filter.slug} // Используем slug вместо type
            className="bg-gradient-from/10 rounded-lg p-4 border border-primary-border/30 hover:border-primary-border/50 transition-all duration-300"
          >
            <button
              onClick={() => toggleFilter(filter.slug)} // Используем slug вместо type
              className={`w-full flex items-center justify-between text-white font-medium text-left group hover:text-blue-100 transition-colors ${
                expandedFilters[filter.slug] ? "mb-3" : "" // Используем slug вместо type
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{filter.name}</span>
                {selectedFilters[filter.name]?.length > 0 && (
                  <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {selectedFilters[filter.name].length}
                  </span>
                )}
              </span>
              <ChevronDownIcon
                className={`w-5 h-5 transition-transform flex-shrink-0 group-hover:text-blue-400 ${
                  expandedFilters[filter.slug] ? "rotate-180" : ""
                }`}
              />
            </button>
            <AnimatePresence>
              {expandedFilters[filter.slug] && ( // Используем slug вместо type
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  {renderFilterValues(filter)}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
        {allFilters.length > INITIAL_VISIBLE_FILTERS && (
          <button
            onClick={() => setShowAllFilters(!showAllFilters)}
            className="w-full text-center py-2.5 px-4 rounded-md text-blue-500 hover:text-blue-400 hover:bg-gradient-from/20 transition-all mt-4 font-medium border border-blue-500/20 hover:border-blue-500/40"
          >
            {showAllFilters
              ? "Показать меньше"
              : `Показать все фильтры (${allFilters.length})`}
          </button>
        )}
      </div>
    );
  }, [
    filtersData,
    showAllFilters,
    expandedFilters,
    selectedFilters,
    renderFilterValues,
    renderPriceRange,
    toggleFilter,
  ]);

  const handleClearFilters = useCallback(() => {
    setSelectedFilters({});
    if (filtersData?.priceRange) {
      setSelectedPriceRange([
        filtersData.priceRange.min,
        filtersData.priceRange.max,
      ]);
      onFilterChange({}, [
        filtersData.priceRange.min,
        filtersData.priceRange.max,
      ]);
    }
  }, [filtersData, onFilterChange]);

  // Мобильная версия
  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-br from-[#1D1E2C] to-[#252736] text-white border border-primary-border hover:shadow-lg transition-all duration-300"
        >
          <FunnelIcon className="w-5 h-5" />
          <span>Фильтры</span>
          {Object.keys(selectedFilters).length > 0 && (
            <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2">
              {Object.keys(selectedFilters).length}
            </span>
          )}
        </button>

        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <motion.div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
              />

              <motion.div
                className="relative z-10 w-full h-full sm:h-auto sm:max-h-[90vh] sm:w-[480px] bg-primary overflow-y-auto rounded-none sm:rounded-xl p-4 sm:p-6 shadow-xl border border-primary-border"
                variants={{
                  hidden: { opacity: 0, y: 50 },
                  visible: { opacity: 1, y: 0 },
                }}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <div className="sticky top-0 bg-primary z-10 flex justify-between items-center mb-6 pb-4 border-b border-primary-border/60">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                    Фильтры
                    {Object.keys(selectedFilters).length > 0 && (
                      <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {Object.keys(selectedFilters).length}
                      </span>
                    )}
                  </h2>
                  <div className="flex items-center gap-2">
                    {Object.keys(selectedFilters).length > 0 && (
                      <button
                        onClick={handleClearFilters}
                        className="text-blue-500 text-sm hover:text-blue-400 px-3 py-1.5 rounded-md hover:bg-gradient-from/20"
                      >
                        Сбросить
                      </button>
                    )}
                    <button
                      onClick={() => setIsOpen(false)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-from/30 text-secondary-light hover:text-white hover:bg-gradient-from/50 transition-all"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="pb-20">{renderFilters()}</div>

                {/* Фиксированная кнопка применения фильтров */}
                <div className="fixed bottom-0 left-0 right-0 bg-primary border-t border-primary-border p-4 sm:rounded-b-xl shadow-lg">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium transition-colors"
                  >
                    Применить фильтры
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Десктопная версия
  return (
    <div className="w-full p-5 bg-gradient-from/10 rounded-xl border border-primary-border/50 self-start hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 text-blue-400" />
          <span>Фильтры</span>
          {Object.keys(selectedFilters).length > 0 && (
            <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {Object.keys(selectedFilters).length}
            </span>
          )}
        </h2>
        {Object.keys(selectedFilters).length > 0 && (
          <button
            onClick={handleClearFilters}
            className="text-blue-500 text-sm hover:text-blue-400 px-3 py-1.5 rounded-md hover:bg-gradient-from/20 transition-colors"
          >
            Сбросить
          </button>
        )}
      </div>

      {renderFilters()}
    </div>
  );
};

export default Filters;
