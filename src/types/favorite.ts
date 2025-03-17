import { Product, ProductCharacteristic } from "./product";

export interface FavoriteProduct extends Omit<Product, "characteristics"> {
  category?: {
    name: string;
    slug: string;
  };
  characteristics: ProductCharacteristic[];
}

export interface FavoriteItem {
  id: number;
  productId: number;
  product: FavoriteProduct;
  createdAt: Date;
}

export type FavoritesMap = Record<number, FavoriteItem[]>;
