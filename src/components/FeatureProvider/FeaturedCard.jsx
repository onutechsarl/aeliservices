import React, { useEffect } from "react";
import { toast } from "react-toastify";
import { useOutletContext } from "react-router-dom";
import { X, Star, AlertCircle } from "lucide-react";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";
import { Loader, ButtonLoader } from "../global/Loader";
import { NotFound } from "../global/NotFound";
import { useGetFeatured, useFeature } from "../../hooks/useBoost";

/**
 * UI component responsible for rendering the featured card section.
 */
export const FeaturedCard = () => {
  const { closeConfirm, onActiveModal } = useOutletContext();
  const {
    data: dataFeatured,
    isLoading: isLoadingFeatured,
    isError: isErrorFeatured,
  } = useGetFeatured();
  const {
    mutate: mutateFeature,
    isPending,
    isSuccess,
    isError,
    data,
    error,
  } = useFeature();
  const providers = dataFeatured?.data?.providers || [];

  const getRemainingDays = (dateString) => {
    if (!dateString) return "Indéfini";
    const now = new Date();
    const expiry = new Date(dateString);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return "Expire bientôt";
    return `${diffDays} jours`;
  };

  /**
   * Handles remove feature behavior.
   */
  const handleRemoveFeature = (item) => {
    const payload = { isFeatured: false };
    onActiveModal(1, {
      title: "Supprimer la mise en avant ?",
      description: `Voulez-vous vraiment retirer "${item.businessName}" des prestations à la une ?`,
      confirmText: "Retirer",
      variant: "danger",
      onConfirm: () => {
        mutateFeature({
          id: item.id,
          formData: payload,
        });
      },
    });
  };

  useEffect(() => {
    if (isSuccess && data?.success) {
      toast.success(data.message);
      const timer = setTimeout(() => {
        if (closeConfirm) closeConfirm();
      }, 500);
      return () => clearTimeout(timer);
    }

    if (isError) {
      const mainMessage = error?.message;
      toast.error(mainMessage);

      const backendErrors = error?.response?.errors;
      if (Array.isArray(backendErrors)) {
        backendErrors.forEach((err) => {
          toast.info(err.message);
        });
      }
    }
  }, [isSuccess, isError, data, error]);

  if (isLoadingFeatured) {
    return <Loader variant="centered" message="Chargement..." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          Prestations à la une
        </h2>
        <span className="text-sm text-slate-500">
          {providers.length} {providers.length > 1 ? "actifs" : "actif"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isErrorFeatured ? (
          <div className="col-span-full">
            <NotFound
              Icon={AlertCircle}
              title="Erreur de chargement"
              message="Impossible de récupérer la répartition des événements."
            />
          </div>
        ) : providers.length > 0 ? (
          providers.map((item) => (
            <Card
              className="group border-violet-50 hover:border-[#E8524D]/20 transition-colors"
              key={item.id}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-xl overflow-hidden ring-2 ring-violet-50">
                    <img
                      src={
                        item.profilePhoto ||
                        `https://ui-avatars.com/api/?name=${item.businessName}&background=random`
                      }
                      alt={item.businessName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {isPending && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-xl">
                      <ButtonLoader />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 text-sm truncate">
                    {item.businessName}
                  </h4>
                  <p className="text-[10px] text-slate-400 uppercase font-medium truncate mb-1">
                    {item.location.split(",")[0]}
                  </p>
                  <div className="inline-block px-2 py-0.5 rounded-md bg-[#E8524D]/10 text-[10px] font-bold text-[#E8524D] uppercase tracking-tighter">
                    Expire dans {getRemainingDays(item.featuredUntil)}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={isPending}
                    className="h-8 w-8 text-slate-300 hover:text-red-500 transition-colors"
                    onClick={() => handleRemoveFeature(item)}
                  >
                    <X size={14} />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <NotFound
              Icon={Star}
              title="Aucune prestation à la une"
              message="Aucun prestataire n'est actuellement mis en avant."
            />
          </div>
        )}
      </div>
    </div>
  );
};
