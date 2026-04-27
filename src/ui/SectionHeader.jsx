import React from 'react'

/**
 * UI component responsible for rendering section header.
 */
export function SectionHeader({ icon: Icon, title, variant = 'blue' }) {
    const colors = {
        blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
        purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
        green: { bg: 'bg-green-100', text: 'text-green-600' },
        rose: { bg: 'bg-rose-100', text: 'text-rose-600' },
    }

    const selectedColor = colors[variant] || colors.blue

    return (
        <div className="mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className={`rounded-full p-2 ${selectedColor.bg}`}>
                <Icon className={`h-5 w-5 ${selectedColor.text}`} />
            </div>
            <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        </div>
    )
}