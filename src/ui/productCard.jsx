import React from 'react';
import {
  Clock
} from 'lucide-react';
import { useCheckFavorites } from '../hooks/useFavorites';

export function ProductCard({
  id,
  title,
  name,
  description,
  role,
  image,
  isAdmin,
  createdAt,
  price,
  actions
}) {
  const displayTitle = title || name;
  const displaySub = description || role;

  const { data: checkData } = useCheckFavorites(id);
  const isFavorite = checkData?.data?.isFavorite;

  return (
    <div className="bg-[#f3f3f3] md:p-2.5 rounded-[24px] w-full shadow-sm group">
      <div className="bg-white rounded-[20px] overflow-hidden flex flex-col border border-gray-100 relative">
        <div className="relative w-full aspect-[1.3/1] overflow-hidden">
          <img
            src={image || `./defaultstructure.jpg`}
            alt={displayTitle}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />
          <div className="absolute -bottom-20 -right-20 w-64 h-40 bg-purple-600 rounded-full blur-[100px] opacity-20 z-0"></div>
          {isAdmin && (
            <div className="absolute top-3 right-3 z-20">
              {actions[0]} {actions[1]}
            </div>
          )}
        </div>
        <div className="p-4 flex flex-col gap-3">
          <div className="flex justify-between items-start">
            <div className={`flex flex-col max-w-[100%]`}>
              <h3 className="text-[16px] font-bold text-gray-900 leading-tight truncate">
                {displayTitle}
              </h3>
              <p className={`text-[12px] text-gray-400 font-medium italic`}>
                {displaySub}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 mt-1">
            <div className="flex items-center gap-2 text-gray-400">
              <Clock size={15} className="shrink-0" />
              <span className="text-[12px] font-medium text-gray-500">
                {createdAt} jours restants
              </span>
            </div>
          </div>
          <div className="flex justify-between items-end mt-3 pt-3 border-t border-gray-50">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Start from</span>
              {price ? (<div className="flex items-baseline gap-0.5">
                <span className="text-[17px] font-black text-gray-900">
                  {price || '---'}
                </span>
                <span className="text-[12px] font-bold text-gray-900 ml-0.5">FCFA</span>
              </div>) : (
                <span className="text-[12px] font-bold text-gray-900 ml-0.5 italic">disponible</span>
              )}
            </div>
            <div className="flex-1 flex justify-end">
              {(!isAdmin) && (
                <div className="w-full flex justify-end">
                  {actions[0]}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}