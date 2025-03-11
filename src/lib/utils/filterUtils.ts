import { ProductFilters } from "@/services/filterService";

export function createFilterParams(filters?: ProductFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (!filters) return params;

  if (filters.priceMin !== undefined) {
    params.set("priceMin", filters.priceMin.toString());
  }
  if (filters.priceMax !== undefined) {
    params.set("priceMax", filters.priceMax.toString());
  }

  // Добавляем бренды без дублирования
  if (filters.brands?.length) {
    const uniqueBrands = [...new Set(filters.brands)]; // Убираем дубликаты
    uniqueBrands.forEach((brand, index) => {
      if (index === 0) {
        params.set("brand", brand);
      } else {
        params.append("brand", brand);
      }
    });
  }

  // Добавляем характеристики без дублирования
  if (filters.characteristics) {
    Object.entries(filters.characteristics).forEach(([slug, values]) => {
      const uniqueValues = [...new Set(values)]; // Убираем дубликаты
      uniqueValues.forEach((value, index) => {
        const key = `char[${slug}]`;
        if (index === 0) {
          params.set(key, value);
        } else {
          params.append(key, value);
        }
      });
    });
  }

  return params;
}

export function parseFilterParams(
  searchParams: URLSearchParams
): ProductFilters {
  const filters: ProductFilters = {};

  const priceMin = searchParams.get("priceMin");
  const priceMax = searchParams.get("priceMax");

  if (priceMin) filters.priceMin = Number(priceMin);
  if (priceMax) filters.priceMax = Number(priceMax);

  const brands = searchParams.getAll("brand");
  if (brands.length) filters.brands = brands;

  const characteristics: Record<string, string[]> = {};
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith("char[") && key.endsWith("]")) {
      const slug = key.slice(5, -1);
      if (!characteristics[slug]) characteristics[slug] = [];
      characteristics[slug].push(value);
    }
  }

  if (Object.keys(characteristics).length) {
    filters.characteristics = characteristics;
  }

  return filters;
}
