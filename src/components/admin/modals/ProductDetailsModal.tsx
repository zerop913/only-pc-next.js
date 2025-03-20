import { Product } from "@/types/product";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { Package } from "lucide-react";

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export default function ProductDetailsModal({
  isOpen,
  onClose,
  product,
}: ProductDetailsModalProps) {
  if (!isOpen) return null;

  const renderCategoryInfo = () => {
    if (!product.category) {
      return <p className="text-white">-</p>;
    }
    return (
      <p className="text-white">
        {product.category.name}
        <span className="text-secondary-light text-sm ml-2">
          (ID: {product.category.id})
        </span>
      </p>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative z-10 w-full max-w-3xl bg-primary rounded-xl shadow-xl border border-primary-border"
      >
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-from/20 rounded-lg border border-primary-border">
                <Package className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {product.title}
                </h2>
                <p className="text-sm text-secondary-light">ID: {product.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-secondary-light hover:text-white transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="aspect-square rounded-lg border border-primary-border bg-gradient-from/20 flex items-center justify-center overflow-hidden">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-contain"
                />
              ) : (
                <Package className="w-16 h-16 text-secondary-light" />
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-white mb-4">
                  Основная информация
                </h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-secondary-light">Цена</span>
                    <p className="text-2xl font-semibold text-white">
                      {product.price} ₽
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-secondary-light">Бренд</span>
                    <p className="text-white">{product.brand}</p>
                  </div>
                  <div>
                    <span className="text-sm text-secondary-light">
                      Категория
                    </span>
                    {renderCategoryInfo()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {product.description && (
            <div className="p-4 bg-gradient-from/10 rounded-lg border border-primary-border">
              <h3 className="text-lg font-medium text-white mb-4">Описание</h3>
              <div className="max-h-48 overflow-y-auto custom-scrollbar">
                <p className="text-secondary-light whitespace-pre-wrap pr-4">
                  {product.description}
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
