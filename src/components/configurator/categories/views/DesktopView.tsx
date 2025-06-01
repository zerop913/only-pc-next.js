import { motion } from "framer-motion";
import CategoryItem from "../CategoryItem";
import { DesktopViewProps } from "../types/categories";

export const DesktopView: React.FC<DesktopViewProps> = ({
  categories,
  state,
  actions,
}) => {
  const { selectedCategory, selectedSubcategory } = state;
  const { handleCategorySelect, handleSubcategorySelect } = actions;

  return (
    <div>
      <div className="flex justify-between gap-4">
        {categories.map((category, index) => (
          <CategoryItem
            key={category.id}
            category={category}
            isSelected={selectedCategory?.id === category.id}
            onClick={() => handleCategorySelect(category, index)}
          />
        ))}
      </div>

      {selectedCategory &&
        selectedCategory.children &&
        selectedCategory.children.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6"
          >
            <div className="bg-gradient-from/10 rounded-xl border border-primary-border/30">
              {/* Заголовок */}
              <div className="p-4 border-b border-primary-border/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-medium text-white">
                    {selectedCategory.name}
                  </h3>
                  <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20">
                    {selectedCategory.children?.length} подкатегори
                    {selectedCategory.children?.length === 1 ? "я" : "и"}
                  </span>
                </div>
              </div>

              {/* Сетка подкатегорий */}
              <div className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {selectedCategory.children?.map((subcategory, index) => (
                    <motion.button
                      key={subcategory.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      onClick={() => handleSubcategorySelect(subcategory)}
                      className={`
                      group relative p-4 rounded-lg border transition-all duration-300
                      ${
                        selectedSubcategory?.id === subcategory.id
                          ? "bg-gradient-to-br from-[#2A2D3E]/80 to-[#353849]/80 border-blue-500/50 hover:border-blue-500"
                          : "bg-gradient-from/20 border-primary-border/30 hover:border-primary-border/50 hover:bg-gradient-from/30"
                      }
                    `}
                    >
                      <div
                        className={`
                        absolute top-0 left-0 right-0 h-1 rounded-t-lg transition-opacity duration-300
                        ${
                          selectedSubcategory?.id === subcategory.id
                            ? "bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-blue-500/50"
                            : "bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-blue-500/0 group-hover:from-blue-500/20 group-hover:via-purple-500/20 group-hover:to-blue-500/20"
                        }
                      `}
                      />

                      {/* Иконка категории (если есть) */}
                      {subcategory.icon && (
                        <div
                          className={`
                          w-8 h-8 mb-3 p-1.5 rounded-lg transition-colors duration-300
                          ${
                            selectedSubcategory?.id === subcategory.id
                              ? "bg-blue-500/10"
                              : "bg-gradient-from/30 group-hover:bg-gradient-from/50"
                          }
                        `}
                        >
                          <img
                            src={subcategory.icon}
                            alt=""
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}

                      {/* Название и количество товаров */}
                      <div className="text-left">
                        <h4
                          className={`
                          font-medium transition-colors duration-300 mb-1
                          ${
                            selectedSubcategory?.id === subcategory.id
                              ? "text-white"
                              : "text-secondary-light group-hover:text-white"
                          }
                        `}
                        >
                          {subcategory.name}
                        </h4>
                        <p
                          className={`
                          text-xs transition-colors duration-300
                          ${
                            selectedSubcategory?.id === subcategory.id
                              ? "text-blue-400/80"
                              : "text-secondary-light/70 group-hover:text-secondary-light"
                          }
                        `}
                        >
                          Выбрать категорию
                        </p>
                      </div>

                      {/* Декоративный эффект при наведении */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-blue-500/0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-lg" />
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
    </div>
  );
};
