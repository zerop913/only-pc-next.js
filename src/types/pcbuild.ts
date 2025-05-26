import { User } from "./user";
import { Category } from "./category";
import { Product } from "./product";

export interface PcBuildData {
  name: string;
  components: Record<string, string>;
}

export interface PcBuildResponse {
  id: number;
  name: string;
  slug: string;
  components: Record<string, string>;
  totalPrice: string;
  createdAt: string;
  updatedAt: string;
  userId: number;
  user?: {
    id: number;
    email: string;
    profile?: {
      firstName: string | null;
      lastName: string | null;
    };
  };
}

// Интерфейс для сокращенной информации о сборке ПК на странице оформления заказа
export interface PcBuildSummary {
  id: number;
  name: string;
  totalPrice: string;
  components: Record<
    string,
    {
      categoryId: number;
      categoryName: string;
      productId: number;
      name: string;
      price: string | number;
      image: string;
    }
  >;
}

export interface DetailedComponent {
  category: Category;
  product: Product;
}

export interface PcBuildWithDetails
  extends Omit<PcBuildResponse, "components"> {
  components: DetailedComponent[];
}

export interface BuildValidation {
  isValid: boolean;
  missingCategories: Array<{
    slug: string;
    name: string;
  }>;
}

export interface BuildResponse {
  build: PcBuildResponse;
  validation?: BuildValidation;
}
