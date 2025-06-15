import { Product, SimpleProductCharacteristic } from "./product";

export interface FavoriteProduct
  extends Omit<Product, "characteristics" | "category"> {
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  characteristics: SimpleProductCharacteristic[];
}

export interface FavoriteItem {
  id: number;
  productId: number;
  product: FavoriteProduct;
  createdAt: Date;
}

export type FavoritesMap = Record<number, FavoriteItem[]>;
