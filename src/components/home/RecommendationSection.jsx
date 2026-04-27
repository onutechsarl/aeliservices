import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, BarChart3 } from 'lucide-react'
import { Button } from '../../ui/Button'
import { RecommendationCard } from '../../ui/RecommendationCard';
import { useGetProviderList } from '../../hooks/useProvider';
import { Loading } from '../global/Loading';

/**
 * UI component responsible for rendering recommendation section.
 */
export function RecommendationSection() {
    const navigate = useNavigate()
    const [activeIndex, setActiveIndex] = useState(0)
    const scrollRef = useRef(null)

    const { data: providersResponse, isLoading } = useGetProviderList({
        limit: 50 // On prend une large limite pour filtrer côté client si besoin
    });

    const allProviders = providersResponse?.data?.data?.providers || providersResponse?.data?.providers || [];
    const featuredProviders = allProviders.filter(provider => provider.isFeatured === true);

    useEffect(() => {
        if (featuredProviders.length > 0) {
            const interval = setInterval(() => {
                setActiveIndex((prev) => (prev + 1) % featuredProviders.length)
            }, 5000)
            return () => clearInterval(interval)
        }
    }, [featuredProviders.length])

    useEffect(() => {
        if (scrollRef.current && featuredProviders.length > 0) {
            const container = scrollRef.current
            const activeItem = container.children[activeIndex]

            if (activeItem) {
                const scrollLeft = activeItem.offsetLeft - (container.offsetWidth / 2) + (activeItem.offsetWidth / 2)
                container.scrollTo({
                    left: scrollLeft,
                    behavior: 'smooth'
                })
            }
        }
    }, [activeIndex, featuredProviders.length])

    if (isLoading) return (
        <Loading className="py-10" size="small" title="Chargement des recommandations..." />
    );

    if (featuredProviders.length === 0) return null; // Cache la section s'il n'y a rien à recommander

    return (
        <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight flex items-center gap-2 mb-8">
                <BarChart3 className="text-[#E8524D]" size={32} />
                Recommandations
            </h2>
            <div
                ref={scrollRef}
                className="flex items-center gap-4 overflow-x-auto pb-10 no-scrollbar scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {featuredProviders.map((item, index) => (
                    <RecommendationCard
                        key={item.id}
                        title={item.businessName}

                        image={item.profilePhoto ? item.profilePhoto : `./defaultstructure.jpg`}
                        description={item.description}
                        location={item.location.split(',')[0]} // Ville simplifiée
                        rating={parseFloat(item.averageRating)}
                        isActive={index === activeIndex}
                        actions={[
                            // <Button
                            //     key="btn-consult"
                            //     variant={index === activeIndex ? 'softRed' : 'ghost'}
                            //     size={index === activeIndex ? 'lg' : 'sm'}
                            //     onClick={() => navigate('/consult-provider', { state: { mode: "consultationCustomers", data: item } })}
                            //     className={index === activeIndex ? 'px-8' : 'text-gray-300'}
                            // >
                            //     {index === activeIndex ? 'Consulter catalogue' : 'Voir plus'}
                            //     <ChevronRight size={16} className="ml-2" />
                            // </Button>
                            <Button
                                variant="consultAction"
                                size="none"
                                onClick={() => navigate('/consult-provider', { state: { mode: "consultationCustomers", data: item } })}
                            >
                                <span className="font-semibold text-[14px]">
                                    Consulter
                                </span>
                                <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                            </Button>
                        ]}
                    />
                ))}
            </div>

            { }
            <div className="flex gap-4 justify-center">
                {featuredProviders.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setActiveIndex(index)}
                        className={`h-1.5 rounded-full transition-all duration-500 ${index === activeIndex ? 'w-12 bg-[#E8524D]' : 'w-4 bg-[#E8524D]/20'
                            }`}
                    />
                ))}
            </div>
        </div>
    )
}
