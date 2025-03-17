import { motion } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Product } from "@/types/product";
import Image from "next/image";
import { ImageIcon } from "lucide-react";

interface ReplaceProductModalProps {
  currentProduct: Product;
  newProduct: Product;
  onConfirm: () => void;
  onCancel: () => void;
}

const ProductCard = ({ product }: { product: Product }) => (
  <div className="p-4 bg-gradient-from/20 rounded-lg border border-primary-border">
    <div className="flex items-center gap-4">
      <div className="relative w-20 h-20 flex-shrink-0">
        {product.image ? (
          <Image
            src={
              product.image.startsWith("/")
                ? product.image
                : `/${product.image}`
            }
            alt={product.title}
            fill
            className="object-contain rounded-lg"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center border border-primary-border rounded-lg">
            <ImageIcon className="w-8 h-8 text-secondary-light" />
          </div>
        )}
      </div>
      <div className="flex-1">
        <h4 className="text-white font-medium line-clamp-2">{product.title}</h4>
        <p className="text-secondary-light text-sm mt-1">
          {product.price.toLocaleString()} ₽
        </p>
      </div>
    </div>
  </div>
);

export default function ReplaceProductModal({
  currentProduct,
  newProduct,
  onConfirm,
  onCancel,
}: ReplaceProductModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      />

      <motion.div
        className="relative z-10 w-full max-w-lg bg-primary rounded-xl shadow-xl border border-primary-border"
        variants={{
          hidden: { opacity: 0, scale: 0.95 },
          visible: { opacity: 1, scale: 1 },
        }}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">
              Замена компонента
            </h2>
            <button
              onClick={onCancel}
              className="text-secondary-light hover:text-white transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-secondary-light mb-2">Текущий компонент:</p>
              <ProductCard product={currentProduct} />
            </div>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-primary-border"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-2 bg-primary text-secondary-light text-sm">
                  заменить на
                </span>
              </div>
            </div>

            <div>
              <p className="text-secondary-light mb-2">Новый компонент:</p>
              <ProductCard product={newProduct} />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-b from-blue-500/10 to-blue-600/5 hover:from-blue-500/20 hover:to-blue-600/10 border border-blue-500/30 hover:border-blue-500/50 font-medium transition-all duration-300 group"
            >
              <span className="text-white">Заменить</span>
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-from/20 hover:bg-gradient-from/30 text-secondary-light hover:text-white border border-primary-border transition-all"
            >
              Отмена
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
