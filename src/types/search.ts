import { Product } from "./product";

export interface SearchParams {
  query: string;
  page?: number;
  limit?: number;
  sort?: "relevance" | "price_asc" | "price_desc";
  includePcBuilds?: boolean;
}

// Определяем интерфейс для готовой сборки в результатах поиска
export interface PcBuildProduct extends Omit<Product, "categoryId"> {
  categoryId?: number;
  isBuild: true;
  components: Record<string, { name: string; categoryName: string }>;
}

export interface SearchResponse {
  items: (Product | PcBuildProduct)[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  query: string;
}
