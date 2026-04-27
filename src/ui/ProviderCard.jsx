import React from 'react';
import {
  Star, Calendar, Clock
} from 'lucide-react';
import { useCheckFavorites } from '../hooks/useFavorites';


export function ProviderCard({
  id,
  title,
  name,
  description,
  role,
  image,
  location,
  activities,
  createdAt,
  rating,
  onFavorite = false,
  actions,
  isActive = false,
  favorite,
  className
}) {
  const displayTitle = title || name;
  const displaySub = description || role;

  const { data: checkData } = useCheckFavorites(id);
  const isFavorite = checkData?.data?.isFavorite;

  return (
    <div className={`bg-[#f3f3f3]  md:p-2.5 rounded-[24px] w-full shadow-sm group ${className}`}>
      <div className="bg-white rounded-[20px] overflow-hidden flex flex-row md:flex-col border border-gray-100 relative">
        <div className="relative w-24 h-40 m-2 shrink-0 md:m-0 md:w-full md:h-60 md:aspect-[1.3/1] overflow-hidden rounded-[16px] md:rounded-none">
          <img
            src={image || `./defaultstructure.jpg`}
            alt={displayTitle}
            className="w-full h-full  object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="block md:block absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />
          <div className="absolute -bottom-20 -right-20 w-64 h-30 bg-purple-600 rounded-full blur-[100px] opacity-20 z-0"></div>
          {favorite ? (
            actions[1]
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onFavorite(); }}
              className="absolute top-2 right-2 md:top-3 md:right-3 bg-white/90 backdrop-blur-sm p-1.5 rounded-lg shadow-sm hover:scale-110 transition-transform z-20"
            >
              <Star
                size={16}
                className={`${isFavorite ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}`}
              />
            </button>
          )}
        </div>
        <div className="flex-1 p-3 md:p-4 flex flex-col justify-between md:gap-3 min-w-0">
          <div className="flex justify-between items-start">
            <div className="truncate pr-2">
              <h3 className="text-[15px] md:text-[16px] font-bold text-gray-900 leading-tight truncate">
                {displayTitle}
              </h3>
              <p className="text-[11px] md:text-[12px] text-gray-400 font-medium italic truncate">
                {displaySub}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0 bg-orange-50 md:bg-transparent px-1.5 py-0.5 md:p-0 rounded-full">
              <Star size={13} className="fill-yellow-400 text-yellow-400" />
              <span className="text-[12px] md:text-[13px] font-bold text-gray-700">{rating || '0.0'}/5</span>
            </div>
          </div>
          <div className="flex flex-row flex-wrap md:flex-col gap-x-3 gap-y-1 md:gap-2 mt-1 md:mt-1">
            <div className="mt-1 w-full">
              <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
                {activities && activities.length > 0 ? (
                  <>
                    <div className="flex gap-2 overflow-hidden text-ellipsis">
                      {activities.map((activity, index) => (
                        <span
                          key={index}
                          className="inline-block text-gray-500 text-[10px] md:text-[12px] px-2 py-0.5 rounded-md border border-gray-200 bg-gray-50 flex-shrink-0"
                        >
                          {activity}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <span className="text-gray-500 text-[10px]">Aucune activité</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-gray-400 min-w-0 w-full">
              <svg height="14" width="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
                  <path d="M10.08 2C5.47 2.936 2 7.012 2 11.899C2 17.478 6.522 22 12.101 22c4.887 0 8.963-3.47 9.899-8.08" />
                  <path d="M18.938 18A3.8 3.8 0 0 0 20 17.603m-5.312-.262q.895.39 1.717.58m-5.55-2.973c.413.29.855.638 1.285.938M3 13.826c.322-.157.67-.338 1.063-.493M6.45 13c.562.062 1.192.223 1.906.523M18.5 7a1.5 1.5 0 1 0-3 0a1.5 1.5 0 0 0 3 0" />
                  <path d="M17 2c2.706 0 5 2.218 5 4.91c0 2.733-2.331 4.652-4.485 5.956a1.06 1.06 0 0 1-1.03 0C14.335 11.55 12 9.653 12 6.91C12 4.22 14.294 2 17 2" />
                </g>
              </svg>
              <span className="text-[10px] md:text-[12px] font-medium text-gray-500 truncate flex-1 md:max-w-[180px] lg:max-w-[220px]">
                {location || 'Location non définie'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-400">
              <Clock size={14} className="shrink-0" />
              <span className="text-[10px] md:text-[12px] font-medium text-gray-500 whitespace-nowrap">
                Crée le {createdAt}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center md:items-end mt-2 md:mt-3 pt-2 md:pt-3 border-t border-gray-50">
            <div className="flex flex-col">
              <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase leading-none">Status</span>
              <span className="text-[11px] font-bold text-gray-900 italic">{isActive ? "disponible" : "indisponible"}</span>
            </div>
            <div className="shrink-0 scale-90 md:scale-100 origin-right">
              {actions[0]}
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}