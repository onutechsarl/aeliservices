import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Composant de Pagination utilisant la logique de calcul "par blocs"
 */
export function Pagination({ currentPage = 1, totalPages = 1, onPageChange }) {
  // On utilise la logique exacte de ta première version pour calculer les items
  const pages = React.useMemo(() => {
    if (totalPages <= 2) {
      return Array.from({ length: totalPages }, (_, i) => ({
        type: "page",
        value: i + 1,
      }));
    }

    const items = [];
    // Toujours la première page
    items.push({ type: "page", value: 1 });

    if (currentPage <= 4) {
      // Bloc de début
      for (let page = 2; page <= 4; page += 1) {
        items.push({ type: "page", value: page });
      }
      items.push({ type: "ellipsis", value: "end" });
    } else if (currentPage >= totalPages - 3) {
      // Bloc de fin
      items.push({ type: "ellipsis", value: "start" });
      for (let page = totalPages - 3; page <= totalPages - 1; page += 1) {
        items.push({ type: "page", value: page });
      }
    } else {
      // Bloc du milieu (autour de la page courante)
      items.push({ type: "ellipsis", value: "start" });
      for (let page = currentPage - 1; page <= currentPage + 1; page += 1) {
        items.push({ type: "page", value: page });
      }
      items.push({ type: "ellipsis", value: "end" });
    }

    // Toujours la dernière page
    items.push({ type: "page", value: totalPages });

    return items;
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-8">
      {/* Bouton Précédent */}
      <button
        type="button"
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* Rendu des items calculés */}
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
                ? "bg-[#E8524D] text-white shadow-lg shadow-red-200 scale-105"
                : "bg-transparent text-gray-500 hover:bg-gray-100"
            }`}
          >
            {item.value}
          </button>
        )
      )}

      {/* Bouton Suivant */}
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