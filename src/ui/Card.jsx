import React from "react";

/**
 * UI component responsible for rendering the card section.
 */
export const Card = ({
  children,
  className = "",
  variant = "default",
  noPadding = false,
  ...props
}) => {
  const variants = {
    default: "bg-white border border-gray-100 shadow-sm hover:shadow-md",
    defaultnobg: "border border-gray-100 shadow-sm hover:shadow-md",
    glass: "bg-white/80 backdrop-blur-sm border border-slate-200 shadow-sm",
    glass2: "p-2 bg-white/20 rounded-lg backdrop-blur-sm",
    active: "bg-violet-50 border-2 border-violet-500 shadow-md",
    stat: "bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-full",
    green:
      "bg-green-500 rounded-xl p-6 text-white shadow-lg relative overflow-hidden h-full",
  };

  return (
    <div
      className={`rounded-2xl transition-all duration-200 relative overflow-hidden ${variants[variant]} ${noPadding ? "" : "p-5"} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
