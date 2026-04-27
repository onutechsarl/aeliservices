import React, { useEffect } from "react";
import { toast } from "react-toastify";
import { AlertCircle, Mail, Upload } from "lucide-react";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";
import { ButtonLoader, Loader } from "../global/Loader";
import { useStats } from "../../hooks/useStats";
import { useExportContacts } from "../../hooks/useExport";
import { NotFound } from "../global/NotFound";

/**
 * UI component responsible for rendering the contact analytics section.
 */
export const ContactAnalytics = () => {
  const { data: statsResponse, isLoading, isError } = useStats();
  const {
    mutate: mutateExport,
    isPending: isPendingExport,
    isSuccess: isSuccessExport,
    data: dataExport,
    isError: isErrorExport,
    error: errorExport,
    reset: resetExport,
  } = useExportContacts();

  const contacts = statsResponse?.data?.contacts;

  const pendingPercentage =
    contacts?.total > 0
      ? Math.round((contacts?.pending / contacts?.total) * 100)
      : 0;

  /**
   * Handles export behavior.
   */
  const handleExport = () => {
    mutateExport();
  };

  useEffect(() => {
    if (isSuccessExport && dataExport) {
      const csvContent = dataExport.message;

      const blob = new Blob(["\ufeff", csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      const now = new Date();
      const date = now.toLocaleDateString("fr-FR").replace(/\//g, "-");
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const seconds = now.getSeconds().toString().padStart(2, "0");

      const time = `${hours}h${minutes}m${seconds}s`;

      link.href = url;
      link.setAttribute("download", `export-prestataires-${date}-${time}.csv`);

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Exportation réussie !");
    }

    if (isErrorExport) {
      const mainMessage =
        errorExport?.message || "Erreur lors de l'exportation";
      toast.error(mainMessage);

      const backendErrors = errorExport?.response?.data?.errors;
      if (Array.isArray(backendErrors)) {
        backendErrors.forEach((err) => {
          toast.info(err.message);
        });
      }
    }

    resetExport();
  }, [isSuccessExport, isErrorExport, dataExport, errorExport]);

  return (
    <Card className="h-full">
      {isLoading ? (
        <Loader message="Chargement des contacts..." className="h-full" />
      ) : isError ? (
        <NotFound
          Icon={AlertCircle}
          title="Erreur de chargement"
          message="Impossible de récupérer les statistiques de contact."
          className="h-full"
        />
      ) : (
        <>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Mail className="w-6 h-6 text-orange-500" />
              </div>
              <Button
                variant="primary"
                size={"icon"}
                disabled={isPendingExport}
                onClick={handleExport}
                className="p-[14px] rounded-lg"
              >
                {isPendingExport ? (
                  <span className="flex items-center gap-2">
                    <ButtonLoader />
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Upload size={18} />
                  </span>
                )}
              </Button>
            </div>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${
                contacts?.pending > 0
                  ? "text-red-500 bg-red-50"
                  : "text-gray-500 bg-gray-50"
              }`}
            >
              {contacts?.pending || 0} Non lus
            </span>
          </div>

          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-1">
              {contacts?.total?.toLocaleString()}
            </h3>
            <p className="text-sm text-gray-500 mb-4">Demandes de contact</p>

            <div className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
              <div
                className="bg-orange-400 h-2 rounded-full transition-all duration-500"
                style={{ width: `${pendingPercentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400">
              {pendingPercentage}% en attente de réponse
            </p>
          </div>
        </>
      )}
    </Card>
  );
};
