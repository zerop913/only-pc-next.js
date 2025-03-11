"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { Product } from "@/types/product";
import ProductDetail from "@/components/configurator/product-detail/ProductDetail";

export default function ProductPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categoryName, setCategoryName] = useState<string>("");
  const [subcategoryName, setSubcategoryName] = useState<string | undefined>(
    undefined
  );

  // Получаем slug категории и подкатегории из URL параметров
  const categorySlug = searchParams.get("category") || "";
  const subcategorySlug = searchParams.get("subcategory") || undefined;
  const productSlug = params.slug as string;

  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let url = `/api/products/${categorySlug}/${productSlug}`;

        if (subcategorySlug) {
          url = `/api/products/${categorySlug}/${subcategorySlug}/${productSlug}`;
        }

        console.log("Fetching product from:", url); // Добавляем лог для отладки

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Не удалось загрузить данные о товаре");
        }

        if (!data || !data.id) {
          throw new Error("Получены некорректные данные о товаре");
        }

        setProduct(data);

        // Дополнительный запрос для получения имен категорий
        try {
          const catResponse = await fetch(`/api/categories`);
          const categories = await catResponse.json();

          if (!catResponse.ok) {
            console.error("Failed to fetch categories:", categories);
            return;
          }

          const category = categories.find((c: any) => c.slug === categorySlug);
          if (category) {
            setCategoryName(category.name);

            if (subcategorySlug && category.children) {
              const subcategory = category.children.find(
                (sc: any) => sc.slug === subcategorySlug
              );
              if (subcategory) {
                setSubcategoryName(subcategory.name);
              }
            }
          }
        } catch (err) {
          console.error("Error fetching categories:", err);
          // Не выбрасываем ошибку, так как это некритичная информация
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Произошла ошибка при загрузке товара"
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (categorySlug && productSlug) {
      fetchProduct();
    }
  }, [categorySlug, subcategorySlug, productSlug]);

  // Отображение состояния загрузки
  if (isLoading) {
    return (
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col justify-center items-center py-16 bg-primary/30 rounded-xl border border-primary-border backdrop-blur-sm">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
          <p className="text-secondary-light animate-pulse">
            Загрузка товара...
          </p>
        </div>
      </div>
    );
  }

  // Отображение ошибки
  if (error || !product) {
    return (
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-primary rounded-xl p-8 shadow-lg border border-primary-border text-center">
          <h2 className="text-xl text-white mb-6">
            {error || "Товар не найден"}
          </h2>
          <button
            onClick={() => router.back()}
            className="px-5 py-3 bg-gradient-from/20 hover:bg-gradient-from/40 transition-all duration-300 border border-primary-border rounded-lg text-secondary-light hover:text-white transform hover:-translate-y-1 hover:shadow-lg"
          >
            Вернуться назад
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <ProductDetail
        product={product}
        categoryName={categoryName}
        categorySlug={categorySlug}
        subcategoryName={subcategoryName}
        subcategorySlug={subcategorySlug}
        preservePage={true}
      />
    </div>
  );
}
