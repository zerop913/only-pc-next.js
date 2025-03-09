import { useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

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
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePageChange = (page: number) => {
    onPageChange(page);
    scrollToTop();
  };

  const getVisiblePages = () => {
    const isMobile = window.innerWidth < 640;
    const delta = isMobile ? 1 : 2;
    const range = [];
    const rangeWithDots = [];

    range.push(1);

    for (let i = currentPage - delta; i <= currentPage + delta; i++) {
      if (i > 1 && i < totalPages) {
        range.push(i);
      }
    }

    if (totalPages > 1) {
      range.push(totalPages);
    }

    let prev = 0;
    for (const i of range) {
      if (prev) {
        if (i - prev === 2) {
          rangeWithDots.push(prev + 1);
        } else if (i - prev !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      prev = i;
    }

    return rangeWithDots;
  };

  if (totalPages <= 1) return null;

  return (
    <nav className="flex justify-center items-center gap-1 sm:gap-2 mt-8 px-2 max-w-full overflow-x-auto">
      {currentPage > 1 && (
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          className="flex-shrink-0 flex items-center gap-1 px-2 sm:px-4 py-2 rounded-lg bg-gradient-from/20 text-secondary-light hover:bg-gradient-from/30 hover:text-white transition-all duration-300 border border-primary-border"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Назад</span>
        </button>
      )}

      <div className="flex gap-1 sm:gap-2">
        {getVisiblePages().map((page, index) => (
          <button
            key={index}
            onClick={() =>
              typeof page === "number" ? handlePageChange(page) : null
            }
            disabled={page === "..."}
            className={`
              min-w-[32px] sm:min-w-[40px] h-8 sm:h-10 flex items-center justify-center rounded-lg transition-all duration-300 text-sm sm:text-base
              ${
                typeof page === "number"
                  ? currentPage === page
                    ? "bg-gradient-to-br from-[#2A2D3E] to-[#353849] text-white border-primary-border/50"
                    : "bg-gradient-from/20 text-secondary-light hover:bg-gradient-from/30 hover:text-white"
                  : "bg-transparent text-secondary-light cursor-default px-1"
              }
              ${typeof page === "number" ? "border border-primary-border" : ""}
            `}
          >
            {page}
          </button>
        ))}
      </div>

      {currentPage < totalPages && (
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          className="flex-shrink-0 flex items-center gap-1 px-2 sm:px-4 py-2 rounded-lg bg-gradient-from/20 text-secondary-light hover:bg-gradient-from/30 hover:text-white transition-all duration-300 border border-primary-border"
        >
          <span className="hidden sm:inline">Вперед</span>
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      )}
    </nav>
  );
};

export default Pagination;
