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
        className={`
          w-full p-4 rounded-lg border transition-all duration-300
          ${
            selectedCategory
              ? "bg-gradient-to-b from-blue-500/10 to-blue-600/5 border-blue-500/30"
              : "bg-gradient-from/20 border-primary-border hover:bg-gradient-from/30"
          }
          flex items-center justify-between text-white relative overflow-hidden group
        `}
      >
        <span
          className={
            selectedCategory ? "text-white font-medium" : "text-secondary-light"
          }
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
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={toggleDropdown}
            />

            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 w-full mt-2 rounded-lg bg-primary border border-primary-border shadow-lg"
            >
              <div className="py-2 max-h-[60vh] overflow-y-auto">
                {categories.map((category, index) => (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelect(category, index)}
                    className={`
                      w-full px-4 py-3 flex items-center gap-3 text-left transition-all duration-300
                      relative overflow-hidden group
                      ${
                        selectedCategory?.id === category.id
                          ? "bg-gradient-to-b from-blue-500/10 to-blue-600/5 text-white border-l-2 border-l-blue-500/50"
                          : "text-secondary-light hover:bg-gradient-from/20 hover:text-white"
                      }
                    `}
                  >
                    {category.icon && (
                      <img
                        src={`/${category.icon}`}
                        alt=""
                        className={`w-5 h-5 transition-opacity ${
                          selectedCategory?.id === category.id
                            ? "opacity-100"
                            : "opacity-70 group-hover:opacity-100"
                        }`}
                      />
                    )}
                    <span>{category.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
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
          <div className="grid grid-cols-2 gap-2">
            {selectedCategory.children.map((subcategory) => (
              <button
                key={subcategory.id}
                onClick={() => handleSubcategorySelect(subcategory)}
                className={`
                  group relative p-4 rounded-lg text-sm border transition-all duration-300 overflow-hidden
                  ${
                    selectedSubcategory?.id === subcategory.id
                      ? "bg-gradient-to-br from-[#2A2D3E] to-[#353849] border-blue-500/30 text-white"
                      : "bg-gradient-from/20 border-primary-border text-secondary-light hover:text-white hover:bg-gradient-from/30"
                  }
                `}
              >
                {selectedSubcategory?.id === subcategory.id && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-blue-500/50" />
                )}
                <div className="relative z-10">{subcategory.name}</div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-blue-500/0 opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};
