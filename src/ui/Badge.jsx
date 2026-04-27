import React from 'react'

/**
 * UI component responsible for rendering badge.
 */
export function Badge({
  children,
  variant = 'neutral',
  className = '',
}) {
  const variants = {
    success: 'bg-green-100 text-green-700 border border-green-200',
    warning: 'bg-amber-100 text-amber-700 border border-amber-200',
    neutral: 'bg-gray-100 text-gray-700 border border-gray-200',
    purple: 'bg-purple-100 text-purple-700 border border-purple-200',
    danger: 'bg-red-100 text-red-700 border border-red-200'
  }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
