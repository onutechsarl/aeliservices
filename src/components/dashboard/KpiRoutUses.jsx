import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ChevronDown,
  Clock3,
  Route,
  Users,
} from "lucide-react";
import {
  useAnalyticsDailyActiveUsers,
  useAnalyticsHourly,
  useAnalyticsStatistiquesAPI,
} from "../../hooks/useStats";
import { AreaCharts } from "../../ui/AreaChart";
import { Card } from "../../ui/Card";
import { Input } from "../../ui/Input";
import { Loader } from "../global/Loader";
import { NotFound } from "../global/NotFound";

/**
 * UI component responsible for rendering API route usage analytics.
 */
export const KpiRoutUses = () => {
  const today = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [selectedDate, setSelectedDate] = useState(today);

  const {
    data: analyticsResponse,
    isLoading: isLoadingAnalytics,
    isError: isErrorAnalytics,
  } = useAnalyticsStatistiquesAPI();

  const {
    data: hourlyResponse,
    isLoading: isLoadingHourly,
    isError: isErrorHourly,
  } = useAnalyticsHourly(selectedDate);

  const {
    data: dauResponse,
    isLoading: isLoadingDau,
    isError: isErrorDau,
  } = useAnalyticsDailyActiveUsers(30);

  const stats = analyticsResponse?.data?.stats || {};
  const endpoints = analyticsResponse?.data?.endpoints || [];
  const hourlySeries = hourlyResponse?.data?.hourly || [];
  const dauData = dauResponse?.data || {};
  const dauSeries = dauData?.series || [];

  const availableDates = useMemo(() => {
    const datesFromDau = dauSeries
      .map((item) => item?.day)
      .filter(Boolean)
      .filter((value) => /^\d{4}-\d{2}-\d{2}$/.test(value));

    const mergedDates = new Set([today, ...datesFromDau]);

    return Array.from(mergedDates).sort((a, b) => new Date(b) - new Date(a));
  }, [dauSeries, today]);

  const hourlyChartData = useMemo(() => {
    if (!hourlySeries.length) return [];

    return hourlySeries.map((point, index) => {
      const hourValue = point?.hour;
      const parsedHour = hourValue ? new Date(hourValue) : null;
      const hourLabel =
        parsedHour && !Number.isNaN(parsedHour.getTime())
          ? `${String(parsedHour.getHours()).padStart(2, "0")}h`
          : `${index}h`;

      return {
        name: hourLabel,
        count: Number(point?.requests || 0),
      };
    });
  }, [hourlySeries]);

  const isLoading = isLoadingAnalytics || isLoadingHourly || isLoadingDau;
  const isError = isErrorAnalytics || isErrorHourly || isErrorDau;

  const totalRequests = Number(stats?.totalRequests || 0);
  const totalErrors = Number(stats?.totalErrors || 0);
  const avgDuration = Number(stats?.avgDuration || 0);
  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

  return (
    <Card className="h-full">
      {isLoading ? (
        <Loader
          variant="centered"
          message="Chargement des analytics API..."
          className="h-full"
        />
      ) : isError ? (
        <NotFound
          Icon={AlertCircle}
          title="Erreur de chargement"
          message="Impossible de récupérer les analytics API."
          className="h-full"
        />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Activity className="w-6 h-6 text-indigo-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Trafic API
                </h3>
                <p className="text-sm text-gray-500">
                  Statistiques globales et usage des routes
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-gray-100 p-4 bg-gray-50">
              <p className="text-xs uppercase text-gray-500 mb-1">Requêtes</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalRequests.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 p-4 bg-gray-50">
              <p className="text-xs uppercase text-gray-500 mb-1">Temps moyen</p>
              <p className="text-2xl font-bold text-gray-900">
                {avgDuration.toFixed(2)} ms
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 p-4 bg-gray-50">
              <p className="text-xs uppercase text-gray-500 mb-1">Taux d'erreur</p>
              <p className="text-2xl font-bold text-gray-900">
                {errorRate.toFixed(2)}%
              </p>
            </div>
          </div>

          <details className="group">
            <summary className="flex items-center gap-2 mb-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <Route className="w-4 h-4 text-indigo-500" />
              <h4 className="text-sm font-semibold text-gray-700">
                Endpoints les plus utilisés
              </h4>
              <ChevronDown className="w-4 h-4 text-gray-400 ml-auto transition-transform group-open:rotate-180" />
            </summary>
            {endpoints.length ? (
              <div className="space-y-2">
                {endpoints.map((item, index) => (
                  <div
                    key={`${item?.endpoint}-${index}`}
                    className="rounded-lg border border-gray-100 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 break-all">
                          {item?.endpoint}
                        </p>
                        <p className="text-xs text-gray-500">{item?.method || "-"}</p>
                      </div>
                      <span className="text-sm font-semibold text-indigo-600 whitespace-nowrap">
                        {Number(item?.totalRequests || 0).toLocaleString()} req
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600">
                      <p>
                        <span className="font-medium">Erreurs:</span>{" "}
                        {Number(item?.errorCount || 0).toLocaleString()}
                      </p>
                      <p>
                        <span className="font-medium">Moyenne:</span>{" "}
                        {Number(item?.avgDuration || 0).toFixed(2)} ms
                      </p>
                      <p>
                        <span className="font-medium">Min:</span>{" "}
                        {Number(item?.minDuration || 0).toLocaleString()} ms
                      </p>
                      <p>
                        <span className="font-medium">Max:</span>{" "}
                        {Number(item?.maxDuration || 0).toLocaleString()} ms
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <NotFound
                Icon={Route}
                title="Aucun endpoint"
                message="Aucune donnée d'usage de routes n'est disponible."
              />
            )}
          </details>

          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Clock3 className="w-4 h-4 text-indigo-500" />
                <h4 className="text-sm font-semibold text-gray-700">
                  Répartition horaire ({selectedDate})
                </h4>
              </div>

              <div className="w-full sm:w-72">
                <Input
                  type="select"
                  name="selectedDate"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  options={availableDates.map((date) => ({
                    label: date === today ? `${date} (aujourd'hui)` : date,
                    value: date,
                  }))}
                  className="!py-2.5 !text-sm !font-medium"
                />
              </div>
            </div>
            {hourlySeries.length ? (
              <div className="h-56 rounded-xl p-3">
                <AreaCharts
                  data={hourlyChartData}
                  dataKey="count"
                  color="#6366f1"
                />
              </div>
            ) : (
              <NotFound
                Icon={Clock3}
                title="Aucune donnée horaire"
                message="Aucune statistique horaire n'est disponible pour cette date."
              />
            )}
          </div>

          <details className="group">
            <summary className="flex items-center gap-2 mb-3 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
              <Users className="w-4 h-4 text-indigo-500" />
              <h4 className="text-sm font-semibold text-gray-700">
                DAU sur {dauData?.days || 30} jours
              </h4>
              <ChevronDown className="w-4 h-4 text-gray-400 ml-auto transition-transform group-open:rotate-180" />
            </summary>
            {dauSeries.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {dauSeries.map((item, index) => (
                  <div
                    key={`${item?.day}-${index}`}
                    className="rounded-lg border border-gray-100 p-3"
                  >
                    <p className="text-xs text-gray-500">{item?.day}</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {(item?.count || 0).toLocaleString()} utilisateurs
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <NotFound
                Icon={Users}
                title="Aucune donnée DAU"
                message="Aucune activité de connexion n'est disponible sur la période demandée."
              />
            )}
          </details>
        </div>
      )}
    </Card>
  );
};
