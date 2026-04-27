import React from 'react';
import { TriangleAlert, Loader2 } from 'lucide-react';
import { Button } from '../../ui/Button';

/**
 * UI component responsible for rendering confirmation.
 */
export function Confirmation({ closeConfirm, onConfirm, isPending, title, description }) {

  /**
   * Handles handle confirm behavior.
   */
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <main
      onClick={closeConfirm}
      className="fixed min-h-screen w-full flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm z-1002">
      <div
        onClick={(e) => e.stopPropagation()}
        className=" w-full max-w-[400px] bg-white rounded-2xl shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-300"
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 text-gray-900">
            <TriangleAlert className="w-12 h-12 stroke-[1.5]" />
          </div>
          <h2 id="modal-title" className="text-xl font-bold text-gray-900 mb-2">
            {title}
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-[280px]">
            {description}
          </p>
          <div className="flex w-full gap-2">
            <Button
              key="cancel"
              variant="outline"
              className="flex-1"
              disabled={isPending}
              onClick={closeConfirm}
            >
              Annuler
            </Button>,
            <Button
              key="delete"
              variant="danger"
              className="flex-1"
              disabled={isPending}
              onClick={handleConfirm}
            >
              {(isPending) ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verification...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Supprimer
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
