import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ChevronRight, Search } from 'lucide-react';
import { ProviderCard } from '../../ui/ProviderCard';
import { Pagination } from '../global/Pagination';
import { NotFound } from '../global/Notfound';
import { Button } from '../../ui/Button';
import { useAddToFavorites } from '../../hooks/useFavorites';

/**
 * UI component responsible for rendering service search.
 */
export function ServiceSearch({ providers, pagination, onPageChange }) {
    const navigate = useNavigate();
    const { openContact, openSidebar } = useOutletContext();
    const { mutate: addToFavorites, isSuccess: isSuccessAddFavorite, isError: isErrorAddFavorite, data: dataAddFavorite, error: errorAddFavorite } = useAddToFavorites();

    /**
     * Handles handle favorite click behavior.
     */
    const handleFavoriteClick = (providerId) => {
        addToFavorites({ providerId });
    };

    if (!providers || providers.length === 0) {
        return (
            <NotFound
                Icon={Search}
                title="Aucun prestataire trouvé"
                message="Aucun prestataire ne correspond à vos critères de recherche."
                className="bg-gray-100 h-[300px] flex-1"
            />
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ">
                {providers.map((item) => (
                    <ProviderCard
                        key={item.id}
                        id={item.id}
                        name={item.businessName}
                        description={item.description}
                        location={item.location}
                        rating={item.averageRating || 0}
                        image={item.profilePhoto}
                        isActive={item.isActive}
                        activities={item.activities}
                        createdAt={new Date(item.createdAt).toLocaleDateString('fr-FR')}
                        onContact={() => openContact(item)}
                        onFavorite={() => handleFavoriteClick(item.id)}
                        actions={[

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

            {pagination && pagination.totalPages > 1 && (
                <div className="mt-8">
                    <Pagination
                        currentPage={Number(pagination.currentPage)}
                        totalPages={Number(pagination.totalPages)}
                        onPageChange={onPageChange}
                    />
                </div>
            )}
        </>
    );
}
