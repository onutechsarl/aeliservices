import React from 'react';


export function FeatureCard({ icon: Icon, title, description, className = '' }) {
    return (
        <div
            className={`bg-white rounded-2xl shadow-sm shadow-gray-200/60 p-5 md:p-6 flex items-start gap-4 border border-gray-100 ${className}`}
        >
            <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
                <Icon className="w-6 h-6 md:w-7 md:h-7 text-purple-600" />
            </div>
            <div className="min-w-0">
                <h3 className="text-sm md:text-base font-bold text-gray-900 mb-1">{title}</h3>
                <p className="text-xs md:text-sm text-gray-500 leading-relaxed">{description}</p>
            </div>
        </div>
    )
}
