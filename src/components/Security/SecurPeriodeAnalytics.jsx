import React, { useMemo } from "react";
import { AlertCircle, BarChart3 } from "lucide-react";
import { AreaCharts } from "../../ui/AreaChart";
import { Card } from "../../ui/Card";
import { useSecurityLogs } from "../../hooks/useStats";
import { Loader } from "../global/Loader";
import { NotFound } from "../global/NotFound";

/**
 * UI component responsible for rendering the secur periode analytics section.
 */
export const SecurPeriodeAnalytics = () => {
  const { data: logsResponse, isLoading, isError } = useSecurityLogs();

  const chartData = useMemo(() => {
    const logs = logsResponse?.data?.logs || [];
    const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));

      return {
        name: days[d.getDay()],
        dateString: d.toISOString().split("T")[0],
        events: 0,
      };
    });

    logs.forEach((log) => {
      if (log.createdAt) {
        const logDate = log.createdAt.split("T")[0];
        const dayMatch = last7Days.find((d) => d.dateString === logDate);
        if (dayMatch) {
          dayMatch.events += 1;
        }
      }
    });

    return last7Days;
  }, [logsResponse]);

  const total7Days = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.events, 0);
  }, [chartData]);

  return (
    <Card className="h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Événements de sécurité
          </h3>
          <p className="text-sm text-gray-500">7 derniers jours</p>
        </div>
        {!isLoading && (
          <div className="text-right">
            <span className="text-2xl font-bold text-purple-600">
              {total7Days || 0}
            </span>
            <p className="text-[10px] text-gray-400 uppercase font-bold">
              Total
            </p>
          </div>
        )}
      </div>
      <div className="h-[250px] w-full">
        {isLoading ? (
          <Loader
            variant="centered"
            message="Chargement des événements..."
            className="h-full"
          />
        ) : isError ? (
          <NotFound
            Icon={AlertCircle}
            title="Erreur de chargement"
            message="Impossible de récupérer les événements de sécurité."
            className="h-full"
          />
        ) : chartData.some((item) => item.events > 0) ? (
          <AreaCharts data={chartData} dataKey="events" color="#8b5cf6" />
        ) : (
          <NotFound
            Icon={BarChart3}
            title="Aucune donnée"
            message="Aucun événement n'est disponible sur les 7 derniers jours."
            className="h-full"
          />
        )}
      </div>
    </Card>
  );
};
