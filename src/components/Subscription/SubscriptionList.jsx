import React from "react";
import { AlertCircle, CreditCard, ExternalLink } from "lucide-react";
import { Badge } from "../../ui/Badge";
import { Card } from "../../ui/Card";
import { Loader } from "../global/Loader";
import { NotFound } from "../global/NotFound";

/**
 * UI component responsible for rendering the subscription list section.
 */
const formatAmount = (amount, currency) => {
  if (amount === null || amount === undefined) return "-";
  return new Intl.NumberFormat("fr-FR").format(amount) + ` ${currency || ""}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatusVariant = (status) => {
  const normalized = (status || "").toUpperCase();
  if (["PAID", "SUCCESS", "COMPLETED", "ACCEPTED"].includes(normalized)) return "green";
  if (["PENDING", "WAITING"].includes(normalized)) return "yellow";
  if (["REVOKED", "CANCELLED", "CANCELED", "FAILED"].includes(normalized)) {
    return "red";
  }
  return "gray";
};

/**
 * UI component responsible for rendering the subscription list section.
 */
export const SubscriptionList = ({ payments, isLoading, isError }) => {
  const items = payments || [];

  return (
    <div className="w-full">
      <div className="space-y-4 max-w-6xl">
        {isLoading ? (
          <Loader message="Chargement des abonnements..." />
        ) : isError ? (
          <NotFound
            Icon={AlertCircle}
            title="Erreur de chargement"
            message="Impossible de récupérer la liste des abonnements."
          />
        ) : items.length === 0 ? (
          <NotFound
            Icon={CreditCard}
            title="Aucun abonnement"
            message="Aucun abonnement n'est disponible pour le moment."
          />
        ) : (
          items.map((payment) => (
            <Card key={payment.id} className="backdrop-blur-sm p-4 sm:p-5 ">
              <div className="flex flex-col sm:hidden gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {payment.user?.firstName} {payment.user?.lastName}
                      </h3>
                      <p className="text-sm text-purple-500">
                        {payment.description || "Abonnement"}
                      </p>
                    </div>
                  </div>
                  <Badge
                    status={payment.status}
                    variant={getStatusVariant(payment.status)}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div className="text-gray-600 font-medium">
                    {formatDate(payment.createdAt)}
                  </div>
                  <div className="text-gray-500">
                    {payment.provider?.businessName || "-"}
                  </div>
                  <div className="font-semibold text-gray-800">
                    {formatAmount(payment.amount, payment.currency)}
                  </div>
                </div>
                {payment.paymentUrl && (
                  <a
                    href={payment.paymentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    Voir le lien de paiement
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>

              <div className="hidden sm:flex items-center gap-4 lg:gap-6">
                <div className="flex items-center gap-3 min-w-[180px] lg:min-w-[220px]">
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {payment.user?.firstName} {payment.user?.lastName}
                    </h3>
                    <p className="text-sm text-purple-500">
                      {payment.description || "Abonnement"}
                    </p>
                  </div>
                </div>
                <div className="flex-1 text-gray-600 text-sm lg:text-base">
                  <span className="font-medium">
                    {formatDate(payment.createdAt)}
                  </span>
                </div>
                <div className="text-gray-500 text-sm lg:text-base min-w-[160px] text-center">
                  {payment.provider?.businessName || "-"}
                </div>
                <div className="min-w-[100px] flex justify-center">
                  <Badge
                    status={payment.status}
                    variant={getStatusVariant(payment.status)}
                  />
                </div>
                <div className="font-semibold text-gray-800 text-sm lg:text-base min-w-[140px] text-right">
                  {formatAmount(payment.amount, payment.currency)}
                </div>
                <div className="min-w-[140px] text-right">
                  {payment.paymentUrl ? (
                    <a
                      href={payment.paymentUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                    >
                      Lien paiement
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
