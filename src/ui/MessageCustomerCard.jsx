import React from 'react'
import { Clock, Trash2 } from 'lucide-react'

/**
 * UI component responsible for rendering message card.
 */
export function MessageCard({
    businessName,
    image,
    date,
    time,
    message,
    status,
    displayId,
    actions,
}) {
    return (
        <div className="w-full max-w-xl mx-auto bg-white rounded-xl  shadow-sm p-5 hover:shadow-md transition-shadow duration-200">
            <div className="flex justify-between items-start mb-3">
                <div className="flex gap-4">
                    <img
                        src={image}
                        alt={businessName}
                        className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                    />
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">{businessName}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                <span className="whitespace-nowrap">
                                    {date}, {time}
                                </span>
                            </div>
                            <span className="text-gray-400 whitespace-nowrap"># {displayId}</span>
                        </div>
                    </div>
                </div>

                <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${status === 'pending' ? 'text-yellow-500 bg-yellow-50' : 'text-green-600 bg-green-50'}`}
                >
                    {status === 'pending' ? 'Attente' : 'Contacté'}
                </span>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-3 text-gray-600 text-sm leading-relaxed">
                {message}
            </div>

            {actions && (
                <div className="flex justify-end">
                    {actions}
                </div>
            )}
        </div>
    )
}
