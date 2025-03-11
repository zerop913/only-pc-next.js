import { Product } from "@/types/product";

export interface ProductFilters {
  priceMin?: number;
  priceMax?: number;
  brands?: string[];
  characteristics?: Record<string, string[]>;
}

export const parseFilterQueryString = (queryString: string): ProductFilters => {
  const params = new URLSearchParams(queryString);
  const filters: ProductFilters = {};

  // Обрабатываем цены
  const priceMin = params.get("priceMin");
  const priceMax = params.get("priceMax");
  if (priceMin) filters.priceMin = Number(priceMin);
  if (priceMax) filters.priceMax = Number(priceMax);

  // Обрабатываем бренды
  const brands = params.getAll("brand");
  if (brands.length > 0) {
    filters.brands = brands;
  }

  // Обрабатываем характеристики
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
  // Эта функция больше не нужна, так как фильтрация происходит на сервере
  return products;
};
