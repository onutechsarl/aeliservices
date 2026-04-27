import React from "react";
import { Loader2, AlertCircle } from "lucide-react";

/**
 * UI component responsible for rendering the stats card section.
 */
export function StatsCard({
  title,
  value,
  valueCol,
  subtitle,
  icon: Icon,
  iconColor,
  iconBg,
  trend,
  trendUp,
  footerText,
  rating,
  isLoading = false,
  isError = false,
  errorText = "Erreur de chargement",
}) {
  return (
    <div className="relative overflow-hidden bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-full transition-all hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-lg ${iconBg}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        {trend && (
          <span
            className={`text-sm font-medium ${trendUp ? "text-green-500" : "text-red-500"}`}
          >
            {trend}
          </span>
        )}
      </div>
      <div className="absolute -bottom-10 -right-10 p-2 opacity-5">
        <Icon size={140} />
      </div>

      <div>
        {isLoading ? (
          <div className="flex items-center gap-2 mb-1">
            <Loader2 className="w-6 h-6 animate-spin text-[#E8524D]" />
            <span className="text-sm text-gray-500">Chargement...</span>
          </div>
        ) : isError ? (
          <div className="flex items-center gap-2 mb-1 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{errorText}</span>
          </div>
        ) : (
          <h3 className={`text-3xl font-bold text-gray-900 mb-1 ${valueCol}`}>
            {value}
          </h3>
        )}
        <p className="text-sm text-gray-500 font-medium mb-2">{title}</p>
        <div className="flex items-center text-xs text-gray-400">
          {rating ? (
            <div className="flex items-center text-yellow-400 mr-2">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-3 h-3 ${i < Math.floor(rating) ? "fill-current" : "text-gray-200"}`}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          ) : null}
          <span>{subtitle}</span>
        </div>
        {footerText && (
          <p className="text-xs text-green-600 mt-2 font-medium">
            {footerText}
          </p>
        )}
      </div>
    </div>
  );
}
