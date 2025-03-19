import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { InfoIcon, X, ChevronDown, ChevronUp } from "lucide-react";

interface SearchRelevanceProps {
  query: string;
  title: string;
  description?: string | null;
  brand?: string;
}

const highlightText = (text: string, searchQuery: string) => {
  if (!text || !searchQuery) return text;

  const parts = text.split(new RegExp(`(${searchQuery})`, "gi"));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === searchQuery.toLowerCase() ? (
          <span key={i} className="bg-blue-500/20 text-blue-400 px-1 rounded">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </span>
  );
};

const MatchItem = ({
  match,
  query,
}: {
  match: { type: string; text: string };
  query: string;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [needsExpansion, setNeedsExpansion] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Проверяем, нужна ли кнопка "Показать больше"
    if (match.type === "Описание" && match.text.length > 150) {
      setNeedsExpansion(true);
    }
  }, [match.text, match.type]);

  if (!isMobile || match.type !== "Описание") {
    return (
      <div className="p-4 rounded-lg bg-gradient-from/10 border border-primary-border hover:bg-gradient-from/20 transition-all duration-300">
        <div className="text-sm text-blue-400 mb-2">{match.type}:</div>
        <div className="text-secondary-light">
          {highlightText(match.text, query)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg bg-gradient-from/10 border border-primary-border transition-all duration-300">
      <div className="text-sm text-blue-400 mb-2">{match.type}:</div>
      <div
        className={`text-secondary-light overflow-hidden transition-all duration-300 ${
          isExpanded ? "max-h-[60vh] overflow-y-auto" : "max-h-[4.5em]"
        }`}
      >
        {highlightText(match.text, query)}
      </div>
      {needsExpansion && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 mt-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              <span>Скрыть</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              <span>Показать полностью</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};

const SearchRelevance = ({
  query,
  title,
  description,
  brand,
}: SearchRelevanceProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const findMatches = () => {
    const matches = [];
    if (title && title.toLowerCase().includes(query.toLowerCase())) {
      matches.push({
        type: "Название",
        text: title,
      });
    }
    if (brand && brand.toLowerCase().includes(query.toLowerCase())) {
      matches.push({
        type: "Производитель",
        text: brand,
      });
    }
    if (
      description &&
      description.toLowerCase().includes(query.toLowerCase())
    ) {
      matches.push({
        type: "Описание",
        text: description,
      });
    }
    return matches;
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-1.5 rounded-full hover:bg-gradient-from/30 transition-colors group"
        title="Показать совпадения"
      >
        <InfoIcon className="w-4 h-4 text-secondary-light group-hover:text-white transition-colors" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden"
            >
              <div className="bg-primary p-6 rounded-xl border border-primary-border shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">
                    Найденные совпадения
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-gradient-from/30 transition-colors"
                  >
                    <X className="w-5 h-5 text-secondary-light hover:text-white" />
                  </button>
                </div>

                <div className="space-y-4 overflow-y-auto">
                  {findMatches().map((match, index) => (
                    <MatchItem key={index} match={match} query={query} />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SearchRelevance;
