import React from "react";
import { StatsCard } from "../../ui/StatsCard";
import { Users, Briefcase, ShoppingBag, Star } from "lucide-react";
import { useStats } from "../../hooks/useStats";

/**
 * UI component responsible for rendering the kpi count section.
 */
export function KpiCount() {
  const { data: statsResponse, isLoading, isError } = useStats();
  const stats = statsResponse?.data;

  const kpiCards = [
    {
      title: "Utilisateurs",
      value: stats?.users?.total?.toString() || "0",
      subtitle: `${stats?.users?.clients || 0} Clients`,
      icon: Users,
      iconColor: "text-blue-500",
      iconBg: "bg-blue-100",
      footerText: `${stats?.users?.providers || 0} Providers`,
      trend: "Total",
    },
    {
      title: "Prestataires actifs",
      value: stats?.providers?.active?.toString() || "0",
      subtitle: `${stats?.providers?.pending || 0} En attente`,
      icon: Briefcase,
      iconColor: "text-purple-500",
      iconBg: "bg-purple-100",
      footerText: `${stats?.providers?.featured || 0} Mis en avant`,
      trend: "Vérifiés",
    },
    {
      title: "Services disponibles",
      value: stats?.services?.total?.toString() || "0",
      subtitle: "Services en ligne",
      icon: ShoppingBag,
      iconColor: "text-indigo-500",
      iconBg: "bg-indigo-100",
      footerText: "Actifs sur la plateforme",
      trend: "Live",
    },
    {
      title: "Avis clients",
      value: stats?.reviews?.total?.toString() || "0",
      subtitle: "Note moyenne globale",
      icon: Star,
      iconColor: "text-yellow-500",
      iconBg: "bg-yellow-100",
      rating: parseFloat(stats?.reviews?.averageRating || 0),
      trend: `${stats?.reviews?.averageRating || 0}/5`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {kpiCards.map((kpi, index) => (
        <StatsCard
          key={index}
          title={kpi.title}
          value={kpi.value}
          subtitle={kpi.subtitle}
          icon={kpi.icon}
          iconColor={kpi.iconColor}
          iconBg={kpi.iconBg}
          footerText={kpi.footerText}
          trend={kpi.trend}
          trendUp={true}
          rating={kpi.rating}
          isLoading={isLoading}
          isError={isError}
        />
      ))}
    </div>
  );
}
