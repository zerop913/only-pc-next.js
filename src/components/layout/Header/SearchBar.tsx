import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "@/hooks/useDebounce";
import SearchResults from "./SearchResults";
import SearchSuggestions from "./SearchSuggestions";
import { type SearchResponse } from "@/types/search";

interface SearchBarProps {
  isTablet?: boolean;
  className?: string;
  isMobile?: boolean;
  onSearch?: () => void;
}

const SearchBar = ({
  isTablet,
  className = "",
  isMobile = false,
  onSearch,
}: SearchBarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchValue.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const response = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(searchValue)}`
        );
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions);
        }
      } catch (error) {
        console.error("Suggestions error:", error);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  const handleSearchClick = () => {
    if (!isExpanded) {
      setIsExpanded(true);
      setTimeout(() => {
        setIsVisible(true);
        inputRef.current?.focus();
      }, 50);
    }
  };

  const handleCollapse = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsExpanded(false);
    }, 300);
  };

  const handleClear = () => {
    setSearchValue("");
    if (!isMobile) {
      handleCollapse();
    }
    inputRef.current?.blur();
  };

  const handleViewAll = () => {
    router.push(`/search?q=${encodeURIComponent(searchValue)}`);
    handleClear();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchValue.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchValue)}`);
      handleClear();
      onSearch?.(); // Вызываем колбэк после поиска
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
    handleClear();
    onSearch?.(); // Вызываем колбэк после поиска
  };

  const baseInputStyles = `
    pl-9 pr-8 py-2 rounded-full
    text-secondary placeholder-secondary-dark 
    outline-none
    text-sm
    transition-all duration-300 ease-in-out
  `;

  const mobileStyles = `
    bg-gradient-to-br from-gradient-from to-gradient-to
    border-0
  `;

  const desktopStyles = `
    bg-primary border border-primary-border
    focus:border-secondary-dark
  `;

  if (isMobile) {
    return (
      <div className={`relative ${className}`}>
        <div className="relative w-full">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-dark" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Поиск..."
            className={`
              w-full pl-9 pr-8 py-2 rounded-lg
              bg-gradient-from/20 hover:bg-gradient-from/30
              text-secondary-light placeholder-secondary-dark
              border border-primary-border
              outline-none text-sm
              transition-all duration-300 ease-in-out
            `}
          />
          {searchValue && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <XMarkIcon className="w-4 h-4 text-secondary-dark hover:text-secondary" />
            </button>
          )}
        </div>

        <AnimatePresence>
          {suggestions.length > 0 && searchValue.trim() && (
            <SearchSuggestions
              suggestions={suggestions}
              onSelect={(suggestion) => {
                router.push(`/search?q=${encodeURIComponent(suggestion)}`);
                handleClear();
                onSearch?.(); // Вызываем колбэк после поиска
              }}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (!isExpanded) {
    return (
      <button
        onClick={handleSearchClick}
        className="group flex flex-col items-center text-[#7D7D7D] hover:text-white 
          transition-colors duration-200"
      >
        <MagnifyingGlassIcon
          className={`w-5 h-5 mb-1 ${isTablet ? "md:w-4 md:h-4" : ""}`}
        />
        <span className={`text-xs ${isTablet ? "hidden lg:inline" : ""}`}>
          Поиск
        </span>
      </button>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center ${className}`}
    >
      <div
        className={`
          absolute right-0 top-1/2 -translate-y-1/2
          transition-all duration-300 ease-in-out
          ${isVisible ? "w-[280px] opacity-100" : "w-0 opacity-0"}
          overflow-visible
        `}
      >
        <div className="relative w-full">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-dark" />
          <input
            ref={inputRef}
            type="text"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Поиск..."
            className={`
              w-full
              ${baseInputStyles}
              ${desktopStyles}
              relative z-[100]
            `}
          />
          {searchValue && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-[100]"
            >
              <XMarkIcon className="w-4 h-4 text-secondary-dark hover:text-secondary" />
            </button>
          )}
        </div>

        <AnimatePresence>
          {suggestions.length > 0 && searchValue.trim() && (
            <div className="relative z-[110]">
              <SearchSuggestions
                suggestions={suggestions}
                onSelect={handleSuggestionSelect}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SearchBar;
