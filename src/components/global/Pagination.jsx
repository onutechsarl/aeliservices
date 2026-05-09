import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * UI component responsible for rendering the pagination section.
 */
export function Pagination({ currentPage = 1, totalPages = 1, onPageChange }) {
  const pages = React.useMemo(() => {
    if (totalPages <= 6) {
      return Array.from({ length: totalPages }, (_, i) => ({
        type: "page",
        value: i + 1,
      }));
    }

    const items = [];

    items.push({ type: "page", value: 1 });

    if (currentPage <= 4) {
      for (let page = 2; page <= 4; page += 1) {
        items.push({ type: "page", value: page });
      }
      items.push({ type: "ellipsis", value: "end" });
    } else if (currentPage >= totalPages - 3) {
      items.push({ type: "ellipsis", value: "start" });
      for (let page = totalPages - 3; page <= totalPages - 1; page += 1) {
        items.push({ type: "page", value: page });
      }
    } else {
      items.push({ type: "ellipsis", value: "start" });
      for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
        items.push({ type: "page", value: page });
      }
      items.push({ type: "ellipsis", value: "end" });
    }

    items.push({ type: "page", value: totalPages });

    return items;
  }, [currentPage, totalPages]);

  return (
    <div className="flex items-center justify-center gap-2 py-8">
      <button
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${currentPage === 1
          ? "bg-gray-50 text-gray-300 cursor-not-allowed px-3"
          : "bg-gray-200 text-gray-600 hover:bg-gray-300 px-3"
          }`}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {pages.map((item, index) =>
        item.type === "ellipsis" ? (
          <span
            key={`${item.value}-${index}`}
            className="flex h-10 w-10 items-center justify-center text-gray-500"
          >
            ...
          </span>
        ) : (
          <button
            key={item.value}
            onClick={() => onPageChange(item.value)}
            className={`flex h-10 w-10 items-center justify-center rounded-full font-medium transition-all ${currentPage === item.value
              ? "bg-[#E8524D] text-white shadow-lg shadow-red-200 scale-110 px-3"
              : "bg-transparent text-gray-500 hover:bg-gray-100"
              }`}
          >
            {item.value}
          </button>
        )
      )}

      <button
        onClick={() =>
          currentPage < totalPages && onPageChange(currentPage + 1)
        }
        disabled={currentPage === totalPages}
        className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${currentPage === totalPages
          ? "bg-gray-50 text-gray-300 cursor-not-allowed px-3"
          : "bg-gray-200 text-gray-600 hover:bg-gray-300 px-3"
          }`}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}

