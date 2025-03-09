import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import ProductCard from "./ProductCard";
import Pagination from "@/components/common/ui/Pagination";
import { Product } from "@/types/product";
import {
  filterProducts,
  parseFilterQueryString,
} from "@/services/productFilterService";

const ITEMS_PER_PAGE = 30;

interface ProductListProps {
  initialProducts: Product[];
  category: string;
  subcategory?: string;
  isLoading?: boolean;
}

export default function ProductList({
  initialProducts,
  category,
  subcategory,
  isLoading = false,
}: ProductListProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);

  useEffect(() => {
    const page = parseInt(searchParams.get("page") || "1");
    const filterString = searchParams.toString();

    setCurrentPage(page);

    // Если есть фильтры в URL, применяем их
    if (filterString) {
      const filterCriteria = parseFilterQueryString(filterString);
      const filteredProducts = filterProducts(initialProducts, filterCriteria);
      setProducts(filteredProducts);
    } else {
      setProducts(initialProducts);
    }
  }, [searchParams, initialProducts]);

  useEffect(() => {
    setProducts(initialProducts);
    // При смене категории всегда переходим на первую страницу
    const currentCategory = searchParams.get("category");
    if (currentCategory !== category) {
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.set("category", category);
      newParams.set("page", "1");
      if (subcategory) {
        newParams.set("subcategory", subcategory);
      } else {
        newParams.delete("subcategory");
      }
      router.push(`${pathname}?${newParams.toString()}`);
    }
  }, [initialProducts, category, subcategory]);

  const handlePageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("page", page.toString());
    router.push(`${pathname}?${newParams.toString()}`, { scroll: false });
    setCurrentPage(page);
  };

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const visibleProducts = products.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const handleAddToFavorites = (productId: number) => {
    console.log("Add to favorites:", productId);
  };

  const handleAddToConfiguration = (productId: number) => {
    console.log("Add to configuration:", productId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-secondary-light">
        Товары не найдены
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-secondary-light text-sm">
        Найдено товаров: {products.length}
      </div>

      <div className="space-y-4">
        {visibleProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToFavorites={handleAddToFavorites}
            onAddToConfiguration={handleAddToConfiguration}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
