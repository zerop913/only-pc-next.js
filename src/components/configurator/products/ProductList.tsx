import { useCallback, useState } from "react"; // Добавляем useState
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import ProductCard from "./ProductCard";
import Pagination from "@/components/common/ui/Pagination";
import { PaginatedProducts } from "@/services/productService";
import { usePagination } from "@/hooks/usePagination";

interface ProductListProps {
  data: PaginatedProducts;
  category: string;
  subcategory?: string;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
}

export default function ProductList({
  data,
  category,
  subcategory,
  isLoading = false,
  onPageChange,
}: ProductListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isChanging, setIsChanging] = useState(false); // Добавляем состояние для отслеживания изменений

  const handlePageChange = useCallback(
    async (page: number) => {
      if (
        data.currentPage === page ||
        isLoading ||
        isChanging ||
        !data.products
      )
        return;

      try {
        setIsChanging(true);
        await onPageChange(page);
        // Добавляем плавный скролл наверх
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      } finally {
        setIsChanging(false);
      }
    },
    [data.currentPage, data.products, isLoading, isChanging, onPageChange]
  );

  if (!data) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="w-full h-32 bg-gradient-from/20 rounded-xl border border-primary-border animate-pulse"
          />
        ))}
      </div>
    );
  }

  // Проверяем, является ли data объектом с подкатегориями
  if ("hasSubcategories" in data) {
    return (
      <div className="text-center py-8">
        <p className="text-secondary-light">Выберите подкатегорию</p>
      </div>
    );
  }

  // Определяем массив продуктов и проверяем их наличие
  const products = Array.isArray(data.products) ? data.products : [];
  const totalItems = data.totalItems || 0;
  const totalPages = data.totalPages || 1;
  const currentPage = data.currentPage || 1;

  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-secondary-light">Товары не найдены</p>
      </div>
    );
  }

  return (
    <div className="product-list">
      <div className="text-secondary-light text-sm mb-4">
        Найдено товаров: {totalItems}
        {totalPages > 1 && (
          <span className="text-secondary-light ml-2">
            (Страница {currentPage} из {totalPages})
          </span>
        )}
      </div>

      <div className="space-y-4">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToFavorites={(id) => console.log("Add to favorites:", id)}
            onAddToConfiguration={(id) =>
              console.log("Add to configuration:", id)
            }
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
