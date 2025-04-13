import { useState, useEffect } from "react";
import { FavoriteProduct } from "@/types/favorite";
import ProductCard from "./ProductCard";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface FavoriteCategoryProps {
  name: string;
  favoriteItems: FavoriteProduct[];
}

export default function FavoriteCategory({ name, favoriteItems }: FavoriteCategoryProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [visibleItems, setVisibleItems] = useState<FavoriteProduct[]>([]);
  
  // Обновляем состояние visibleItems когда меняются favoriteItems
  useEffect(() => {
    if (Array.isArray(favoriteItems) && favoriteItems.every(item => item && item.id)) {
      setVisibleItems(favoriteItems);
    } else {
      setVisibleItems([]);
    }
  }, [favoriteItems]);

  // Обработчик удаления товара из списка
  const handleRemove = (itemId: number) => {
    setVisibleItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Если нет товаров для отображения, не рендерим категорию
  if (!visibleItems.length) {
    return null;
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
          className={`w-5 h-5 text-secondary-light transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
              <AnimatePresence>
                {visibleItems.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                    layout
                  >
                    <ProductCard 
                      favoriteItem={item}
                      onRemove={() => handleRemove(item.id)} 
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
