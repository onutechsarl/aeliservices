import React from "react";

export const NotFound = ({
  Icon,
  title = "Aucun élément trouvé",
  message = "Il n'y a aucune donnée à afficher pour le moment.",
  className,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center py-10 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 relative z-2 ${className}`}
    >
      <Icon className="text-gray-300 mb-2" size={32} />
      <h2 className="text-2xl font-bold text-gray-400 mb-2 text-center">
        {title}
      </h2>
      <span className="text-sm text-gray-400 px-2 text-center">{message}</span>
    </div>
  );
};
