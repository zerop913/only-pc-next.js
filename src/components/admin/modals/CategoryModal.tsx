import { CategoryWithChildren } from "@/types/category";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (category: Partial<CategoryWithChildren>) => Promise<void>;
  category?: CategoryWithChildren;
  categories: CategoryWithChildren[];
}

export default function CategoryModal({
  isOpen,
  onClose,
  onSave,
  category,
  categories,
}: CategoryModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    parentId: null as number | null,
    icon: null as string | null,
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        slug: category.slug,
        parentId: category.parentId,
        icon: category.icon,
      });
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  if (!isOpen) return null;

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
        className="relative z-10 w-full max-w-lg bg-primary rounded-xl shadow-xl border border-primary-border"
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-semibold text-white">
              {category ? "Редактирование" : "Создание"} категории
            </h2>
            <button
              onClick={onClose}
              className="text-secondary-light hover:text-white transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm text-secondary-light">Название</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3 py-2 mt-1 rounded-lg bg-gradient-from/20 border border-primary-border text-white"
                  required
                />
              </div>

              <div>
                <label className="text-sm text-secondary-light">
                  Родительская категория
                </label>
                <select
                  value={formData.parentId || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      parentId: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  className="w-full px-3 py-2 mt-1 rounded-lg bg-gradient-from/20 border border-primary-border text-white"
                >
                  <option value="">Нет родительской категории</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 
                         text-blue-400 hover:text-blue-300 border border-blue-500/30 
                         transition-all duration-300"
              >
                {category ? "Сохранить" : "Создать"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-from/20 
                         hover:bg-gradient-from/30 text-secondary-light hover:text-white 
                         border border-primary-border transition-all"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
