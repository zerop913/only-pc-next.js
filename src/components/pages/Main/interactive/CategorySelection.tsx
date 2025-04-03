import { useEffect } from "react";
import { motion, useAnimation } from "framer-motion";
import {
  CheckCircleIcon,
  CpuChipIcon,
  CircleStackIcon,
} from "@heroicons/react/24/outline";
import { ServerIcon, MemoryStick } from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface CategorySelectionProps {
  categories: Category[];
  onCategorySelect: (categoryId: string) => void;
  selectedProducts: Record<string, string>;
  isInView: boolean;
  demoMode?: boolean;
  highlightedCategory?: string | null;
}

// Компонент для отображения иконки категории
const CategoryIcon = ({ icon }: { icon: string }) => {
  switch (icon) {
    case "cpu":
      return <CpuChipIcon className="w-5 h-5 text-blue-400" />;
    case "motherboard":
      return <ServerIcon className="w-5 h-5 text-purple-400" />;
    case "gpu":
      return <CircleStackIcon className="w-5 h-5 text-emerald-400" />;
    case "ram":
      return <MemoryStick className="w-5 h-5 text-yellow-400" />;
    default:
      return <div className="w-5 h-5 text-blue-400">•</div>;
  }
};

const CategorySelection = ({
  categories,
  onCategorySelect,
  selectedProducts,
  isInView,
  demoMode = false,
  highlightedCategory = null,
}: CategorySelectionProps) => {
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("show");
    } else {
      controls.stop();
    }
  }, [controls, isInView]);

  const containerAnimation = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15, // Увеличена задержка между элементами
      },
    },
  };

  const itemAnimation = {
    hidden: { opacity: 0, y: 15 }, // Увеличена начальная позиция
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5, // Увеличена продолжительность
        ease: "easeOut", // Более плавный переход
      },
    },
  };

  return (
    <motion.div
      variants={containerAnimation}
      initial="hidden"
      animate={controls}
      exit={{
        opacity: 0,
        y: -10,
        transition: { duration: 0.4, ease: "easeInOut" },
      }}
      className="grid grid-cols-2 gap-3 h-full"
    >
      {categories.map((category) => {
        const isSelected = category.id in selectedProducts;
        const isHighlighted = highlightedCategory === category.id;

        // Определяем стили в зависимости от категории - более мягкие тени и свечения
        const getCategoryTheme = () => {
          switch (category.id) {
            case "cpu":
              return {
                selected: "bg-blue-500/15 border-blue-500/30",
                icon: "bg-blue-500/20",
                text: "text-blue-300",
                highlight:
                  "ring-1 ring-blue-400/50 ring-offset-1 ring-offset-primary-dark/80",
              };
            case "motherboard":
              return {
                selected: "bg-purple-500/15 border-purple-500/30",
                icon: "bg-purple-500/20",
                text: "text-purple-300",
                highlight:
                  "ring-1 ring-purple-400/50 ring-offset-1 ring-offset-primary-dark/80",
              };
            case "gpu":
              return {
                selected: "bg-emerald-500/15 border-emerald-500/30",
                icon: "bg-emerald-500/20",
                text: "text-emerald-300",
                highlight:
                  "ring-1 ring-emerald-400/50 ring-offset-1 ring-offset-primary-dark/80",
              };
            case "ram":
              return {
                selected: "bg-yellow-500/15 border-yellow-500/30",
                icon: "bg-yellow-500/20",
                text: "text-yellow-300",
                highlight:
                  "ring-1 ring-yellow-400/50 ring-offset-1 ring-offset-primary-dark/80",
              };
            default:
              return {
                selected: "bg-blue-500/15 border-blue-500/30",
                icon: "bg-blue-500/20",
                text: "text-blue-300",
                highlight:
                  "ring-1 ring-blue-400/50 ring-offset-1 ring-offset-primary-dark/80",
              };
          }
        };

        const theme = getCategoryTheme();

        return (
          <motion.button
            key={category.id}
            variants={itemAnimation}
            whileHover={{ scale: demoMode ? 1 : 1.02 }} // Уменьшено масштабирование
            whileTap={{ scale: demoMode ? 1 : 0.99 }} // Увеличено масштабирование
            animate={
              isHighlighted
                ? {
                    scale: [1, 1.03, 1, 1.03, 1], // Уменьшена амплитуда
                    transition: {
                      duration: 2, // Увеличена длительность
                      repeat: 1,
                      ease: "easeInOut", // Более плавный переход
                    },
                  }
                : {}
            }
            className={`relative p-4 rounded-lg border text-left transition-all duration-300
              ${
                isSelected
                  ? theme.selected + " text-white"
                  : "bg-gradient-from/10 border-primary-border/80 hover:bg-gradient-from/15 text-secondary-light hover:text-white"
              }
              ${isHighlighted ? theme.highlight : ""}
            `}
            onClick={() => !demoMode && onCategorySelect(category.id)}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-lg ${
                  isSelected ? theme.icon : "bg-gradient-from/20"
                } flex items-center justify-center border border-primary-border/70`}
              >
                <motion.div
                  animate={
                    isInView
                      ? {
                          scale: [1, 1.08, 1], // Уменьшена амплитуда
                          rotate:
                            isSelected || isHighlighted
                              ? [0, 3, 0, -3, 0] // Уменьшена амплитуда
                              : [0, 0, 0],
                        }
                      : {}
                  }
                  transition={{
                    duration: 4, // Увеличена длительность
                    repeat: Infinity,
                    ease: "easeInOut", // Более плавный переход
                  }}
                >
                  <CategoryIcon icon={category.icon} />
                </motion.div>
              </div>
              <div>
                <div className="font-medium">{category.name}</div>
                {isSelected && (
                  <div className={`text-xs mt-1 ${theme.text}`}>
                    Компонент выбран
                  </div>
                )}
              </div>
            </div>

            {isSelected && (
              <div className="absolute top-2 right-2">
                <motion.div
                  animate={{ rotate: [0, 10, 0, -10, 0] }} // Уменьшена амплитуда
                  transition={{
                    duration: 3, // Увеличена длительность
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut", // Более плавный переход
                  }}
                >
                  <CheckCircleIcon className={`w-5 h-5 ${theme.text}`} />
                </motion.div>
              </div>
            )}
          </motion.button>
        );
      })}
    </motion.div>
  );
};

export default CategorySelection;
