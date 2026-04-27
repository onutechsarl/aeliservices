import React from "react";
import { AlertCircle, CheckCircle2, Clock, Crown } from "lucide-react";
import { Card } from "../../ui/Card";
import { useStats } from "../../hooks/useStats";
import { Loader } from "../global/Loader";
import { NotFound } from "../global/NotFound";

/**
 * UI component responsible for rendering the provider status list section.
 */
export const ProviderStatusList = () => {
  const { data: statsResponse, isLoading, isError } = useStats();
  const providers = statsResponse?.data?.providers;

  const providerStatuses = [
    {
      label: "Vérifiés",
      count: providers?.active,
      icon: CheckCircle2,
      color: "text-green-500",
      bg: "bg-green-100",
    },
    {
      label: "En attente",
      count: providers?.pending,
      icon: Clock,
      color: "text-yellow-500",
      bg: "bg-yellow-100",
    },
    {
      label: "Mis en avant",
      count: providers?.featured,
      icon: Crown,
      color: "text-purple-500",
      bg: "bg-purple-100",
    },
  ];

  return (
    <Card variant="stat">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-semibold text-gray-700">
          Statut des prestataires
        </h3>
        <span className="text-[10px] font-bold bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">
          TOTAL: {providers?.total}
        </span>
      </div>

      <div className="space-y-5">
        {isLoading ? (
          <Loader variant="centered" message="Chargement des statuts..." />
        ) : isError ? (
          <NotFound
            Icon={AlertCircle}
            title="Erreur de chargement"
            message="Impossible de récupérer les statuts des prestataires."
          />
        ) : (
          providerStatuses.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${item.bg}`}>
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                </div>
                <span className="text-sm text-gray-600 font-medium">
                  {item.label}
                </span>
              </div>
              <span className="font-bold text-gray-900">
                {item.count?.toLocaleString() || 0}
              </span>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};
