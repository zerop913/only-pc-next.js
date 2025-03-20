import { Product } from "@/types/product";
import { Package } from "lucide-react";

interface ProductItemProps {
  product: Product;
  onClick: () => void;
}

export default function ProductItem({ product, onClick }: ProductItemProps) {
  return (
    <button
      onClick={onClick}
      className="group w-full text-left p-4 rounded-lg border border-primary-border
                bg-gradient-from/10 hover:bg-gradient-from/20 transition-all duration-200"
    >
      <div className="flex items-start gap-4">
        <div className="w-24 h-24 rounded-lg border border-primary-border/50 bg-gradient-from/20 flex items-center justify-center overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package className="w-8 h-8 text-secondary-light" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium mb-1 truncate">
            {product.title}
          </h3>
          <p className="text-blue-400 mb-2">{product.price} ₽</p>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs rounded-full bg-gradient-from/30 text-secondary-light border border-primary-border/50">
              ID: {product.id}
            </span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-gradient-from/30 text-secondary-light border border-primary-border/50">
              {product.brand}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
