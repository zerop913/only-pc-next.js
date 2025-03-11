import { motion, AnimatePresence } from "framer-motion";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { Filter } from "../types/filters";
import FilterOption from "./FilterOption";

interface FilterGroupProps {
  filter: Filter;
  isExpanded: boolean;
  selectedCount: number;
  onToggle: () => void;
  onOptionChange: (value: string) => void;
  selectedValues: Set<string>;
}

export default function FilterGroup({
  filter,
  isExpanded,
  selectedCount,
  onToggle,
  onOptionChange,
  selectedValues,
}: FilterGroupProps) {
  return (
    <div className="bg-gradient-from/10 rounded-lg p-4 border border-primary-border/30 hover:border-primary-border/50 transition-all duration-300">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between text-white font-medium text-left group"
      >
        <span className="flex items-center gap-2">
          <span>{filter.name}</span>
          {selectedCount > 0 && (
            <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {selectedCount}
            </span>
          )}
        </span>
        <ChevronDownIcon
          className={`w-5 h-5 transition-transform flex-shrink-0 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-2.5 pl-1 mt-3">
              {filter.options.map((option) => (
                <FilterOption
                  key={option.value}
                  option={option}
                  isSelected={selectedValues.has(option.value)}
                  onChange={() => onOptionChange(option.value)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
