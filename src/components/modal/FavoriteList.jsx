import React, { useEffect, useRef } from 'react';
import { toast } from "react-toastify";
import { useNavigate } from 'react-router-dom';
import { ProviderCard } from '../../ui/ProviderCard';
import { Star, Loader2, AlertCircle, ChevronRight } from 'lucide-react';
import { ModalCard } from '../../ui/ModalCard';
import { FavoriteCard } from '../../ui/FavoriteCard';
import { CountItems } from '../global/CountItems';
import { Loading } from '../global/Loading';
import { NotFound } from '../global/Notfound';
import { Button } from '../../ui/Button';
import { useGetFavorites, useDeleteFavorites } from '../../hooks/useFavorites';

/**
 * UI component responsible for rendering favorite list.
 */
export function FavoriteList({ closeFavorite }) {
    const scrollRef = useRef(null);
    const navigate = useNavigate();

    const { data: dataFavorite, isLoading, isError } = useGetFavorites();
    const { mutate: deleteFavorite, isPending: isPendinDeleteFavorite, isSuccess: isSuccessDeleteFavorite, isError: isErrorDeleteFavorite, data: dataDeleteFavorite, error: errorDeleteFavorite } = useDeleteFavorites();
    const favorites = dataFavorite?.data?.favorites || [];

    /**
     * Handles handle remove favorite behavior.
     */
    const handleRemoveFavorite = (providerId) => {
        deleteFavorite({ id: providerId });
    };

    useEffect(() => {
        if (isSuccessDeleteFavorite && dataDeleteFavorite?.success) {
            toast.success(dataDeleteFavorite.message);
        }

        if (isErrorDeleteFavorite) {
            const mainMessage = errorDeleteFavorite?.message;
            toast.error(mainMessage);

            const backendErrors = errorDeleteFavorite?.response?.errors;
            if (Array.isArray(backendErrors)) {
                backendErrors.forEach((err) => {
                    toast.info(err.message);
                });
            }
        }
    }, [isSuccessDeleteFavorite, isErrorDeleteFavorite, dataDeleteFavorite, errorDeleteFavorite]);

    return (
        <ModalCard
            title={
                <div className="flex items-center gap-2">
                    <Star className="text-yellow-500" size={20} />
                    Favoris
                </div>
            }
            closeModal={closeFavorite}
        >
            {isLoading ? (
                <Loading className="h-64" size="small" title="Chargement de vos favoris..." />
            ) : isError ? (
                <NotFound
                    Icon={AlertCircle}
                    title="Erreur de chargement"
                    message="Une erreur est survenue lors de la récupération de vos favoris."
                    className="bg-none h-[300px] border-none"
                />
            ) : (
                <>
                    <CountItems count={favorites.length} scrollContainerRef={scrollRef} />

                    <div
                        ref={scrollRef}
                        className="flex flex-col gap-4 overflow-y-auto h-full min-h-0 flex-1 pb-25 md:pb-10 custom-scrollbar no-scrollbar "
                    >
                        {favorites.length > 0 ? (
                            favorites.map((fav, index) => {

                                const provider = fav.provider;

                                return (
                                    <div key={fav.id} data-index={index} className="flex-shrink-0">
                                        <ProviderCard
                                            key={provider.id}
                                            id={provider.id}
                                            name={provider.businessName}
                                            description={provider.description}
                                            location={provider.location}
                                            rating={provider.averageRating}
                                            image={provider.profilePhoto}
                                            activities={provider.activities}
                                            isActive={provider.isActive}
                                            createdAt={new Date(provider.createdAt).toLocaleDateString('fr-FR')}
                                            onFavorite={() => handleFavoriteClick(provider.id)}
                                            className="w-full md:w-[350px]"
                                            favorite={true}
                                            actions={[
                                                <Button
                                                    variant="consultAction"
                                                    size="none"
                                                    onClick={() => {
                                                        closeFavorite();
                                                        navigate('/consult-provider', {
                                                            state: { mode: "consultationCustomers", data: provider }
                                                        });
                                                    }}
                                                >
                                                    <span className="font-semibold text-[14px]">
                                                        Consulter
                                                    </span>
                                                    <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                                </Button>,
                                                <button
                                                    key="heart-btn"
                                                    onClick={() => handleRemoveFavorite(provider.id)}
                                                    disabled={isPendinDeleteFavorite}
                                                    className="absolute top-2 right-2 md:top-3 md:right-3 bg-white/90 backdrop-blur-sm p-1.5 rounded-lg shadow-sm hover:scale-110 transition-transform z-20"
                                                    aria-label="Remove from favorites "
                                                >
                                                    <Star className="w-4 h-4 text-yellow-500 fill-current hover:scale-110 transition-transform" />
                                                </button>
                                            ]}
                                        />
                                    </div>
                                );
                            })
                        ) : (
                            <NotFound
                                Icon={Star}
                                title="Aucun favorie trouvé"
                                message="  Vous n'avez pas encore de favoris."
                                className="bg-none h-[300px] border-none"
                            />
                        )}
                    </div>
                </>
            )}
        </ModalCard>
    );
}
