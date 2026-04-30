import { useQuery } from "@tanstack/react-query";
import { request } from "../api/apiClient";

/**
 * Custom hook that manages the stats workflow.
 */
export const useStats = () => {
  return useQuery({
    queryKey: ["useStats"],
    queryFn: () => request("/api/admin/stats", "GET"),
    refetchOnWindowFocus: false,
  });
};

/**
 * Custom hook that manages the security stats workflow.
 */
export const useSecurityStats = () => {
  return useQuery({
    queryKey: ["useSecurityStats"],
    queryFn: () => request("/api/admin/security-stats", "GET"),
    refetchOnWindowFocus: false,
  });
};

/**
 * Custom hook that manages the security logs workflow.
 */
export const useSecurityLogs = () => {
  return useQuery({
    queryKey: ["useSecurityLogs"],
    queryFn: () => request("/api/admin/security-logs", "GET"),
    refetchOnWindowFocus: false,
  });
};

/**
 * Custom hook that manages the analytics statistiques a p i workflow.
 */
export const useAnalyticsStatistiquesAPI = () => {
  return useQuery({
    queryKey: ["useAnalyticsStatistiquesAPI"],
    queryFn: () => request("/api/admin/analytics", "GET"),
    refetchOnWindowFocus: false,
  });
};

/**
 * Custom hook that manages hourly analytics workflow.
 */
export const useAnalyticsHourly = (date) => {
  return useQuery({
    queryKey: ["useAnalyticsHourly", date],
    queryFn: () => request(`/api/admin/analytics/hourly?date=${date}`, "GET"),
    enabled: Boolean(date),
    refetchOnWindowFocus: false,
  });
};

/**
 * Custom hook that manages daily active users analytics workflow.
 */
export const useAnalyticsDailyActiveUsers = (days = 30) => {
  const clampedDays = Math.min(365, Math.max(1, Number(days) || 30));

  return useQuery({
    queryKey: ["useAnalyticsDailyActiveUsers", clampedDays],
    queryFn: () =>
      request(
        `/api/admin/analytics/daily-active-users?days=${clampedDays}`,
        "GET"
      ),
    refetchOnWindowFocus: false,
  });
};
