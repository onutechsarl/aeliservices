import React from "react";
import { AlertTriangle, Shield, Ban, Activity } from "lucide-react";
import { StatsCard } from "../../ui/StatsCard";
import { useSecurityStats } from "../../hooks/useStats";

/**
 * UI component responsible for rendering the kpicount section.
 */
export function Kpicount() {
  const {
    data: securityStatsResponse,
    isLoading,
    isError,
  } = useSecurityStats();
  const statsData = securityStatsResponse?.data;

  const securityKpis = [
    {
      title: "Tentatives échouées (24h)",
      value: statsData?.dailyFailedAttempts ?? 0,
      subtitle: `${statsData?.hourlyFailedAttempts ?? 0} cette heure`,
      icon: AlertTriangle,
      valueCol: "text-red-600",
      iconColor: "text-red-600",
      iconBg: "bg-red-50",
    },
    {
      title: "Événements à haut risque",
      value: statsData?.highRiskEvents24h ?? 0,
      subtitle: "Dernières 24 heures",
      icon: Shield,
      valueCol: "text-orange-500",
      iconColor: "text-orange-500",
      iconBg: "bg-orange-50",
    },
    {
      title: "IP bannies",
      value: statsData?.activeBannedIPs ?? 0,
      subtitle: "Actuellement actives",
      icon: Ban,
      valueCol: "text-purple-600",
      iconColor: "text-purple-600",
      iconBg: "bg-purple-50",
    },
    {
      title: "IP suspectes",
      value: statsData?.topSuspiciousIPs?.length ?? 0,
      subtitle: "Détectées sur le réseau",
      icon: Activity,
      valueCol: "text-blue-600",
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {securityKpis.map((kpi, index) => (
        <StatsCard
          key={index}
          icon={kpi.icon}
          title={kpi.title}
          value={kpi.value.toString()}
          valueCol={kpi.valueCol}
          subtitle={kpi.subtitle}
          iconColor={kpi.iconColor}
          iconBg={kpi.iconBg}
          isLoading={isLoading}
          isError={isError}
        />
      ))}
    </div>
  );
}
