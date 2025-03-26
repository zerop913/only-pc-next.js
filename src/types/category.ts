export interface Category {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  icon: string | null;
  productCount: number;
  children?: CategoryWithChildren[]; // Делаем children опциональным
}

export interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[];
}

export interface CategoryProduct {
  id: number;
  title: string;
  slug: string;
  price: number;
  image: string | null;
  description: string | null;
  characteristics?: {
    type: string;
    value: string;
  }[];
}

export interface CategoryResponse {
  categories?: Category[];
  products?: CategoryProduct[];
}
