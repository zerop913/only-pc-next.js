import { ChevronUpDownIcon } from "@heroicons/react/24/outline";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Option {
  value: string | number;
  label: string;
}

interface SelectProps {
  value: string | number;
  onChange: (value: string | number | undefined) => void;
  options: Option[];
  label?: string;
  placeholder?: string;
}

export default function Select({
  value,
  onChange,
  options,
  label,
  placeholder = "Выберите значение",
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel =
    options.find((opt) => opt.value === value)?.label || placeholder;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative h-full" ref={containerRef}>
      {label && (
        <label className="block text-sm text-secondary-light mb-2">
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-full flex items-center justify-between px-4 py-2 rounded-lg 
                 bg-gradient-from/10 border border-primary-border text-white 
                 hover:bg-gradient-from/30 transition-colors"
      >
        <span className="block truncate">{selectedLabel}</span>
        <ChevronUpDownIcon className="w-5 h-5 text-secondary-light" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-primary border border-primary-border rounded-lg shadow-lg overflow-hidden"
          >
            <div className="py-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full text-left px-4 py-2 text-sm 
                    hover:bg-gradient-from/30 transition-colors
                    ${
                      value === option.value
                        ? "text-white bg-gradient-from/40"
                        : "text-secondary-light hover:text-white"
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
