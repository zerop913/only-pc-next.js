import { useState, useEffect } from "react";
import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/outline";
import { ListFilter } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";

interface ProductsContextProps {
  totalItems: number;
  currentPage: number;
  totalPages: number;
}

export default function ProductsContext({
  totalItems,
  currentPage,
  totalPages,
}: ProductsContextProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Получаем текущий порядок сортировки из URL
  const currentSort = searchParams.get("sort") || "asc";

  const updateSort = async (newSort: "asc" | "desc") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", newSort);
    // Сбрасываем страницу при изменении сортировки
    params.set("page", "1");
    await router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-lg bg-gradient-from/10 border border-primary-border backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <ListFilter className="w-4 h-4 text-blue-400" />
          <span className="text-white font-medium">
            {totalItems.toLocaleString()} товаров
          </span>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2 text-sm">
            <div className="w-1 h-1 rounded-full bg-secondary-light/50" />
            <span className="text-secondary-light">
              Страница {currentPage} из {totalPages}
            </span>
          </div>
        )}
      </div>

      <div className="relative group">
        <div
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 cursor-pointer text-secondary-light hover:text-white transition-colors duration-200"
        >
          <span className="text-sm">
            Цена: {currentSort === "asc" ? "по возрастанию" : "по убыванию"}
          </span>
          {currentSort === "asc" ? (
            <ArrowUpIcon className="w-4 h-4 text-blue-400" />
          ) : (
            <ArrowDownIcon className="w-4 h-4 text-blue-400" />
          )}
        </div>

        <AnimatePresence>
          {isDropdownOpen && (
            <>
              <motion.div
                className="fixed inset-0 z-30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsDropdownOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-full mt-1 z-40 w-[240px] overflow-hidden rounded-lg border border-primary-border bg-primary"
              >
                <div className="p-1">
                  <button
                    onClick={() => {
                      updateSort("asc");
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm transition-all duration-200
                      ${
                        currentSort === "asc"
                          ? "bg-gradient-from/30 text-white"
                          : "text-secondary-light hover:text-white hover:bg-gradient-from/20"
                      }`}
                  >
                    <ArrowUpIcon className="w-4 h-4 text-blue-400" />
                    <span className="whitespace-nowrap">
                      По возрастанию цены
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      updateSort("desc");
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm transition-all duration-200
                      ${
                        currentSort === "desc"
                          ? "bg-gradient-from/30 text-white"
                          : "text-secondary-light hover:text-white hover:bg-gradient-from/20"
                      }`}
                  >
                    <ArrowDownIcon className="w-4 h-4 text-blue-400" />
                    <span className="whitespace-nowrap">По убыванию цены</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
