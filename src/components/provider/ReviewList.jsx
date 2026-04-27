import React, { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ReviewCard } from '../../ui/ReviewCard';
import { CountItems } from '../global/CountItems';
import { ActionMenu } from '../global/ActionMenu';
import { Loading } from '../global/Loading';
import { NotFound } from '../global/Notfound';
import { MoreHorizontal, Star, AlertCircle } from 'lucide-react';
import { useGetReviewByProvider, useDeleteReview } from '../../hooks/useReview';
import { useInfoUserConnected } from '../../hooks/useUser';
import { toast } from 'react-toastify';

/**
 * UI component responsible for rendering review list.
 */
export function ReviewList({ closeReview, idProvider }) {
    const { openFeedback, openConfirm, setConfirmConfig, closeModal2 } = useOutletContext();
    const scrollRef = useRef(null)
    const [openMenuId, setOpenMenuId] = useState(null)
    const triggerRef = useRef(null)

    const { data: userData } = useInfoUserConnected();
    const user = userData?.data?.user;

    const { data: dataReview, isLoading, isError } = useGetReviewByProvider(idProvider);

    const {
        mutate: mutateDeleteReview,
        isPending: isPendingDelete,
        isSuccess: isSuccessDelete,
        isError: isErrorDelete,
        data: dataDelete,
        error: errorDelete,
        reset: resetDelete
    } = useDeleteReview();

    const reviews = dataReview?.data?.reviews || [];
    const summary = dataReview?.summary;

    useEffect(() => {
        const isSuccess = isSuccessDelete && dataDelete?.success;
        const isError = isErrorDelete;

        if (isSuccess) {
            toast.success(dataDelete.message);
            const timer = setTimeout(() => {
                closeModal2();
            }, 1000);

            return () => clearTimeout(timer);
        }

        if (isErrorDelete) {
            const mainMessage = errorDelete?.response?.message;
            toast.error(mainMessage);

            const backendErrors = errorDelete?.response?.errors;
            if (Array.isArray(backendErrors)) {
                backendErrors.forEach((err) => {
                    toast.info(err.message);
                });
            }
        }

        if (isSuccess || isError) {
            resetDelete();
        }
    }, [isSuccessDelete, isErrorDelete, dataDelete, errorDelete, closeModal2, resetDelete]);

    /**
     * Handles handle delete click behavior.
     */
    const handleDeleteClick = (review) => {
        setOpenMenuId(null);
        setConfirmConfig({
            onConfirm: () => mutateDeleteReview({ id: review.id }),
            isPending: isPendingDelete,
            title: "Supprimer l'avis ?",
            description: "Voulez-vous vraiment supprimer cet avis ? Cette action est irréversible."
        });
        openConfirm();
    };

    if (isLoading) {
        return <Loading className="h-40" size="small" title="Chargement des avis..." />;
    }

    if (isError) {
        return (
            <NotFound
                Icon={AlertCircle}
                title="Erreur de chargement"
                message="Une erreur est survenue lors de la récupération des avis."
                className="bg-gray-100 h-[300px] flex-1"
            />
        );
    }

    return (
        <div className="w-full">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6">
                <Star className="text-[#E8524D]" size={20} />
                Avis clients
            </h2>

            <div
                ref={scrollRef}
                className="flex-1 flex gap-6 overflow-x-auto  h-full pb-5 md:pb-10 no-scrollbar scroll-smooth"
            >
                {reviews.length > 0 ? (
                    reviews.map((review, index) => {
                        const isOwner = user?.id === review.userId;

                        return (
                            <div key={review.id} data-index={index} className="relative flex-shrink-0">
                                <ReviewCard
                                    id={review.id}
                                    name={review.user.firstName}
                                    imageUrl={review.user.profilePhoto}
                                    testimonial={review.comment}
                                    rating={review.rating}
                                    role="Client"
                                    timestamp={new Date(review.createdAt).toLocaleDateString()}
                                    actions={isOwner ? [
                                        <button
                                            key="trigger"
                                            ref={openMenuId === review.id ? triggerRef : null}
                                            onClick={() => setOpenMenuId(openMenuId === review.id ? null : review.id)}
                                            className="p-1 text-gray-400 hover:text-gray-600"
                                        >
                                            <MoreHorizontal size={20} />
                                        </button>,
                                        <ActionMenu
                                            key="menu"
                                            isOpen={openMenuId === review.id}
                                            onClose={() => setOpenMenuId(null)}
                                            triggerRef={triggerRef}
                                            onEdit={() => {
                                                setOpenMenuId(null);
                                                openFeedback(review);
                                            }}
                                            onDelete={() => handleDeleteClick(review)}
                                        />
                                    ] : []}
                                />
                            </div>
                        )
                    })
                ) : (
                    <NotFound
                        Icon={Star}
                        title="Aucun avis trouvé"
                        message="Aucun avis pour le moment."
                        className="bg-gray-100 h-[300px] flex-1"
                    />
                )}
            </div>

            {reviews.length > 0 && (
                <CountItems
                    count={reviews.length}
                    scrollContainerRef={scrollRef}
                    className="flex-row"
                    clasNameChild="w-12 h-[6px]"
                />
            )}
        </div>
    )
}
