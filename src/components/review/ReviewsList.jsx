import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Flag,
  ArrowRight,
  Star,
  Eye,
  EyeOff,
  Check,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { Pagination } from "../global/Pagination";
import { Loader, ButtonLoader } from "../global/Loader";
import { NotFound } from "../global/NotFound";
import {
  useGetReviews,
  useHideShowReview,
  useDeleteReview,
} from "../../hooks/useReview";
import { toast } from "react-toastify";

/**
 * UI component responsible for rendering the reviews list section.
 */
export function ReviewsList() {
  const { closeConfirm, onActiveModal, filters } = useOutletContext();
  const [page, setPage] = useState(1);
  const [processingId, setProcessingId] = useState(null);

  const {
    data: dataReview,
    isLoading,
    isError,
  } = useGetReviews({
    page: page,
    limit: 5,
    search: filters?.search,
  });

  const {
    mutate: mutateVisibility,
    isSuccess: isSuccessVis,
    isError: isErrorVis,
    data: dataVis,
    error: errorVis,
    reset: resetVis,
  } = useHideShowReview();

  const {
    mutate: mutateDelete,
    isSuccess: isSuccessDel,
    isError: isErrorDel,
    data: dataDel,
    error: errorDel,
    reset: resetDel,
  } = useDeleteReview();

  const reviews = dataReview?.data?.reviews || [];
  const pagination = dataReview?.data?.pagination;

  useEffect(() => {
    setPage(1);
  }, [filters?.search]);

  useEffect(() => {
    const isSuccess =
      (isSuccessVis && dataVis?.success) || (isSuccessDel && dataDel?.success);
    const isError = isErrorVis || isErrorDel;

    if (isSuccess) {
      toast.success(dataVis?.message || dataDel?.message);
      setProcessingId(null);
      const timer = setTimeout(() => {
        closeConfirm();
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (isError) {
      const errorObj = errorVis || errorDel;
      toast.error(errorObj?.response?.message);
      setProcessingId(null);
    }

    if (isSuccess || isError) {
      resetVis();
      resetDel();
    }
  }, [isSuccessVis, isErrorVis, dataVis, isSuccessDel, isErrorDel, dataDel]);

  /**
   * Handles toggle visibility behavior.
   */
  const handleToggleVisibility = (item) => {
    setProcessingId(item.id);
    mutateVisibility({
      id: item.id,
      formData: { isVisible: !item.isVisible },
    });
  };

  /**
   * Handles delete click behavior.
   */
  const handleDeleteClick = (review) => {
    onActiveModal(1, {
      title: "Supprimer l'avis ?",
      description:
        "Voulez-vous vraiment supprimer cet avis ? Cette action est irréversible.",
      onConfirm: () => {
        mutateDelete({ id: review.id });
      },
    });
  };

  if (isLoading) {
    return <Loader variant="centered" message="Chargement..." />;
  }

  return (
    <div className="mx-auto">
      <div className="space-y-4">
        {isError ? (
          <NotFound
            Icon={AlertCircle}
            title="Erreur de chargement"
            message="Impossible de récupérer la répartition des événements."
          />
        ) : reviews.length > 0 ? (
          reviews.map((item) => {
            const isProcessing = processingId === item.id;
            return (
              <Card
                key={item.id}
                noPadding={true}
                variant="defaultnobg"
                className={`${item.isVisible ? "bg-white" : "!bg-red-50 border-red-100"}`}
              >
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold border border-purple-200">
                      {item.user?.firstName?.charAt(0)}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                      <span className="font-bold text-gray-900">
                        {item.user?.firstName} {item.user?.lastName}
                      </span>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span className="text-purple-600 font-medium italic">
                        {item.provider?.businessName}
                      </span>
                      <div className="flex items-center gap-0.5 ml-1 sm:ml-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${star <= item.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                      <span className="text-gray-400 ml-1 sm:ml-2 text-xs">
                        {new Intl.DateTimeFormat("fr-FR", {
                          dateStyle: "medium",
                        }).format(new Date(item.createdAt))}
                      </span>
                    </div>
                  </div>

                  <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100 mb-4">
                    <p className="text-gray-800 italic leading-relaxed text-sm">
                      "{item.comment}"
                    </p>
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                      {item.isVisible ? (
                        <Eye className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-red-400" />
                      )}
                      <span className="capitalize">
                        {item.isVisible ? "Public" : "Masqué (Moderé)"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                      <Button
                        variant="secondary"
                        onClick={() => handleToggleVisibility(item)}
                        disabled={isProcessing}
                        className="flex items-center gap-2 px-4 py-2 text-sm min-w-[110px] justify-center"
                      >
                        {isProcessing ? (
                          <ButtonLoader />
                        ) : item.isVisible ? (
                          <>
                            <EyeOff className="w-4 h-4" /> Masquer
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" /> Publier
                          </>
                        )}
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleDeleteClick(item)}
                        disabled={isProcessing}
                      >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <NotFound
            Icon={Flag}
            title="Aucun avis trouvé"
            message="Aucun avis ne correspond à vos critères de recherche."
          />
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </div>
      )}
    </div>
  );
}
