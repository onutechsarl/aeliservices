import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { useGetBanners } from '../../hooks/useBanner';

export function Banner() {
    const location = useLocation();
    const { data: apiResponse, isLoading: isLoadingBanner } = useGetBanners();
    const [isVisible, setIsVisible] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    const banners = apiResponse?.data?.banners || [];
    const isSearchPage = location.pathname === '/search';

    useEffect(() => {
        if (banners.length <= 1 || !isVisible) return;
        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) =>
                prevIndex === banners.length - 1 ? 0 : prevIndex + 1
            );
        }, 5000);
        return () => clearInterval(timer);
    }, [banners.length, isVisible]);

    if (!isVisible || isLoadingBanner || banners.length === 0) return null;

    return (
        <div className={`md:fixed md:top-6 md:right-6 md:z-[1002] animate-in fade-in slide-in-from-right duration-700 ${isSearchPage ? "mt-18 md:mt-auto" : ""}`}>
            <div className="relative bg-white shadow-sm md:shadow-2xl border border-gray-200 overflow-hidden w-full md:w-[650px] h-[140px] md:h-[120px] rounded-lg transition-all duration-500">
                <div
                    className="flex h-full w-full transition-transform duration-700 ease-in-out"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {banners.map((banner, index) => (
                        <div key={banner.id || index} className="flex flex-shrink-0 w-full h-full">
                            <div className="flex-1 flex flex-col justify-center px-6 md:px-10 md:z-2 bg-white">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">
                                        Annonce
                                    </span>
                                    {banners.length > 1 && (
                                        <span className="text-[9px] text-gray-400 font-medium">
                                            ({index + 1}/{banners.length})
                                        </span>
                                    )}
                                </div>

                                <h2 className="text-gray-900 font-black text-sm md:text-xl md:text-2xl leading-none uppercase italic">
                                    {banner.title}
                                </h2>
                                <p className="text-gray-500 text-[11px] md:text-xs line-clamp-2 mt-2 max-w-[90%] font-medium">
                                    {banner.description}
                                </p>
                            </div>
                            <div className="relative w-[35%] md:w-[40%] h-full overflow-hidden md:z-20">
                                <img
                                    src={banner.imageUrl}
                                    alt="Visual"
                                    className="w-full h-full object-cover"
                                />
                                {banner.linkUrl && (
                                    <div className="absolute top-1/2 left-4 -translate-x-1/2 -translate-y-1/2 md:z-100">
                                        <button
                                            onClick={() => window.open(banner.linkUrl, '_blank')}
                                            className="w-14 h-14 md:w-16 md:h-16 bg-white border-4 border-gray-50 rounded-full shadow-xl flex items-center justify-center group hover:scale-110 transition-transform active:scale-95"
                                        >
                                            <span className="text-blue-700 font-black text-[10px] md:text-[11px] uppercase tracking-tighter">
                                                Click
                                            </span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute top-2 right-2 z-30 p-1.5 bg-black/5 hover:bg-black/10 text-gray-800 rounded-full transition-colors"
                >
                    <X size={16} />
                </button>
                <div className="absolute top-0 right-0 w-[4px] h-full bg-[#E85D26] z-40" />
                <div className="absolute top-0 left-0 w-[4px] h-full bg-blue-900 z-40" />
            </div>
        </div>
    );
}