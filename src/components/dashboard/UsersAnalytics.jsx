import React, { useMemo } from "react";
import { AlertCircle, BarChart3 } from "lucide-react";
import { Card } from "../../ui/Card";
import { AreaCharts } from "../../ui/AreaChart";
import { useGetUsers } from "../../hooks/useUser";
import { Loader } from "../global/Loader";
import { NotFound } from "../global/NotFound";

/**
 * UI component responsible for rendering the users analytics section.
 */
export const UsersAnalytics = () => {
  const { data: usersResponse, isLoading, isError } = useGetUsers();

  const chartData = useMemo(() => {
    const users = usersResponse?.data?.users || [];

    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        name: days[d.getDay()],
        dateString: d.toISOString().split("T")[0],
        users: 0,
      };
    });

    users.forEach((user) => {
      const userDate = user.createdAt.split("T")[0];
      const dayMatch = last7Days.find((d) => d.dateString === userDate);
      if (dayMatch) {
        dayMatch.users += 1;
      }
    });

    return last7Days;
  }, [usersResponse]);

  return (
    <Card className="h-full">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Inscriptions récentes
          </h3>
          <p className="text-sm text-gray-500">7 derniers jours</p>
        </div>
        {!isLoading && (
          <div className="text-right">
            <span className="text-2xl font-bold text-purple-600">
              {usersResponse?.data?.pagination?.totalItems || 0}
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
            message="Chargement des inscriptions..."
            className="h-full"
          />
        ) : isError ? (
          <NotFound
            Icon={AlertCircle}
            title="Erreur de chargement"
            message="Impossible de récupérer les inscriptions récentes."
            className="h-full"
          />
        ) : chartData.some((item) => item.users > 0) ? (
          <AreaCharts data={chartData} dataKey="users" color="#8b5cf6" />
        ) : (
          <NotFound
            Icon={BarChart3}
            title="Aucune donnée"
            message="Aucune inscription n'est disponible sur les 7 derniers jours."
            className="h-full"
          />
        )}
      </div>
    </Card>
  );
};
