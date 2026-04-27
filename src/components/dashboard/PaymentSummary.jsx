import React from "react";
import { Card } from "../../ui/Card";
import { CreditCard, TrendingUp, AlertCircle } from "lucide-react";
import { useStats } from "../../hooks/useStats";
import { Loader } from "../global/Loader";
import { NotFound } from "../global/NotFound";

/**
 * UI component responsible for rendering the payment summary section.
 */
export const PaymentSummary = () => {
  const { data: statsResponse, isLoading, isError } = useStats();

  const formatAmount = (amount) => {
    if (!amount) return "0 FCFA";
    return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA";
  };

  const payments = statsResponse?.data?.payments;

  const paymentStats = [
    { label: "Accepté", value: payments?.accepted || 0 },
    { label: "Attente", value: payments?.pending || 0 },
    { label: "Refusé", value: payments?.refused || 0 },
    { label: "Annulé", value: payments?.cancelled || 0 },
  ];

  return (
    <Card
      variant="green"
      noPadding={false}
      className="relative overflow-hidden"
    >
      {isLoading ? (
        <Loader
          variant="centered"
          message="Chargement du résumé des paiements..."
          className="py-16"
        />
      ) : isError ? (
        <NotFound
          Icon={AlertCircle}
          title="Erreur de chargement"
          message="Impossible de récupérer le résumé des paiements."
          className="h-full"
        />
      ) : (
        <>
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <TrendingUp size={100} />
          </div>

          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start mb-6">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-white/80" />
            </div>

            <div className="mb-6">
              <h2 className="text-3xl font-bold text-white mb-1">
                {formatAmount(payments?.totalAmount)}
              </h2>

              <p className="text-green-100 text-sm">
                Total de {payments?.total || 0} transactions
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              {paymentStats.map((item, index) => (
                <Card
                  variant="glass2"
                  noPadding={true}
                  key={index}
                  className="flex flex-col items-center py-2"
                >
                  <span className="text-xs font-bold block text-white">
                    {item.value}
                  </span>
                  <span className="text-[10px] text-white/80">
                    {item.label}
                  </span>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </Card>
  );
};
