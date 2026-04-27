import React, { useRef, forwardRef } from "react"

/**
 * UI component responsible for rendering button.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isCircle,
  className = '',
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center rounded-xl font-bold transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]'

  const variants = {
    primary: 'bg-[#FCE0D6] text-[#E8524D] hover:bg-[#E8524D] hover:text-white shadow-sm',
    secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50',
    gradient: 'bg-gradient-to-r from-[#E8524D] to-[#FCE0D6] text-white hover:shadow-lg border-none',
    softRed: 'bg-[#E8524D] text-white hover:bg-[#FCE0D6] hover:text-[#E8524D]',
    consultCatalog: 'w-full bg-[#E8524D] text-white px-4 py-3 flex justify-between items-center group/btn',
    consultAction: 'group/btn bg-gradient-to-r from-[#E8524D] to-[#FCE0D6] text-white px-6 py-2.5 rounded-[12px] text-[14px] shadow-lg',
    whatsapp: 'bg-[#22C55E] text-white hover:bg-[#16A34A]',
    phone: 'bg-[#3B82F6] text-white hover:bg-[#2563EB]',
    outline: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 focus:ring-gray-200',
    danger: 'bg-[#DC2626] text-white hover:bg-[#B91C1C] focus:ring-red-500 shadow-sm',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-50 justify-start',
    ghostDanger: 'bg-transparent text-red-600 hover:bg-red-50 justify-start',
    close: 'bg-white text-gray-500 hover:text-black shadow-md border-0',
    tab: 'bg-[#E8524D] text-white shadow-lg hover:scale-110 border-0',
    filterSelected: 'bg-red-50 text-[#E8524D] font-bold',
    filterGhost: 'text-gray-600 hover:bg-gray-50 font-medium',
  }

  const sizes = {
    none: '',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-base',
  }

  return (
    <button className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}

export const CategoryTag = forwardRef(({ cat, isConsult, onSelect, onPressMenu }, ref) => {
  return (
    <button
      onClick={onSelect} // Clique n'importe où sur le bouton pour l'activer
      className={`px-3 py-2.5 rounded-2xl text-sm font-medium transition-all whitespace-nowrap flex items-center border ${cat.active
        ? 'bg-purple-50 text-purple-700 shadow-sm border-purple-100 ring-1 ring-purple-100'
        : 'bg-white text-gray-500 hover:bg-gray-50 border-transparent hover:border-gray-100'
        }`}
    >
      {cat.name}
      {!isConsult && (
        cat.active && (
          <span
            ref={ref}
            onClick={onPressMenu}
            className="ml-2 text-xs px-2 py-[3px] rounded-full hover:bg-purple-200 transition-colors cursor-pointer"
          >
            ⋮
          </span>
        )
      )}
    </button>
  );
});

CategoryTag.displayName = 'CategoryTag';
