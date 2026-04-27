import React from 'react';


const VARIANT_CLASSES = {
    icon: 'relative p-3 rounded-full bg-[#E8524D] hover:bg-[#E8524D] active:scale-95 transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl cursor-pointer focus:outline-none ring-4 ring-red-300',
    gradient: 'flex items-center gap-2 bg-gradient-to-r from-[#E8524D] to-[#FCE0D6] text-white px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-md shadow-purple-200',
    light: 'bg-white text-black font-semibold py-3 px-8 rounded-xl hover:bg-gray-100 transition-colors relative z-10 shadow-sm',
    plan: 'w-full py-2.5 rounded-xl text-sm font-medium transition-colors',
}

export function Button({
    variant = 'gradient',
    className = '',
    type = 'button',
    recommanded = false,
    ...props
}) {
    let variantClass = VARIANT_CLASSES[variant] || VARIANT_CLASSES.gradient

    let stateClass = ''

    if (variant === 'plan') {
        stateClass = recommanded
            ? 'bg-gradient-to-r from-[#E8524D] to-[#FCE0D6] text-white'
            : 'bg-gray-900 text-white'
    }

    return (
        <button
            type={type}
            className={`${variantClass} ${stateClass} ${className}`.trim()}
            {...props}
        />
    )
}