import React, { useMemo } from "react";
import { ShieldAlert, AlertCircle } from "lucide-react";
import { PieCharts } from "../../ui/PieChart";
import { Card } from "../../ui/Card";
import { Loader } from "../global/Loader";
import { NotFound } from "../global/NotFound";
import { useSecurityLogs } from "../../hooks/useStats";

/**
 * UI component responsible for rendering the risk level distribution section.
 */
export function RiskLevelDistribution() {
  const { data: logsResponse, isLoading, isError } = useSecurityLogs();

  const compositionData = useMemo(() => {
    const logs = logsResponse?.data?.logs || [];

    const counts = logs.reduce((acc, log) => {
      const type = log.eventType || "Autre";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const colors = {
      login_success: "#10b981",
      login_failed: "#ef4444",
      bot_detection: "#8b5cf6",
      default: "#94a3b8",
    };

    const labels = {
      login_success: "Succès",
      login_failed: "Échecs",
      bot_detection: "Bots",
    };

    return Object.keys(counts).map((key) => ({
      name: labels[key] || key,
      value: counts[key],
      color: colors[key] || colors.default,
    }));
  }, [logsResponse]);

  return (
    <Card noPadding={true} className="p-6 relative h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Composition des événements
        </h3>
        {!isLoading && (
          <span className="flex flex-row text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded">
            {logsResponse?.data?.logs?.length || 0} logs
          </span>
        )}
      </div>

      <div className="h-[250px] w-full flex items-center justify-center relative pb-4">
        {isLoading ? (
          <Loader variant="inline" message="Chargement..." />
        ) : isError ? (
          <NotFound
            Icon={AlertCircle}
            title="Erreur de chargement"
            message="Impossible de récupérer la répartition des événements."
          />
        ) : compositionData.length > 0 ? (
          <PieCharts data={compositionData} />
        ) : (
          <NotFound
            Icon={ShieldAlert}
            title="Aucun événement de sécurité"
            message="Aucune donnée n'est disponible pour la répartition des événements."
          />
        )}
      </div>
    </Card>
  );
}
