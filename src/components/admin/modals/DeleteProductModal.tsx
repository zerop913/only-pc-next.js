import { motion } from "framer-motion";
import { XMarkIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Product } from "@/types/product";
import { useState } from "react";

interface DeleteProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  product: Product;
  isLoading?: boolean;
}

export default function DeleteProductModal({
  isOpen,
  onClose,
  onConfirm,
  product,
  isLoading = false,
}: DeleteProductModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
        className="relative bg-primary-dark border border-primary-border rounded-xl p-6 w-full max-w-md z-[101]"
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/30">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                Подтверждение удаления
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-secondary-light hover:text-white rounded-lg hover:bg-gradient-from/20 transition-colors disabled:opacity-50"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Содержимое */}
        <div className="space-y-4">
          <p className="text-secondary-light">
            Вы уверены, что хотите удалить товар?
          </p>
          
          <div className="p-4 bg-gradient-from/10 border border-primary-border rounded-lg">
            <div className="flex items-start gap-3">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-12 h-12 object-contain rounded-lg border border-primary-border"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-from/20 rounded-lg border border-primary-border flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-6 h-6 text-secondary-light/50" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium line-clamp-2">
                  {product.title}
                </h3>
                <p className="text-secondary-light text-sm">
                  {product.brand} • {product.price} ₽
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">
              <strong>Внимание!</strong> Это действие нельзя отменить. Товар будет удален навсегда.
            </p>
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-from/20 hover:bg-gradient-from/30 text-secondary-light hover:text-white border border-primary-border transition-all disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Удаление...</span>
              </>
            ) : (
              <span>Удалить товар</span>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
