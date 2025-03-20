import { CategoryWithChildren } from "@/types/category";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { FolderTree, Package, GitBranch } from "lucide-react";
import { useRouter } from "next/navigation";

interface CategoryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: CategoryWithChildren;
  onNavigateToProducts?: (categoryId: number) => void;
}

export const CategoryDetailsModal = ({
  isOpen,
  onClose,
  category,
  onNavigateToProducts,
}: CategoryDetailsModalProps) => {
  if (!isOpen) return null;

  const countTotalSubcategories = (cat: CategoryWithChildren): number => {
    return cat.children.reduce(
      (acc, child) => acc + 1 + countTotalSubcategories(child),
      0
    );
  };

  const countTotalProducts = (cat: CategoryWithChildren): number => {
    return (
      cat.productCount +
      cat.children.reduce((acc, child) => acc + countTotalProducts(child), 0)
    );
  };

  const hasDirectProducts = category.productCount > 0;
  const shouldShowProductsButton = hasDirectProducts;

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
        className="relative z-10 w-full max-w-2xl bg-primary rounded-xl shadow-xl border border-primary-border overflow-auto max-h-[90vh]"
      >
        <div className="p-6 space-y-6">
          {/* Заголовок */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500/10 rounded-lg border border-blue-500/20">
                <FolderTree className="w-7 h-7 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {category.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-secondary-light">
                    ID: {category.id}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-secondary-light/50"></span>
                  <span className="text-sm text-secondary-light">
                    Slug: {category.slug}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-secondary-light hover:text-white transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Статистика */}
            <div className="grid grid-cols-3 gap-4"></div>
            <div className="p-4 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-lg border border-primary-border">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-secondary-light">Товары</span>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-semibold text-white">
                  {countTotalProducts(category)}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-secondary-light">В категории:</span>
                  <span className="text-blue-400">{category.productCount}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-secondary-light">В подкатегориях:</span>
                  <span className="text-purple-400">
                    {countTotalProducts(category) - category.productCount}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-lg border border-primary-border">
              <div className="flex items-center gap-2 mb-3">
                <GitBranch className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-secondary-light">
                  Подкатегории
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-semibold text-white">
                  {countTotalSubcategories(category)}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-secondary-light">Прямых:</span>
                  <span className="text-blue-400">
                    {category.children.length}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-secondary-light">Вложенных:</span>
                  <span className="text-purple-400">
                    {countTotalSubcategories(category) -
                      category.children.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-lg border border-primary-border">
              <div className="flex items-center gap-2 mb-3">
                <FolderTree className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-secondary-light">Иерархия</span>
              </div>
              <div className="space-y-1">
                <p className="text-lg font-medium text-white">
                  {category.parentId ? "Вложенная" : "Корневая"}
                </p>
                <div className="flex items-center gap-2 text-xs text-secondary-light">
                  {category.parentId
                    ? "Имеет родительскую категорию"
                    : "Категория верхнего уровня"}
                </div>
              </div>
            </div>

            {/* Показываем кнопку только если есть прямые товары */}
            {shouldShowProductsButton && (
              <button
                onClick={() => {
                  onClose();
                  if (onNavigateToProducts) {
                    onNavigateToProducts(category.id);
                  }
                }}
                className="w-full px-4 py-3 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 
                     text-blue-400 hover:text-blue-300 border border-blue-500/30 
                     transition-all duration-300 flex items-center justify-center gap-2"
              >
                <Package className="w-5 h-5" />
                <span>Перейти к товарам категории</span>
              </button>
            )}

            {/* Дерево подкатегорий */}
            {category.children.length > 0 && (
              <div className="p-4 mt-6 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-lg border border-primary-border">
                <h3 className="text-lg font-medium text-white mb-4">
                  Прямые подкатегории
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {category.children.map((child) => (
                    <div
                      key={child.id}
                      className="p-3 bg-gradient-from/10 rounded-lg border border-primary-border/50"
                    >
                      <div className="flex items-center gap-2">
                        <FolderTree className="w-4 h-4 text-blue-400" />
                        <span className="text-white">{child.name}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-secondary-light">
                        <span>Товаров: {child.productCount}</span>
                        <span>Подкатегорий: {child.children.length}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
