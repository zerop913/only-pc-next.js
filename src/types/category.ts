export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  children: Category[];
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
