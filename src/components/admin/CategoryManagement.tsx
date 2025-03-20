import { useState, useEffect } from "react";
import { CategoryWithChildren } from "@/types/category";
import { FolderTree, Info as InfoIcon } from "lucide-react";
import { CategoryDetailsModal } from "./modals/CategoryDetailsModal";
import CategoryItem from "./CategoryItem";

interface CategoryManagementProps {
  onNavigateToProducts?: (categoryId: number) => void;
}

export default function CategoryManagement({
  onNavigateToProducts,
}: CategoryManagementProps) {
  const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] =
    useState<CategoryWithChildren | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/admin/categories", {
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryClick = (category: CategoryWithChildren) => {
    setSelectedCategory(category);
    setShowDetailsModal(true);
  };

  const handleToggleExpand = (categoryId: number) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const renderCategoryTree = (category: CategoryWithChildren, level = 0) => {
    return (
      <div key={category.id} className="mb-1.5">
        <CategoryItem
          category={category}
          level={level}
          isExpanded={expandedCategories.includes(category.id)}
          onToggle={handleToggleExpand}
          onClick={handleCategoryClick}
        />
        {expandedCategories.includes(category.id) && (
          <div className="mt-1.5 space-y-1.5">
            {category.children.map((child) =>
              renderCategoryTree(child, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return <div className="animate-pulse">Загрузка категорий...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-medium text-white">Категории</h2>
            <div className="px-2 py-0.5 text-sm bg-gradient-from/20 text-secondary-light rounded-md border border-primary-border">
              Всего: {categories.length}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-4 py-2.5 bg-gradient-from/10 rounded-lg border border-primary-border/50">
          <InfoIcon className="w-5 h-5 text-blue-400" />
          <p className="text-sm text-secondary-light">
            Нажмите на категорию, чтобы увидеть подробную информацию
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        {categories.map((category) => renderCategoryTree(category))}
      </div>

      {selectedCategory && (
        <CategoryDetailsModal
          isOpen={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          category={selectedCategory}
          onNavigateToProducts={onNavigateToProducts}
        />
      )}
    </div>
  );
}
