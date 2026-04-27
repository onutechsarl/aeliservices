import React from 'react'
import { Heart, MapPin, Star } from 'lucide-react'
import { Button } from './Button' // Ajuste le chemin selon ton architecture

/**
 * UI component responsible for rendering favorite card.
 */
export function FavoriteCard({
    name,
    image,
    rating,
    reviewCount,
    description,
    location,
    dateAdded,
    actions
}) {
    return (
        <div className="w-full max-w-sm mx-auto group flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className="relative h-48 sm:h-56 w-full overflow-hidden">
                <img
                    src={image}
                    alt={name}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/20 to-transparent" />
                <div className="absolute -bottom-20 -right-20 w-64 h-40 bg-purple-600 rounded-full blur-[100px] opacity-30 z-0"></div>
                {actions && (
                    actions[0]
                )}
            </div>
            <div className="flex flex-col flex-1 p-5">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{name}</h3>
                    <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-bold text-gray-900">{rating}</span>
                        <span className="text-sm text-gray-500">({reviewCount})</span>
                    </div>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-1">
                    {description}
                </p>

                <div className="flex items-center gap-2 text-gray-500 mb-6">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="text-sm">{location}</span>
                </div>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                    <span className="text-xs text-gray-400">Ajouté le {dateAdded}</span>

                    {actions && (
                        actions[1]
                    )}
                </div>
            </div>
        </div>
    )
}