import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const getVisiblePages = (currentPage, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages = [1]
  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)

  if (start > 2) pages.push('left-ellipsis')

  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }

  if (end < totalPages - 1) pages.push('right-ellipsis')

  pages.push(totalPages)

  return pages
}
/**
 * UI component responsible for rendering pagination.
 */
export function Pagination({ currentPage = 1, totalPages = 1, onPageChange }) {
  if (totalPages <= 1) return null

  const safeCurrentPage = Math.min(Math.max(1, Number(currentPage) || 1), Number(totalPages) || 1)
  const pages = getVisiblePages(safeCurrentPage, totalPages)

  const handlePageChange = (page) => {
    if (typeof onPageChange !== 'function') return
    if (page === safeCurrentPage) return
    onPageChange(page)
  }

  return (
    <div className="flex items-center justify-center gap-2 py-8">
      <button
        type="button"
        onClick={() => handlePageChange(safeCurrentPage - 1)}
        disabled={safeCurrentPage === 1}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {pages.map((page, index) => {
        if (typeof page !== 'number') {
          return (
            <span key={`${page}-${index}`} className="px-2 text-gray-400">
              ...
            </span>
          )
        }

        const isActive = page === safeCurrentPage

        return (
          <button
            key={page}
            type="button"
            onClick={() => handlePageChange(page)}
            className={`flex h-10 w-10 items-center justify-center rounded-full font-medium transition-colors ${
              isActive
                ? 'bg-[#E8524D]/20 text-[#E8524D]'
                : 'bg-transparent text-gray-500 hover:bg-gray-100'
            }`}
          >
            {page}
          </button>
        )
      })}

      <button
        type="button"
        onClick={() => handlePageChange(safeCurrentPage + 1)}
        disabled={safeCurrentPage === totalPages}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8524D] text-white transition-colors hover:bg-[#FCE0D6] hover:text-[#E8524D] shadow-lg shadow-purple-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  )
}
