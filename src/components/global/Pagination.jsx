import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Pagination avec un affichage réduit (3 éléments visibles aux extrémités)
 */
export function Pagination({ currentPage = 1, totalPages = 1, onPageChange }) {
  const pages = React.useMemo(() => {
    // Si on a peu de pages, on affiche tout sans ellipses
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => ({
        type: "page",
        value: i + 1,
      }));
    }

    const items = [];
    items.push({ type: "page", value: 1 }); // Toujours la page 1

    if (currentPage <= 3) {
      // Bloc de début : [1, 2, 3, ..., totalPages]
      for (let page = 2; page <= 3; page += 1) {
        items.push({ type: "page", value: page });
      }
      items.push({ type: "ellipsis", value: "end" });
    } else if (currentPage >= totalPages - 2) {
      // Bloc de fin : [1, ..., totalPages-2, totalPages-1, totalPages]
      items.push({ type: "ellipsis", value: "start" });
      for (let page = totalPages - 2; page <= totalPages - 1; page += 1) {
        items.push({ type: "page", value: page });
      }
    } else {
      // Bloc du milieu : [1, ..., current-1, current, current+1, ..., totalPages]
      items.push({ type: "ellipsis", value: "start" });
      for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
        items.push({ type: "page", value: page });
      }
      items.push({ type: "ellipsis", value: "end" });
    }

    items.push({ type: "page", value: totalPages }); // Toujours la dernière page

    return items;
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-8">
      <button
        type="button"
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {pages.map((item, index) =>
        item.type === "ellipsis" ? (
          <span
            key={`${item.value}-${index}`}
            className="flex h-10 w-10 items-center justify-center text-gray-400"
          >
            ...
          </span>
        ) : (
          <button
            key={item.value}
            type="button"
            onClick={() => onPageChange(item.value)}
            className={`flex h-10 w-10 items-center justify-center rounded-full font-medium transition-all ${
              currentPage === item.value
                ? "bg-[#E8524D] text-white shadow-lg shadow-red-200"
                : "bg-transparent text-gray-500 hover:bg-gray-100"
            }`}
          >
            {item.value}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8524D] text-white transition-colors hover:bg-[#d44641] shadow-lg shadow-red-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}