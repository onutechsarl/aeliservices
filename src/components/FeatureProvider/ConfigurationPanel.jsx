import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { ChevronDown, Star, Sparkles } from "lucide-react";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";
import { ButtonLoader } from "../global/Loader";
import { useFeature } from "../../hooks/useBoost";

/**
 * UI component responsible for rendering the configuration panel section.
 */
export const ConfigurationPanel = ({ selectedProvider }) => {
  const [duration, setDuration] = useState(7);
  const {
    mutate: mutateFeature,
    isPending,
    isSuccess,
    isError,
    data,
    error,
  } = useFeature();
  const estimatedPrice = (duration / 7) * 49;

  useEffect(() => {
    if (isSuccess && data?.success) {
      toast.success(data.message);
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

  /**
   * Handles activate feature behavior.
   */
  const handleActivateFeature = () => {
    if (!selectedProvider?.id) {
      toast.warning("Veuillez sélectionner un prestataire");
      return;
    }
    const payload = {
      isFeatured: true,
      duration: Number(duration),
    };

    mutateFeature({
      id: selectedProvider.id,
      formData: payload,
    });
  };

  return (
    <Card
      variant="glass"
      className="flex flex-col border-dashed h-full border-violet-200"
    >
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-amber-500" />
        <h2 className="text-xl font-bold text-slate-800">Booster le profil</h2>
      </div>

      <div className="space-y-6 flex-1">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-slate-400 tracking-wider">
            Période de visibilité
          </label>
          <div className="relative">
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full appearance-none bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-700 focus:ring-2 focus:ring-[#FCE0D6] outline-none transition-all cursor-pointer"
            >
              <option value={7}>1 Semaine (Priorité haute)</option>
              <option value={14}>2 Semaines (Recommandé)</option>
              <option value={30}>1 Mois (Pack Premium)</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
        <div className="p-4 rounded-xl bg-gradient-to-br from-violet-50 to-white border border-violet-100 space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Cible :</span>
            <span className="text-slate-900 font-bold truncate max-w-[150px]">
              {selectedProvider?.businessName || "---"}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 italic leading-relaxed">
          * En confirmant, ce prestataire apparaîtra en tête des résultats de
          recherche jusqu'au{" "}
          {new Date(Date.now() + duration * 86400000).toLocaleDateString()}.
        </p>
      </div>
      <Button
        onClick={handleActivateFeature}
        variant="primary"
        className="w-full mt-6 py-4 shadow-lg bg-[#E8524D] hover:bg-[#d94742] text-white rounded-xl transition-all"
        disabled={
          !selectedProvider || isPending || selectedProvider?.isFeatured
        }
      >
        {isPending ? (
          <ButtonLoader className="mr-2" />
        ) : selectedProvider?.isFeatured ? (
          "Déjà en vedette"
        ) : (
          <>
            <Star size={18} className="mr-2 fill-current" />
            Activer la mise en avant
          </>
        )}
      </Button>
    </Card>
  );
};
