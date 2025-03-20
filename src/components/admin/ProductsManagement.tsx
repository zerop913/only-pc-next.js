import { useState, useEffect, useImperativeHandle } from "react";
import { Product } from "@/types/product";
import { Package, Info as InfoIcon, Search } from "lucide-react";
import ProductDetailsModal from "./modals/ProductDetailsModal";
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
    { value: number; label: string }[]
  >([]);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(
    undefined
  );
  const [initialCategoryId, setInitialCategoryId] = useState<number | null>(
    null
  );

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
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setProducts(data.products);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
      setTotalItems(data.totalItems);
    } catch (error) {
      console.error("Error fetching products:", error);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-gradient-from/10 rounded-lg h-32"
            />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <ProductItem
              key={product.id}
              product={product}
              onClick={() => handleProductClick(product)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-secondary-light">
          {search ? "Товары не найдены" : "Нет доступных товаров"}
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
    </div>
  );
}
