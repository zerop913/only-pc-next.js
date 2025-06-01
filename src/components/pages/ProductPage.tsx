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
        if (!categorySlug || !productSlug) {
          throw new Error("Отсутствуют необходимые параметры");
        }

        // Добавляем -p-1 к слагу продукта, если его нет
        const fullProductSlug = productSlug.includes("-p-")
          ? productSlug
          : `${productSlug}-p-1`;

        const url = subcategorySlug
          ? `/api/products/${categorySlug}/${subcategorySlug}/${fullProductSlug}`
          : `/api/products/${categorySlug}/${fullProductSlug}`;

        console.log("Debug: Fetching product from:", url);

        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Не удалось загрузить товар");
        }

        // Строгая проверка данных
        if (!data || typeof data !== "object") {
          throw new Error("Получены некорректные данные");
        }

        // Проверяем и конвертируем поля
        const product: Product = {
          id: Number(data.id),
          title: String(data.title || ""),
          slug: String(data.slug || ""),
          price: Number(data.price),
          brand: String(data.brand || ""),
          image: data.image || null,
          description: data.description || null,
          categoryId: Number(data.categoryId),
          characteristics: Array.isArray(data.characteristics)
            ? data.characteristics
            : [],
          createdAt: data.createdAt || new Date().toISOString(),
        };

        // Проверяем обязательные поля
        if (!product.id || !product.title || !product.slug || !product.price) {
          console.error("Invalid product data:", product);
          throw new Error("Некорректные данные товара");
        }

        setProduct(product);

        // Загрузка категорий
        try {
          const catResponse = await fetch(`/api/categories`);
          const categories = await catResponse.json();

          if (!catResponse.ok) {
            throw new Error("Не удалось загрузить категории");
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
        }
      } catch (err) {
        console.error("Client: Error fetching product:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Произошла ошибка при загрузке товара"
        );
        setProduct(null);
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
