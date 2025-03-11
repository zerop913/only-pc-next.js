import { motion } from "framer-motion";
import {
  ArrowUpIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { Category } from "@/types/category";

interface SubcategoryWelcomeProps {
  category: Category;
}

export default function SubcategoryWelcome({
  category,
}: SubcategoryWelcomeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6"
    >
      <div className="p-6 bg-gradient-from/10 rounded-xl border border-primary-border/30">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <InformationCircleIcon className="w-6 h-6 text-blue-400" />
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-white">
                Доступные подкатегории {category.name}
              </h3>
              <p className="mt-2 text-secondary-light">
                Для более точного подбора компонентов выберите нужную
                подкатегорию из списка выше.
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-secondary-light/80">
              <ArrowUpIcon className="w-4 h-4 text-blue-400 animate-bounce" />
              <span>
                {category.children?.length}{" "}
                {category.children?.length === 1
                  ? "подкатегория доступна"
                  : "подкатегории доступны"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
