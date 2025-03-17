import { HeartIcon } from "@heroicons/react/24/outline";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface ProductInfoProps {
  title: string;
  description?: string | null;
  price: number;
  brand?: string | null;
  isFavorite?: boolean;
  onAddToFavorites?: () => void;
}

export default function ProductInfo({
  title,
  description,
  price,
  brand,
  isFavorite,
  onAddToFavorites,
}: ProductInfoProps) {
  const isAvailable = true; // В реальном проекте это должно приходить из данных
  const [showFullDescription, setShowFullDescription] = useState(false);

  const toggleDescription = () => {
    setShowFullDescription(!showFullDescription);
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-start">
        <div className="flex-grow">
          {brand && (
            <div className="flex items-center space-x-2 mb-1.5">
              <span className="text-secondary-light text-sm">{brand}</span>
              {isAvailable && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">
                  <Check className="w-3 h-3 mr-1" />В наличии
                </span>
              )}
            </div>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
            {title}
          </h1>
        </div>
        <button
          onClick={onAddToFavorites}
          title="Добавить в избранное"
          className="ml-3 p-3 rounded-lg bg-gradient-from/20 hover:bg-gradient-from/30 transition-all duration-300 border border-primary-border hover:border-primary-border/50 group/btn flex-shrink-0 hover:rotate-6"
        >
          <HeartIcon
            className={`w-6 h-6 ${
              isFavorite
                ? "text-red-400"
                : "text-secondary-light group-hover/btn:text-white"
            } transition-colors`}
          />
        </button>
      </div>

      <div className="py-3 px-4 bg-gradient-from/10 border border-primary-border rounded-lg inline-block w-full relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/30 to-purple-500/30"></div>
        <div className="text-xs text-secondary-light mb-1">Цена:</div>
        <div className="flex items-baseline space-x-2">
          <div className="text-3xl font-bold text-white">
            {price.toLocaleString()} ₽
          </div>
        </div>
      </div>

      {description && (
        <div className="bg-gradient-from/10 border border-primary-border rounded-lg p-4 mt-4 relative">
          <div>
            <p
              className={`text-secondary-light leading-relaxed ${
                showFullDescription ? "" : "line-clamp-3"
              }`}
            >
              {description}
            </p>
            <button
              onClick={toggleDescription}
              className="flex items-center mt-2 text-blue-400 hover:text-blue-300 transition-colors text-sm"
            >
              {showFullDescription ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Свернуть
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  Показать полностью
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
