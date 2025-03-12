import { motion, AnimatePresence } from "framer-motion";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { MobileViewProps } from "../types/categories";

export const MobileView: React.FC<MobileViewProps> = ({
  categories,
  state,
  actions,
}) => {
  const { selectedCategory, selectedSubcategory, isDropdownOpen } = state;
  const { handleCategorySelect, handleSubcategorySelect, toggleDropdown } =
    actions;

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="w-full p-4 rounded-lg bg-gradient-to-br from-[#1D1E2C] to-[#252736] flex items-center justify-between text-white"
      >
        <span
          className={selectedCategory ? "text-white" : "text-secondary-light"}
        >
          {selectedCategory ? selectedCategory.name : "Выберите категорию"}
        </span>
        <ChevronDownIcon
          className={`w-5 h-5 transition-transform duration-300 ${
            isDropdownOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 w-full mt-2 rounded-lg bg-primary border border-primary-border shadow-lg"
          >
            <div className="py-2">
              {categories.map((category, index) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category, index)}
                  className={`w-full px-4 py-3 flex items-center hover:bg-gradient-from/20 text-left ${
                    selectedCategory?.id === category.id
                      ? "text-white"
                      : "text-secondary-light hover:text-white"
                  }`}
                >
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {selectedCategory && selectedCategory.children.length > 0 && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-4"
        >
          <div className="grid gap-2">
            {selectedCategory.children.map((subcategory) => (
              <button
                key={subcategory.id}
                onClick={() => handleSubcategorySelect(subcategory)}
                className={`
                  w-full px-4 py-3 rounded-lg text-sm bg-gradient-from/20 border border-primary-border
                  ${
                    selectedSubcategory?.id === subcategory.id
                      ? "text-white bg-gradient-to-br from-[#2A2D3E] to-[#353849]"
                      : "text-secondary-light"
                  }
                `}
              >
                {subcategory.name}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};
