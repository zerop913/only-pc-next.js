import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/types/product";
import ProductBreadcrumbs from "./ProductBreadcrumbs";
import ProductGallery from "./ProductGallery";
import ProductInfo from "./ProductInfo";
import ProductCharacteristics from "./ProductCharacteristics";
import ProductActions from "./ProductActions";
import { useFavorites } from "@/contexts/FavoritesContext";
import Notification from "@/components/common/Notification/Notification";

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
  const { addToFavorites: addToFav, isFavorite } = useFavorites();
  const [showFavNotification, setShowFavNotification] = useState(false);

  const handleAddToFavorites = async () => {
    await addToFav(product.id);
    setShowFavNotification(true);
    setTimeout(() => setShowFavNotification(false), 2000);
  };

  return (
    <>
      <div className="bg-primary rounded-xl p-4 sm:p-6 lg:p-8 shadow-xl border border-primary-border backdrop-blur-sm bg-opacity-80 transition-all duration-300 overflow-x-hidden">
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
              isFavorite={isFavorite(product.id)}
              onAddToFavorites={handleAddToFavorites}
            />

            <ProductActions product={product} />
          </div>
        </div>

        <ProductCharacteristics characteristics={product.characteristics} />
      </div>

      <Notification
        type="success"
        message={
          isFavorite(product.id)
            ? "Добавлено в избранное"
            : "Удалено из избранного"
        }
        isVisible={showFavNotification}
        onClose={() => setShowFavNotification(false)}
      />
    </>
  );
}
