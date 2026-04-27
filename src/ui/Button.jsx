import React from "react";

const variants = {
  primary: "bg-gray-900 text-white hover:bg-gray-800 shadow-sm",
  secondary:
    "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm",
  outline:
    "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 focus:ring-gray-200",
  danger:
    "bg-[#DC2626] text-white hover:bg-[#B91C1C] focus:ring-red-500 shadow-sm",
  softRed:
    "bg-[#E8524D] text-white hover:bg-[#FCE0D6] hover:text-[#E8524D]",
  ghost:
    "bg-transparent text-gray-700 hover:bg-gray-50 justify-start",
  ghostDanger:
    "bg-transparent text-red-600 hover:bg-red-50 justify-start",
  recovery:
    "p-2 bg-green-500/20 hover:bg-green-500/30 rounded-full transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
  icon: "p-2",
};

export const Button = ({
  children,
  variant,
  size = "md",
  className = "",
  icon: Icon,
  ...props
}) => {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2
        font-medium rounded-xl transition-all duration-200
        active:scale-95 disabled:opacity-50 disabled:pointer-events-none
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

/**
 * UI component responsible for rendering the button tab section.
 */
export const ButtonTab = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-[12px] md:text-sm font-medium rounded-xl transition-all whitespace-nowrap ${isActive
      ? "bg-white text-[#E8524D] shadow-sm"
      : "text-gray-600 hover:text-gray-800"
      }`}
  >
    {label}
  </button>
);
