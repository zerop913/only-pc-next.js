import { Category } from "@/types/category";

export interface CategoryState {
  selectedCategory: Category | null;
  selectedSubcategory: Category | null;
  isDropdownOpen: boolean;
}

export interface CategoryActions {
  handleCategorySelect: (category: Category, index: number) => Promise<void>;
  handleSubcategorySelect: (subcategory: Category) => Promise<void>;
  toggleDropdown: () => void;
}

export interface ProductState {
  products: any[];
  isLoading: boolean;
  totalPrice: number;
}

export interface MobileViewProps {
  categories: Category[];
  state: CategoryState;
  actions: CategoryActions;
}

export interface DesktopViewProps {
  categories: Category[];
  state: CategoryState;
  actions: CategoryActions;
}
