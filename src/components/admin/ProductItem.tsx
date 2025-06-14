import { Product } from "@/types/product";
import { Package, Edit2, ExternalLink, Trash2 } from "lucide-react";

interface ProductItemProps {
  product: Product;
  onClick: () => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export default function ProductItem({
  product,
  onClick,
  onEdit,
  onDelete,
}: ProductItemProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-primary-border bg-gradient-from/10 hover:bg-gradient-from/20 transition-all duration-300">
      {/* Изображение */}
      <div className="aspect-square border-b border-primary-border/50 bg-gradient-from/20">
        <div className="relative w-full h-full p-6">
          {product.image ? (
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12 text-secondary-light/50" />
            </div>
          )}
        </div>
      </div>

      {/* Информация о товаре */}
      <div className="p-4">
        <div className="min-h-[80px]">
          <h3 className="text-white font-medium line-clamp-2 mb-2 group-hover:text-blue-400 transition-colors">
            {product.title}
          </h3>
          <p className="text-secondary-light text-sm line-clamp-1">
            {product.brand}
          </p>
        </div>

        <div className="mt-3 pt-3 border-t border-primary-border/50 flex items-center justify-between">
          <div>
            <div className="text-xs text-secondary-light mb-1">Цена</div>
            <div className="text-blue-400 font-medium">{product.price} ₽</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(product);
              }}
              className="p-2 text-secondary-light hover:text-blue-400 rounded-lg hover:bg-blue-500/10 transition-colors"
              title="Редактировать"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(product);
              }}
              className="p-2 text-secondary-light hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
              title="Удалить"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClick}
              className="p-2 text-secondary-light hover:text-yellow-400 rounded-lg hover:bg-yellow-500/10 transition-colors"
              title="Подробнее"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Метка категории */}
      <div className="absolute top-3 left-3">
        <div className="px-2 py-1 text-xs rounded-md bg-gradient-from/40 border border-primary-border text-secondary-light backdrop-blur-sm">
          ID: {product.id}
        </div>
      </div>
    </div>
  );
}
