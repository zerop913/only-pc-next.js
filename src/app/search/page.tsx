"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "@/components/configurator/products/ProductCard";
import { Product } from "@/types/product";
import { SearchResponse } from "@/types/search";
import Pagination from "@/components/common/ui/Pagination";
import SearchRelevance from "@/components/search/SearchRelevance";

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const page = Number(searchParams.get("page")) || 1;
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) {
        router.push("/");
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&page=${page}`
        );
        if (response.ok) {
          const data = await response.json();
          setResults(data);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [query, page, router]);

  const handlePageChange = (newPage: number) => {
    router.push(`/search?q=${encodeURIComponent(query)}&page=${newPage}`);
  };

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="bg-primary rounded-xl p-6 border border-primary-border">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-white mb-2">
            Результаты поиска
          </h1>
          <p className="text-secondary-light">
            По запросу «{query}»{" "}
            {results && `найдено ${results.totalItems} товаров`}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-full h-32 bg-gradient-from/20 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : results?.items.length ? (
          <>
            <div className="space-y-4">
              {results.items.map((product) => {
                // Получаем категорию для формирования правильного URL
                const navigateToProduct = () => {
                  router.push(
                    `/product/${product.slug}?category=${product.categoryId}`
                  );
                };

                return (
                  <div
                    key={product.id}
                    className="group flex items-start gap-3"
                  >
                    <div className="flex-1" onClick={navigateToProduct}>
                      <ProductCard
                        product={product}
                        onAddToFavorites={() => {}}
                      />
                    </div>
                    <div className="pt-4">
                      <SearchRelevance
                        query={query}
                        title={product.title}
                        description={product.description}
                        brand={product.brand}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {results.totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={results.totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-secondary-light">
              По вашему запросу ничего не найдено
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
