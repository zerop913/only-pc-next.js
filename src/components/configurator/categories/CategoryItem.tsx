"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Category } from "@/types/category";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { ImageIcon } from "lucide-react";

interface CategoryItemProps {
  category: Category;
  isSelected: boolean;
  onClick: () => void;
}

const CategoryItem = ({ category, isSelected, onClick }: CategoryItemProps) => {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center p-4 w-full h-[90px]
        rounded-lg transition-all duration-300
        ${
          isSelected
            ? "bg-gradient-to-b from-blue-500/10 to-blue-600/5 border border-blue-500/30"
            : "bg-gradient-from/30 hover:bg-gradient-from/40 border border-primary-border/50"
        }
      `}
    >
      {!isMobile && (
        <div className="mb-3">
          {category.icon ? (
            <div className="relative w-6 h-6">
              <Image
                src={`/${category.icon}`}
                alt={category.name}
                fill
                className={`transition-opacity duration-300 ${
                  isSelected ? "opacity-100" : "opacity-70"
                }`}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<div class="flex items-center justify-center">
                      <svg class="w-5 h-5 ${
                        isSelected ? "text-blue-400" : "text-secondary-light"
                      }" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>`;
                  }
                }}
              />
            </div>
          ) : (
            <ImageIcon
              className={`w-6 h-6 ${
                isSelected ? "text-blue-400" : "text-secondary-light"
              }`}
            />
          )}
        </div>
      )}

      <span
        className={`text-sm font-medium text-center ${
          isSelected ? "text-white" : "text-secondary-light/90"
        }`}
      >
        {category.name}
      </span>

      {category.children && category.children.length > 0 && (
        <ChevronDownIcon
          className={`
            absolute right-2 bottom-2 w-4 h-4 
            ${isSelected ? "text-blue-400 rotate-180" : "text-secondary-light"}
            transition-transform duration-300
          `}
        />
      )}
    </motion.button>
  );
};

export default CategoryItem;
