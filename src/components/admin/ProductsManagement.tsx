import { useState, useEffect, useImperativeHandle } from "react";
import { Product } from "@/types/product";
import { CategoryWithChildren } from "@/types/category";
import { Package, Info as InfoIcon, Search, Plus } from "lucide-react";
import ProductDetailsModal from "./modals/ProductDetailsModal";
import AddProductModal from "./modals/AddProductModal";
import ProductItem from "./ProductItem";
import Pagination from "../common/ui/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import Select from "@/components/common/ui/Select";

export default function ProductsManagement({ ref }: { ref?: any }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [totalItems, setTotalItems] = useState(0);
  const debouncedSearch = useDebounce(search, 500);
  const [categories, setCategories] = useState<
    Array<{ value: number; label: string }>
  >([]);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(
    undefined
  );
  const [initialCategoryId, setInitialCategoryId] = useState<number | null>(
    null
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [originalCategories, setOriginalCategories] = useState<
    CategoryWithChildren[]
  >([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (initialCategoryId) {
      setSelectedCategory(initialCategoryId);
      setInitialCategoryId(null);
    }
  }, [initialCategoryId]);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/categories");
      const data = await response.json();
      setOriginalCategories(data);
      const flattenCategories = flattenCategoryTree(data);
      setCategories(flattenCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const flattenCategoryTree = (
    categories: any[],
    parentName = ""
  ): { value: number; label: string }[] => {
    return categories.reduce((acc: any[], category) => {
      const prefix = parentName ? `${parentName} → ` : "";

      // Изменяем логику добавления категорий
      const hasDirectProducts = category.productCount > 0;
      const hasChildrenWithProducts = category.children.reduce(
        (total: number, child: any) => total + countTotalProducts(child),
        0
      );

      // Добавляем категорию только если у неё есть прямые товары
      if (hasDirectProducts) {
        acc.push({
          value: category.id,
          label: `${prefix}${category.name}`,
        });
      }

      // Рекурсивно обрабатываем подкатегории
      if (category.children?.length) {
        acc.push(...flattenCategoryTree(category.children, category.name));
      }

      return acc;
    }, []);
  };

  // Добавим вспомогательную функцию для подсчета общего количества товаров
  const countTotalProducts = (category: any): number => {
    return (
      category.productCount +
      category.children.reduce(
        (acc: number, child: any) => acc + countTotalProducts(child),
        0
      )
    );
  };

  const fetchProducts = async (
    page: number,
    searchQuery: string = "",
    forcedCategoryId?: number
  ) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const params = new URLSearchParams({
        page: page.toString(),
        search: searchQuery,
      });

      const categoryId =
        forcedCategoryId !== undefined ? forcedCategoryId : selectedCategory;
      if (categoryId !== undefined) {
        params.append("category", categoryId.toString());
      }

      const response = await fetch(`/api/admin/products?${params}`, {
        credentials: "include",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch products");
      }

      const data = await response.json();
      setProducts(data.products);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
      setTotalItems(data.totalItems);
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.error("Request timed out");
      } else {
        console.error("Error fetching products:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    setCurrentPage(1);
    fetchProducts(1, debouncedSearch);
  }, [selectedCategory, debouncedSearch]);

  useEffect(() => {
    setIsLoading(true);
    fetchProducts(currentPage, debouncedSearch);
  }, [currentPage]);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setShowDetailsModal(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const setInitialCategory = (categoryId: number) => {
    setInitialCategoryId(categoryId);
  };

  useImperativeHandle(ref, () => ({
    setInitialCategory: (categoryId: number) => {
      setSelectedCategory(categoryId);
      setCurrentPage(1);
      setIsLoading(true);
      fetchProducts(1, "", categoryId);
    },
  }));

  const handleCategoryChange = (value: string | number) => {
    // Изменяем преобразование значения для соответствия типу
    const categoryId = value === "" ? undefined : Number(value);
    setSelectedCategory(categoryId);
    setIsLoading(true);
    setCurrentPage(1);
    fetchProducts(1, search, categoryId);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-from/20 rounded-lg border border-primary-border">
              <Package className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-medium text-white">Товары</h2>
              <div className="px-2 py-0.5 text-xs font-medium bg-gradient-from/20 text-blue-400 rounded-full border border-blue-500/20">
                Всего: {totalItems}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/30 transition-all duration-300"
          >
            <Plus className="w-5 h-5" />
            <span>Добавить товар</span>
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск товаров..."
              className="w-full pl-10 pr-4 py-2.5 bg-gradient-from/10 border border-primary-border rounded-lg text-white placeholder:text-secondary-light"
            />
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-secondary-light" />
          </div>
          <div className="[&>div>button]:py-2.5 [&>div>button]:h-[44px]">
            <Select
              value={selectedCategory ?? ""}
              onChange={handleCategoryChange}
              options={[{ value: "", label: "Все категории" }, ...categories]}
              placeholder="Выберите категорию"
            />
          </div>
        </div>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-gradient-from/10 rounded-xl border border-primary-border"
            >
              <div className="aspect-square bg-gradient-from/20" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gradient-from/20 rounded w-3/4" />
                <div className="h-4 bg-gradient-from/20 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductItem
              key={product.id}
              product={product}
              onClick={() => handleProductClick(product)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <Package className="w-12 h-12 text-secondary-light/50 mb-4" />
          <h3 className="text-white font-medium mb-2">Товары не найдены</h3>
          <p className="text-secondary-light text-center max-w-md">
            {search
              ? "Попробуйте изменить параметры поиска"
              : "В выбранной категории пока нет товаров"}
          </p>
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {selectedProduct && (
        <ProductDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          product={selectedProduct}
        />
      )}

      <AddProductModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        categories={originalCategories}
      />
    </div>
  );
}
