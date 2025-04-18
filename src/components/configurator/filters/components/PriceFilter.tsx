import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";

interface PriceFilterProps {
  minPrice: number;
  maxPrice: number;
  currentRange: [number, number];
  onRangeChange: (range: [number, number]) => void;
  isExpanded: boolean;
  onToggle: () => void;
  isResetting?: boolean; // Добавляем новый проп
}

export default function PriceFilter({
  minPrice,
  maxPrice,
  currentRange,
  onRangeChange,
  isExpanded,
  onToggle,
  isResetting = false, // Значение по умолчанию
}: PriceFilterProps) {
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");

  // Обработка сброса значений
  useEffect(() => {
    if (isResetting) {
      setMinValue("");
      setMaxValue("");
    }
  }, [isResetting]);

  return (
    <div className="bg-gradient-from/10 rounded-lg p-4 mb-6 border border-primary-border/30 hover:border-primary-border/50 transition-all duration-300">
      <div
        onClick={onToggle}
        className="w-full flex items-center justify-between text-white font-medium text-left group cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <AdjustmentsHorizontalIcon className="w-5 h-5 text-blue-400" />
          <span>Цена</span>
        </span>
        <ChevronDownIcon
          className={`w-5 h-5 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="relative">
                <label className="text-secondary-light text-sm mb-1.5 block">
                  От
                </label>
                <input
                  type="number"
                  min={minPrice}
                  max={currentRange[1]}
                  placeholder={`От ${minPrice.toLocaleString()}`}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (!value) return;
                    onRangeChange([
                      Math.max(minPrice, Math.min(value, currentRange[1])),
                      currentRange[1],
                    ]);
                  }}
                  className="w-full bg-gradient-from/30 border border-primary-border rounded-md p-2 text-white text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-secondary-light/50"
                />
                <span className="absolute right-3 top-[2.4rem] text-secondary-light text-sm">
                  ₽
                </span>
              </div>
              <div className="relative">
                <label className="text-secondary-light text-sm mb-1.5 block">
                  До
                </label>
                <input
                  type="number"
                  min={currentRange[0]}
                  max={maxPrice}
                  placeholder={`До ${maxPrice.toLocaleString()}`}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    if (!value) return;
                    onRangeChange([
                      currentRange[0],
                      Math.min(maxPrice, Math.max(value, currentRange[0])),
                    ]);
                  }}
                  className="w-full bg-gradient-from/30 border border-primary-border rounded-md p-2 text-white text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-secondary-light/50"
                />
                <span className="absolute right-3 top-[2.4rem] text-secondary-light text-sm">
                  ₽
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
