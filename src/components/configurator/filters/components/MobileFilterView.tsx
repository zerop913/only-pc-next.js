import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { FiltersResponse } from "../types/filters";
import FilterGroup from "./FilterGroup";
import PriceFilter from "./PriceFilter";

interface MobileFilterViewProps {
  isOpen: boolean;
  onClose: () => void;
  filtersData: FiltersResponse | undefined;
  selectedFilters: {
    brand: Set<string>;
    characteristics: Map<string, Set<string>>;
    priceRange: [number, number];
  };
  expandedFilters: Record<string, boolean>;
  onFilterChange: (
    slug: string,
    value: string,
    isCharacteristic: boolean
  ) => void;
  onToggleFilter: (type: string) => void;
  onPriceChange: (range: [number, number]) => void;
  onClearFilters: () => void;
}

export default function MobileFilterView({
  isOpen,
  onClose,
  filtersData,
  selectedFilters,
  expandedFilters,
  onFilterChange,
  onToggleFilter,
  onPriceChange,
  onClearFilters,
}: MobileFilterViewProps) {
  if (!filtersData) return null;

  const selectedCount =
    selectedFilters.brand.size +
    Array.from(selectedFilters.characteristics.values()).reduce(
      (acc, set) => acc + set.size,
      0
    );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
                {selectedCount > 0 && (
                  <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {selectedCount}
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-2">
                {selectedCount > 0 && (
                  <button
                    onClick={onClearFilters}
                    className="text-blue-500 text-sm hover:text-blue-400 px-3 py-1.5 rounded-md hover:bg-gradient-from/20"
                  >
                    Сбросить
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-from/30 text-secondary-light hover:text-white hover:bg-gradient-from/50 transition-all"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="pb-20">
              <PriceFilter
                minPrice={filtersData.priceRange.min}
                maxPrice={filtersData.priceRange.max}
                currentRange={selectedFilters.priceRange}
                onRangeChange={onPriceChange}
                isExpanded={expandedFilters["price"]}
                onToggle={() => onToggleFilter("price")}
              />

              <FilterGroup
                filter={{
                  id: -1,
                  name: "Производитель",
                  slug: "brand",
                  options: filtersData.brands,
                }}
                isExpanded={expandedFilters["brand"]}
                selectedCount={selectedFilters.brand.size}
                onToggle={() => onToggleFilter("brand")}
                onOptionChange={(value) =>
                  onFilterChange("brand", value, false)
                }
                selectedValues={selectedFilters.brand}
              />

              {filtersData.characteristics.map((filter) => (
                <FilterGroup
                  key={filter.id}
                  filter={filter}
                  isExpanded={expandedFilters[filter.slug]}
                  selectedCount={
                    selectedFilters.characteristics.get(filter.slug)?.size || 0
                  }
                  onToggle={() => onToggleFilter(filter.slug)}
                  onOptionChange={(value) =>
                    onFilterChange(filter.slug, value, true)
                  }
                  selectedValues={
                    selectedFilters.characteristics.get(filter.slug) ||
                    new Set()
                  }
                />
              ))}
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-primary border-t border-primary-border p-4 sm:rounded-b-xl shadow-lg">
              <button
                onClick={onClose}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium transition-colors"
              >
                Применить фильтры
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
