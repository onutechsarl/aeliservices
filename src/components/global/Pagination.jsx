import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * UI component responsible for rendering the pagination section.
 */
export function Pagination({ currentPage = 1, totalPages = 1, onPageChange }) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center gap-2 py-8">
      <button
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
          currentPage === 1
            ? "bg-gray-50 text-gray-300 cursor-not-allowed px-3"
            : "bg-gray-200 text-gray-600 hover:bg-gray-300 px-3"
        }`}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`flex h-10 w-10 items-center justify-center rounded-full font-medium transition-all ${
            currentPage === page
              ? "bg-[#E8524D] text-white shadow-lg shadow-red-200 scale-110 px-3"
              : "bg-transparent text-gray-500 hover:bg-gray-100"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() =>
          currentPage < totalPages && onPageChange(currentPage + 1)
        }
        disabled={currentPage === totalPages}
        className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
          currentPage === totalPages
            ? "bg-gray-50 text-gray-300 cursor-not-allowed px-3"
            : "bg-gray-200 text-gray-600 hover:bg-gray-300 px-3"
        }`}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
