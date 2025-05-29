import { useState, useEffect } from "react";
import { FavoriteItem } from "@/types/favorite";
import ProductCard from "./ProductCard";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface FavoriteCategoryProps {
  name: string;
  favoriteItems: FavoriteItem[];
}

export default function FavoriteCategory({
  name,
  favoriteItems,
}: FavoriteCategoryProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [visibleItems, setVisibleItems] = useState<FavoriteItem[]>([]);

  // Обновляем состояние visibleItems когда меняются favoriteItems
  useEffect(() => {
    if (
      Array.isArray(favoriteItems) &&
      favoriteItems.every((item) => item && item.id)
    ) {
      setVisibleItems(favoriteItems);
    } else {
      setVisibleItems([]);
    }
  }, [favoriteItems]);

  // Обработчик удаления товара из списка с анимацией
  const handleRemove = (itemId: number) => {
    // Оставляем старую реализацию, чтобы сразу обновить UI
    setVisibleItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  // Если нет товаров для отображения, возвращаем AnimatePresence с null,
  // чтобы анимировать исчезновение всей категории
  if (!visibleItems.length) {
    return (
      <motion.div
        initial={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {null}
      </motion.div>
    );
  }

  return (
    <div className="bg-gradient-from/5 rounded-xl border border-primary-border overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gradient-from/10 border-b border-primary-border/50 text-left"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium text-white">{name}</h2>
          <span className="px-2 py-0.5 bg-gradient-from/20 rounded-full text-xs text-secondary-light border border-primary-border/50">
            {visibleItems.length}
          </span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-secondary-light transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4"
              layout
            >
              <AnimatePresence mode="popLayout">
                {visibleItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{
                      opacity: 0,
                      scale: 0.8,
                      y: -10,
                      transition: { duration: 0.3, ease: "easeInOut" },
                    }}
                    layout
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 25,
                      mass: 1,
                    }}
                  >
                    <ProductCard
                      favoriteItem={item}
                      onRemove={() => handleRemove(item.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
