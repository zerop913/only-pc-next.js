export interface Category {
  id: number;
  slug: string;
  name: string;
  parentId: number | null;
  icon: string | null;
  children?: Category[];
  productCount: number;
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
