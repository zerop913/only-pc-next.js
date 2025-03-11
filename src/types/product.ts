export interface ProductCharacteristic {
  type: string | null;
  value: string;
}

export interface Product {
  id: number;
  slug: string;
  title: string;
  price: number;
  brand: string;
  image?: string | null;
  description?: string | null;
  categoryId: number;
  characteristics: ProductCharacteristic[];
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
