import React, { useState } from "react";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { ButtonLoader } from "../global/Loader";

/**
 * UI component responsible for rendering the confirmation section.
 */
export function Confirmation({ closeConfirm, title, description, onConfirm }) {
  const [loading, setLoading] = useState(false);

  /**
   * Handles confirm behavior.
   */
  const handleConfirm = () => {
    setLoading(true);
    if (onConfirm) onConfirm();
  };

  return (
    <main
      onClick={loading ? null : closeConfirm}
      className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm z-[100]"
    >
      <Card onClick={(e) => e.stopPropagation()} className="max-w-sm w-full">
        <h2 className="text-xl text-center font-bold text-gray-900 mb-2">
          {title || "Confirmer l'action"}
        </h2>
        <p className="text-gray-500 text-sm text-center leading-relaxed mb-8">
          {description || "Voulez-vous vraiment effectuer cette opération ?"}
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={closeConfirm}
            disabled={loading}
          >
            Annuler
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? <ButtonLoader /> : "Confirmer"}
          </Button>
        </div>
      </Card>
    </main>
  );
}
