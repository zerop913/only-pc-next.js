import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { SearchResponse, PcBuildProduct } from "@/types/search";
import SearchRelevance from "@/components/search/SearchRelevance";
import { Product } from "@/types/product";
import { ShoppingCartIcon } from "@heroicons/react/24/outline";
import { useCart } from "@/contexts/CartContext";
import { getImageUrl } from "@/lib/utils/imageUtils";

interface SearchResultsProps {
  results: SearchResponse & { query: string };
  onViewAll: () => void;
  onClose: () => void;
}

const SearchResults = ({ results, onViewAll, onClose }: SearchResultsProps) => {
  const router = useRouter();
  const { addToCart } = useCart();

  const handleProductClick = (item: Product | PcBuildProduct) => {
    if ("isBuild" in item) {
      // Это готовая сборка
      router.push(`/catalog/${item.slug}`);
    } else {
      // Это обычный продукт
      router.push(`/product/${item.slug}?category=${item.categoryId}`);
    }
    onClose();
  };
  // Карта соответствий slug категорий их названиям
  const CATEGORY_NAMES: Record<string, string> = {
    "materinskie-platy": "Материнская плата",
    processory: "Процессор",
    videokarty: "Видеокарта",
    "operativnaya-pamyat": "Оперативная память",
    nakopiteli: "Накопитель",
    "bloki-pitaniya": "Блок питания",
    korpusa: "Корпус",
    kulery: "Кулер",
  };

  // Функция для получения имени категории по slug
  const getCategoryName = (slug: string): string => {
    return CATEGORY_NAMES[slug] || "Компонент";
  };

  const handleAddToCart = (e: React.MouseEvent, item: PcBuildProduct) => {
    e.stopPropagation();
    e.preventDefault();

    // Создаем объект с компонентами для отображения в корзине
    const cartComponents: Record<
      string,
      { name: string; categoryName: string }
    > = {};

    // Преобразуем формат компонентов для корзины
    if (item.components) {
      Object.entries(item.components).forEach(([categorySlug, component]) => {
        if (typeof component === "object" && component !== null) {
          cartComponents[categorySlug] = component;
        } else {
          // Если компонент представлен не как объект, создаем заглушку
          cartComponents[categorySlug] = {
            name: typeof component === "string" ? component : "Компонент",
            categoryName: getCategoryName(categorySlug),
          };
        }
      });
    }

    // Добавляем сборку в корзину
    addToCart({
      id: item.id,
      name: item.title,
      price: item.price,
      image: item.image || undefined,
      slug: item.slug,
      type: "build",
      quantity: 1,
      components: cartComponents,
    });
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
              {results.items.map((item) => {
                const isBuild = "isBuild" in item;

                return (
                  <div key={item.id} className="relative group">
                    <div
                      onClick={() => handleProductClick(item)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gradient-from/20 cursor-pointer transition-colors"
                    >
                      <div className="relative w-12 h-12 flex-shrink-0">
                        {" "}
                        {item.image ? (
                          <Image
                            src={getImageUrl(
                              item.image.startsWith("http")
                                ? item.image
                                : item.image.startsWith("/")
                                  ? item.image
                                  : `/${item.image}`
                            )}
                            alt={item.title}
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
                        {isBuild && (
                          <span className="inline-block bg-blue-500 text-[10px] px-1 py-0.5 rounded text-white mb-1">
                            СБОРКА
                          </span>
                        )}
                        <h4 className="text-sm text-white truncate">
                          {item.title}
                        </h4>
                        <p className="text-sm text-secondary-light">
                          {item.price.toLocaleString()} ₽
                        </p>
                      </div>
                      {isBuild && (
                        <button
                          onClick={(e) =>
                            handleAddToCart(e, item as PcBuildProduct)
                          }
                          className="p-1.5 rounded bg-gradient-from/20 hover:bg-gradient-from/40 transition-colors"
                          title="Добавить в корзину"
                        >
                          <ShoppingCartIcon className="w-4 h-4 text-secondary-light" />
                        </button>
                      )}
                    </div>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <SearchRelevance
                        query={results.query}
                        title={item.title}
                        description={item.description || ""}
                        brand={item.brand}
                      />
                    </div>
                  </div>
                );
              })}
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
