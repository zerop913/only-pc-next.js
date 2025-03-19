import { Product } from "./product";

export interface SearchParams {
  query: string;
  page?: number;
  limit?: number;
  sort?: "relevance" | "price_asc" | "price_desc";
}

export interface SearchResponse {
  items: Product[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  query: string;
}
