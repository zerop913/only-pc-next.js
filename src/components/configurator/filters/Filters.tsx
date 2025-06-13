import { useState, useCallback, useEffect } from "react";
import { FunnelIcon } from "@heroicons/react/24/outline";
import { FiltersResponse, Filter } from "./types/filters";
import FilterGroup from "./components/FilterGroup";
import PriceFilter from "./components/PriceFilter";
import MobileFilterView from "./components/MobileFilterView";
import { useFilters } from "./hooks/useFilters";

interface FiltersProps {
  categorySlug: string;
  subcategorySlug?: string;
  onFilterChange: (
    filters: Record<string, string[]>,
    priceRange: [number, number]
  ) => void;
}

export default function Filters({
  categorySlug,
  subcategorySlug,
  onFilterChange,
}: FiltersProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const {
    filtersData,
    selectedFilters,
    expandedFilters,
    handleFilterChange,
    toggleFilter,
    handlePriceRangeChange,
    handleClearFilters,
    isResetting, // Убедимся, что isResetting получен из хука
  } = useFilters({ onFilterChange, categorySlug, subcategorySlug });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-lg bg-gradient-from/20 border border-primary-border/30 hover:bg-gradient-from/30 hover:border-primary-border/50 transition-all duration-300 text-secondary-light hover:text-white"
        >
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-blue-400" />
            <span>Фильтры</span>
          </div>
          {selectedFilters.brand.size +
            Array.from(selectedFilters.characteristics.values()).reduce(
              (acc, set) => acc + set.size,
              0
            ) >
            0 && (
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/20">
                {selectedFilters.brand.size +
                  Array.from(selectedFilters.characteristics.values()).reduce(
                    (acc, set) => acc + set.size,
                    0
                  )}
              </span>
            </div>
          )}
        </button>

        <MobileFilterView
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          filtersData={filtersData}
          selectedFilters={selectedFilters}
          expandedFilters={expandedFilters}
          onFilterChange={handleFilterChange}
          onToggleFilter={toggleFilter}
          onPriceChange={handlePriceRangeChange}
          onClearFilters={handleClearFilters}
        />
      </>
    );
  }

  return (
    <div className="w-full p-5 bg-gradient-from/10 rounded-xl border border-primary-border/50 self-start hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <FunnelIcon className="w-5 h-5 text-blue-400" />
          <span>Фильтры</span>
          {selectedFilters.brand.size +
            Array.from(selectedFilters.characteristics.values()).reduce(
              (acc, set) => acc + set.size,
              0
            ) >
            0 && (
            <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {selectedFilters.brand.size +
                Array.from(selectedFilters.characteristics.values()).reduce(
                  (acc, set) => acc + set.size,
                  0
                )}
            </span>
          )}
        </h2>
        {(selectedFilters.brand.size > 0 ||
          selectedFilters.characteristics.size > 0 ||
          (filtersData &&
            (selectedFilters.priceRange[0] > filtersData.priceRange.min ||
              selectedFilters.priceRange[1] < filtersData.priceRange.max))) && (
          <button
            onClick={handleClearFilters}
            className="text-blue-500 text-sm hover:text-blue-400 px-3 py-1.5 rounded-md hover:bg-gradient-from/20 transition-colors"
          >
            Сбросить
          </button>
        )}
      </div>

      {filtersData && (
        <div className="space-y-4">
          <PriceFilter
            minPrice={filtersData.priceRange.min}
            maxPrice={filtersData.priceRange.max}
            currentRange={selectedFilters.priceRange}
            onRangeChange={handlePriceRangeChange}
            isExpanded={expandedFilters["price"]}
            onToggle={() => toggleFilter("price")}
            isResetting={isResetting}
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
            onToggle={() => toggleFilter("brand")}
            onOptionChange={(value) =>
              handleFilterChange("brand", value, false)
            }
            selectedValues={selectedFilters.brand}
          />

          {filtersData.characteristics.map((filter: Filter) => (
            <FilterGroup
              key={filter.id}
              filter={filter}
              isExpanded={expandedFilters[filter.slug]}
              selectedCount={
                selectedFilters.characteristics.get(filter.slug)?.size || 0
              }
              onToggle={() => toggleFilter(filter.slug)}
              onOptionChange={(value) =>
                handleFilterChange(filter.slug, value, true)
              }
              selectedValues={
                selectedFilters.characteristics.get(filter.slug) || new Set()
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
