export interface Product {
  id: number;
  slug: string;
  title: string;
  price: number;
  brand: string;
  image: string;
  description?: string;
  categoryId: number;
  characteristics: ProductCharacteristic[];
}

export interface ProductCharacteristic {
  type: string;
  value: string;
}
