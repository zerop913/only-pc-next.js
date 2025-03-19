import { motion } from "framer-motion";
import { SearchIcon } from "lucide-react";

interface SearchSuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
}

const SearchSuggestions = ({
  suggestions,
  onSelect,
}: SearchSuggestionsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
      className="absolute top-full left-0 right-0 mt-2 z-[100] bg-primary rounded-lg border border-primary-border shadow-xl"
    >
      <div className="py-1">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelect(suggestion)}
            className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gradient-from/20 transition-colors"
          >
            <SearchIcon className="w-4 h-4 text-secondary-light" />
            <span className="text-sm text-secondary-light">{suggestion}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default SearchSuggestions;
