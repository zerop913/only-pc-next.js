import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) => {
  const [isChanging, setIsChanging] = useState(false);

  const handlePageClick = async (page: number) => {
    if (isChanging || page === currentPage) return;

    setIsChanging(true);
    await onPageChange(page);
    setIsChanging(false);
  };

  if (totalPages <= 1) return null;

  const pages = [];
  if (totalPages <= 7) {
    // Если страниц мало, показываем все
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Сложная пагинация для большого количества страниц
    if (currentPage <= 4) {
      // Начало
      pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (currentPage >= totalPages - 3) {
      // Конец
      pages.push(
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages
      );
    } else {
      // Середина
      pages.push(
        1,
        "...",
        currentPage - 1,
        currentPage,
        currentPage + 1,
        "...",
        totalPages
      );
    }
  }

  return (
    <nav className="flex justify-center items-center gap-1 sm:gap-2 mt-8">
      {/* Кнопка "Назад" */}
      {currentPage > 1 && (
        <button
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={isChanging}
          className={`flex-shrink-0 flex items-center gap-1 px-2 sm:px-4 py-2 rounded-lg 
            bg-gradient-from/20 text-secondary-light hover:bg-gradient-from/30 hover:text-white 
            transition-all duration-300 border border-primary-border
            ${isChanging ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <ChevronLeftIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Назад</span>
        </button>
      )}

      {/* Страницы */}
      <div className="flex gap-1 sm:gap-2">
        {pages.map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === "number" && handlePageClick(page)}
            disabled={page === "..." || isChanging}
            className={`
              min-w-[32px] sm:min-w-[40px] h-8 sm:h-10 flex items-center justify-center rounded-lg
              ${isChanging ? "opacity-50 cursor-not-allowed" : ""}
              ${
                typeof page === "number"
                  ? currentPage === page
                    ? "bg-gradient-to-br from-[#2A2D3E] to-[#353849] text-white border-primary-border/50"
                    : "bg-gradient-from/20 text-secondary-light hover:bg-gradient-from/30 hover:text-white"
                  : "bg-transparent text-secondary-light cursor-default"
              }
              ${typeof page === "number" ? "border border-primary-border" : ""}
            `}
          >
            {page}
          </button>
        ))}
      </div>

      {/* Кнопка "Вперед" */}
      {currentPage < totalPages && (
        <button
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={isChanging}
          className={`flex-shrink-0 flex items-center gap-1 px-2 sm:px-4 py-2 rounded-lg 
            bg-gradient-from/20 text-secondary-light hover:bg-gradient-from/30 hover:text-white 
            transition-all duration-300 border border-primary-border
            ${isChanging ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <span className="hidden sm:inline">Вперед</span>
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      )}
    </nav>
  );
};

export default Pagination;
