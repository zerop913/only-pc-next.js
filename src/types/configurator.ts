export interface Category {
  id: string;
  name: string;
  icon: string;
  children?: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  parentId: string;
}
