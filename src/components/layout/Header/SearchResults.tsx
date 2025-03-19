import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { SearchResponse } from "@/types/search";
import SearchRelevance from "@/components/search/SearchRelevance";

interface SearchResultsProps {
  results: SearchResponse & { query: string }; // Обновляем тип
  onViewAll: () => void;
  onClose: () => void;
}

const SearchResults = ({ results, onViewAll, onClose }: SearchResultsProps) => {
  const router = useRouter();

  const handleProductClick = (slug: string) => {
    router.push(`/product/${slug}`);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute top-full left-0 right-0 mt-2 z-50 bg-primary rounded-lg border border-primary-border shadow-xl overflow-hidden"
    >
      <div className="p-2">
        {results.items.length > 0 ? (
          <>
            <div className="space-y-2">
              {results.items.map((product) => (
                <div key={product.id} className="relative group">
                  <div
                    onClick={() => handleProductClick(product.slug)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gradient-from/20 cursor-pointer transition-colors"
                  >
                    <div className="relative w-12 h-12 flex-shrink-0">
                      {product.image ? (
                        <Image
                          src={
                            product.image.startsWith("/")
                              ? product.image
                              : `/${product.image}`
                          }
                          alt={product.title}
                          fill
                          className="object-contain rounded"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-from/20 rounded">
                          <ImageIcon className="w-6 h-6 text-secondary-light" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm text-white truncate">
                        {product.title}
                      </h4>
                      <p className="text-sm text-secondary-light">
                        {product.price.toLocaleString()} ₽
                      </p>
                    </div>
                  </div>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <SearchRelevance
                      query={results.query}
                      title={product.title}
                      description={product.description}
                      brand={product.brand}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onViewAll}
              className="w-full mt-2 p-2 text-sm text-secondary-light hover:text-white bg-gradient-from/10 hover:bg-gradient-from/20 rounded-lg border border-primary-border transition-colors"
            >
              Показать все результаты ({results.totalItems})
            </button>
          </>
        ) : (
          <div className="p-4 text-center text-secondary-light">
            Ничего не найдено
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SearchResults;
