export interface ProductCharacteristic {
  id: number;
  product_id: number;
  characteristic_type_id: number;
  value: string;
  characteristicType?: {
    id: number;
    name: string;
    slug: string;
  };
}

// Упрощенный интерфейс для характеристик продукта (для использования в API и компонентах)
export interface SimpleProductCharacteristic {
  type: string;
  value: string;
  typeSlug?: string;
}

export interface Product {
  id: number;
  slug: string;
  title: string;
  price: number;
  brand: string;
  image: string | null;
  description: string | null;
  categoryId: number;
  characteristics: SimpleProductCharacteristic[];
  createdAt: string;
  category?: {
    id: number;
    name: string;
    slug: string;
  };
}

export interface CategoryResponse {
  hasSubcategories: boolean;
  subcategories: Array<{
    id: number;
    name: string;
    slug: string;
    icon: string | null;
  }>;
}

export interface CategoryCharacteristic {
  id: number;
  name: string;
  slug: string;
  position: number;
  categoryId: number;
}

export interface ProductCharacteristicValue {
  characteristicId: number;
  characteristicName: string;
  characteristicSlug: string;
  value: string;
}
