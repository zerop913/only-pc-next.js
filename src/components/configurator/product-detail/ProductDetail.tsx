import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/types/product";
import ProductBreadcrumbs from "./ProductBreadcrumbs";
import ProductGallery from "./ProductGallery";
import ProductInfo from "./ProductInfo";
import ProductCharacteristics from "./ProductCharacteristics";
import ProductActions from "./ProductActions";

interface ProductDetailProps {
  product: Product;
  categoryName: string;
  categorySlug: string;
  subcategoryName?: string;
  subcategorySlug?: string;
  preservePage?: boolean;
}

export default function ProductDetail({
  product,
  categoryName,
  categorySlug,
  subcategoryName,
  subcategorySlug,
  preservePage = true,
}: ProductDetailProps) {
  const router = useRouter();

  const handleAddToConfiguration = (productId: number) => {
    // Здесь будет логика добавления товара в конфигурацию
    console.log(`Adding product ${productId} to configuration`);
    // Можно добавить вызов API или обновление состояния
  };

  const handleAddToFavorites = (productId: number) => {
    // Здесь будет логика добавления товара в избранное
    console.log(`Adding product ${productId} to favorites`);
    // Можно добавить вызов API или обновление состояния
  };

  return (
    <div className="bg-primary rounded-xl p-4 sm:p-6 lg:p-8 shadow-xl border border-primary-border backdrop-blur-sm bg-opacity-80 transition-all duration-300">
      <ProductBreadcrumbs
        categoryName={categoryName}
        categorySlug={categorySlug}
        subcategoryName={subcategoryName}
        subcategorySlug={subcategorySlug}
        productName={product.title}
        preservePage={preservePage}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        <div className="order-1">
          <ProductGallery image={product.image} title={product.title} />
        </div>

        <div className="order-2">
          <ProductInfo
            title={product.title}
            description={product.description}
            price={product.price}
            brand={product.brand}
            onAddToFavorites={() => handleAddToFavorites(product.id)}
          />

          <ProductActions
            productId={product.id}
            onAddToConfiguration={handleAddToConfiguration}
          />
        </div>
      </div>

      <ProductCharacteristics characteristics={product.characteristics} />
    </div>
  );
}
