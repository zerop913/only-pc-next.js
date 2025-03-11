export interface FilterOption {
  value: string;
  label: string;
  count: number;
}

export interface PriceRange {
  min: number;
  max: number;
}

export interface Filter {
  id: number;
  name: string;
  slug: string;
  options: FilterOption[];
}

export interface FiltersResponse {
  priceRange: PriceRange;
  brands: FilterOption[];
  characteristics: Filter[];
}

export interface SelectedFilters {
  brand: Set<string>;
  characteristics: Map<string, Set<string>>;
  priceRange: [number, number];
}

// Обновляем интерфейс для функции onFilterChange
export interface FiltersProps {
  onFilterChange: (
    filters: Record<string, string[]>,
    priceRange: [number, number]
  ) => void;
  categorySlug: string;
  subcategorySlug?: string;
}
