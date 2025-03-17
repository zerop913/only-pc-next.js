import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { FavoriteItem } from "@/types/favorite";
import ProductCard from "./ProductCard";

interface FavoriteCategoryProps {
  categoryName: string;
  products: FavoriteItem[];
  defaultCollapsed?: boolean;
  onItemRemove?: () => void;
}

export default function FavoriteCategory({
  categoryName,
  products,
  defaultCollapsed = false,
  onItemRemove,
}: FavoriteCategoryProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div className="bg-gradient-from/20 rounded-xl border border-primary-border overflow-hidden">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between p-4 hover:bg-gradient-from/20 border-b border-primary-border transition-all duration-300"
      >
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium text-white">{categoryName}</h2>
          <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {products.length}
          </span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-blue-400 transition-transform duration-300 ${
            !isCollapsed ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4">
              <motion.div layout className="space-y-4">
                <AnimatePresence mode="popLayout" initial={false}>
                  {products.map((item) => (
                    <motion.div
                      key={`product-${item.id}-${item.productId}`}
                      layout
                    >
                      <ProductCard
                        product={item.product}
                        onRemove={onItemRemove}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
