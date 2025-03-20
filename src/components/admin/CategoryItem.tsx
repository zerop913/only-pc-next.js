import { CategoryWithChildren } from "@/types/category";
import { ChevronRight, FolderTree } from "lucide-react";

interface CategoryItemProps {
  category: CategoryWithChildren;
  level: number;
  isExpanded: boolean;
  onToggle: (id: number) => void;
  onClick: (category: CategoryWithChildren) => void;
}

export default function CategoryItem({
  category,
  level,
  isExpanded,
  onToggle,
  onClick,
}: CategoryItemProps) {
  return (
    <div className="select-none">
      <button
        onClick={() => onClick(category)}
        className={`
          group w-full flex items-center gap-3 px-4 py-3.5
          transition-all duration-200 relative
          ${
            isExpanded
              ? "bg-gradient-from/20 border-blue-500/20"
              : "bg-gradient-from/10 hover:bg-gradient-from/20 border-primary-border/50"
          }
          border rounded-lg
        `}
        style={{ marginLeft: `${level * 20}px` }}
      >
        {/* Иконка раскрытия */}
        <div
          className={`
            w-8 h-8 flex items-center justify-center
            transition-transform duration-200
            ${category.children.length ? "text-blue-400" : "opacity-0"}
            ${isExpanded ? "rotate-90" : ""}
          `}
          onClick={(e) => {
            e.stopPropagation();
            if (category.children.length) onToggle(category.id);
          }}
        >
          <ChevronRight className="w-5 h-5" />
        </div>

        {/* Иконка категории */}
        <div className="text-secondary-light group-hover:text-blue-400 transition-colors p-2 bg-gradient-from/20 rounded-lg">
          <FolderTree className="w-5 h-5" />
        </div>

        {/* Информация о категории */}
        <div className="flex-1 flex items-center justify-between">
          <div className="flex flex-col items-start">
            <span className="text-[15px] font-medium text-secondary-light group-hover:text-white transition-colors">
              {category.name}
            </span>
            {category.productCount > 0 && (
              <span className="text-xs text-secondary-light/70 mt-0.5">
                {category.productCount} товар(ов)
              </span>
            )}
          </div>

          {category.children.length > 0 && (
            <span className="text-xs font-medium px-2.5 py-1 bg-gradient-from/30 text-secondary-light rounded-full">
              {category.children.length} подкатегори
              {category.children.length === 1 ? "я" : "и"}
            </span>
          )}
        </div>
      </button>
    </div>
  );
}
