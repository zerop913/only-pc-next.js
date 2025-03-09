import { Product } from "@/types/product";

export interface ProductFilters {
  priceMin?: number;
  priceMax?: number;
  brands?: string[];
  characteristics?: Record<string, string[]>;
}

export const parseFilterQueryString = (
  queryString: string | null | undefined
): ProductFilters => {
  const params = new URLSearchParams(queryString || "");
  const filters: ProductFilters = {};

  // Parse price range
  const priceMin = params.get("priceMin");
  const priceMax = params.get("priceMax");
  if (priceMin) filters.priceMin = Number(priceMin);
  if (priceMax) filters.priceMax = Number(priceMax);

  // Parse brands
  const brands = params.getAll("brand");
  if (brands.length > 0) filters.brands = brands;

  // Parse characteristics
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
    filters.characteristics = characteristics;
  }

  return filters;
};

export const filterProducts = (
  products: Product[],
  filters: ProductFilters
): Product[] => {
  return products.filter((product) => {
    // Фильтрация по цене
    if (filters.priceMin && product.price < filters.priceMin) return false;
    if (filters.priceMax && product.price > filters.priceMax) return false;

    // Фильтрация по бренду
    if (filters.brands && filters.brands.length > 0) {
      if (!filters.brands.includes(product.brand)) return false;
    }

    // Фильтрация по характеристикам
    if (filters.characteristics && product.characteristics) {
      for (const [charSlug, values] of Object.entries(
        filters.characteristics
      )) {
        if (values.length > 0) {
          const characteristic = product.characteristics.find(
            (char) => char.type === charSlug
          );
          if (!characteristic || !values.includes(characteristic.value)) {
            return false;
          }
        }
      }
    }

    return true;
  });
};
