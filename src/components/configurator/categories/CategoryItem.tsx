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
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer relative
        w-full h-[80px]
        ${
          isSelected
            ? "bg-gradient-to-br from-[#2A2D3E] to-[#353849] ring-2 ring-[#4A4D5E]"
            : "bg-gradient-to-br from-[#1D1E2C] to-[#252736] hover:from-[#22243A] hover:to-[#2A2C44]"
        }
      `}
    >
      {!isMobile && (
        <div className="w-8 h-8 mb-2 relative">
          {category.icon ? (
            <>
              <Image
                src={`/${category.icon}`}
                alt={category.name}
                width={32}
                height={32}
                className={`transition-colors duration-300 ${
                  isSelected ? "opacity-100" : "opacity-70"
                }`}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent) {
                    parent.classList.add("fallback-icon-visible");
                  }
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-70 fallback-icon hidden">
                <ImageIcon
                  className={`w-8 h-8 ${
                    isSelected ? "text-white" : "text-secondary-light"
                  }`}
                />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center opacity-70">
              <ImageIcon
                className={`w-8 h-8 ${
                  isSelected ? "text-white" : "text-secondary-light"
                }`}
              />
            </div>
          )}
        </div>
      )}

      <span
        className={`
        text-xs font-medium text-center transition-colors duration-300 line-clamp-1
        ${isSelected ? "text-white" : "text-secondary-light"}
      `}
      >
        {category.name}
      </span>

      {category.children && category.children.length > 0 && (
        <ChevronDownIcon
          className={`
          w-4 h-4 absolute right-1 bottom-1 transition-all duration-300
          ${isSelected ? "text-white" : "text-secondary-dark"}
          ${isSelected ? "rotate-180" : "rotate-0"}
        `}
        />
      )}
    </motion.div>
  );
};

export default CategoryItem;
