export interface ProductCharacteristic {
  type: string | null;
  value: string;
}

export interface Product {
  id: number;
  slug: string;
  categoryId: number;
  title: string;
  price: number;
  brand: string;
  image: string | null;
  description: string | null;
  createdAt: string;
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  characteristics?: Array<{
    type: string;
    value: string;
  }>;
}

export interface CategoryResponse {
  hasSubcategories: boolean;
  subcategories: {
    id: number;
    name: string;
    slug: string;
    icon: string | null;
  }[];
}
