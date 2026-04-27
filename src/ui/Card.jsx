import React from 'react'

/**
 * UI component responsible for rendering card.
 */
export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
