import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import { Loader2 } from 'lucide-react';
import { RatingStars } from "../../ui/RatingStars";
import { Button } from "../../ui/Button";
import { useCreateReview, useUpdateReview } from '../../hooks/useReview';

/**
 * UI component responsible for rendering feedback card.
 */
export function FeedbackCard({ closeFeedback, providerData }) {
  const [hoverRating, setHoverRating] = useState(0);
  const isEditing = !!providerData?.userId;

  const {
    mutate: mutateAddFeedback,
    isSuccess: isSuccessAddFeedback,
    isPending: isPendingAddFeedback,
    isError: isErrorAddFeedback,
    data: dataAddFeedback,
    error: errorAddFeedback,
    reset: resetAdd
  } = useCreateReview();

  const {
    mutate: mutateUpdateFeedback,
    isSuccess: isSuccessUpdateFeedback,
    isPending: isPendingUpdateFeedback,
    isError: isErrorUpdateFeedback,
    data: dataUpdateFeedback,
    error: errorUpdateFeedback,
    reset: resetUpdate
  } = useUpdateReview();

  const [formData, setFormData] = useState({
    providerId: "",
    rating: 0,
    comment: ""
  });

  useEffect(() => {
    if (providerData) {
      if (isEditing) {

        setFormData({
          providerId: providerData.providerId || "",
          rating: providerData.rating || 0,
          comment: providerData.comment || ""
        });
      } else {

        setFormData({
          providerId: providerData.id || "",
          rating: 0,
          comment: ""
        });
      }
    }
  }, [providerData, isEditing]);

  useEffect(() => {
    const isSuccess = (isSuccessAddFeedback && dataAddFeedback?.success) || (isSuccessUpdateFeedback && dataUpdateFeedback?.success);
    const isError = isErrorAddFeedback || isErrorUpdateFeedback;

    if (isSuccess) {
      toast.success(dataAddFeedback?.message || dataUpdateFeedback?.message);
      const timer = setTimeout(() => {
        closeFeedback();
      }, 1000);

      return () => clearTimeout(timer);
    }

    if (isError) {
      const errorObj = errorAddFeedback || errorUpdateFeedback;
      const mainMessage = errorObj?.response?.data?.message || errorObj?.message;
      toast.error(mainMessage);

      const backendErrors = errorObj?.response?.data?.errors;
      if (Array.isArray(backendErrors)) {
        backendErrors.forEach((err) => toast.info(err.message));
      }
    }

    if (isSuccess || isError) {
      resetAdd();
      resetUpdate();
    }
  }, [
    isSuccessAddFeedback, isErrorAddFeedback, dataAddFeedback, errorAddFeedback, resetAdd,
    isSuccessUpdateFeedback, isErrorUpdateFeedback, dataUpdateFeedback, errorUpdateFeedback, resetUpdate
  ]);

  /**
   * Handles handle submit behavior.
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditing) {

      mutateUpdateFeedback({
        id: providerData.id,
        formData: {
          rating: formData.rating,
          comment: formData.comment
        }
      });
    } else {
      mutateAddFeedback(formData);
    }
  };

  const displayName = isEditing ? providerData?.businessName : providerData?.businessName;
  const displayImage = isEditing ? providerData?.profilePhoto : providerData?.profilePhoto;
  
  return (
    <div
      onClick={closeFeedback}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-[1003] p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300"
      >
        <div className="p-6 sm:p-8">
          <div className="flex justify-center mb-6">
            <img
              src={displayImage || `https://ui-avatars.com/api/?name=${displayName}&background=random`}
              alt={displayName}
              className="w-20 h-20 rounded-full ring-4 ring-white shadow-lg object-cover"
            />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isEditing ? "Modifier mon avis" : "Évaluez votre expérience"}
            </h1>
            <p className="text-gray-500 text-sm">
              Note pour <span className="font-semibold text-gray-900">{displayName}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <RatingStars
              rating={formData.rating}
              hoverRating={hoverRating}
              onRate={(val) => setFormData(p => ({ ...p, rating: val }))}
              onHover={setHoverRating}
            />

            <textarea
              name="comment"
              rows={4}
              value={formData.comment}
              onChange={(e) => setFormData(p => ({ ...p, comment: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all resize-none text-gray-700"
              placeholder="Votre avis aide les autres membres..."
            />

            <div className="space-y-3">
              <Button
                type="submit"
                variant="gradient"
                className="w-full py-3"
                disabled={formData.rating === 0 || isPendingAddFeedback || isPendingUpdateFeedback}
              >
                {(isPendingAddFeedback || isPendingUpdateFeedback) ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Traitement...
                  </span>
                ) : (
                  <span>{isEditing ? "Mettre à jour" : "Soumettre"}</span>
                )}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="w-full py-3"
                onClick={closeFeedback}
              >
                Annuler
              </Button>
            </div>
          </form>
        </div>
      </div>
      <ToastContainer position="bottom-center" />
    </div>
  );
}