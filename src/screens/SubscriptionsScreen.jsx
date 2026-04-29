import React, { useState } from "react";
import { Pagination } from "../components/global/Pagination";
import { TabButton } from "../components/global/TabButton";
import { SubscriptionList } from "../components/Subscription/SubscriptionList";
import { usePayments } from "../hooks/useSubscription";

// Mapping pour traduire vos tabs en paramètres API
const STATUS_MAP = {
  "Paiement": "PAID,SUCCESS,COMPLETED,ACCEPTED",
  "Attente": "PENDING,WAITING",
  "Revoque": "REVOKED,CANCELLED,CANCELED,FAILED"
};

export function SubscriptionsScreen() {
  const TABS = ["Paiement", "Attente", "Revoque"]; // Note: "Gratuit" demande un filtre backend spécial
  const [actifTabs, setActifTabs] = useState(TABS[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Appel API avec pagination et filtre
  const { data: paymentsResponse, isLoading, isError } = usePayments(
    currentPage,
    itemsPerPage,
    STATUS_MAP[actifTabs] || ""
  );

  const payments = paymentsResponse?.data?.payments || [];
  const pagination = paymentsResponse?.data?.pagination;

  const handleTabChange = (tab) => {
    setActifTabs(tab);
    setCurrentPage(1); // Reset à la page 1 à chaque changement d'onglet
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        <TabButton TABS={TABS} setActifTabs={handleTabChange} />
      </div>

      <SubscriptionList
        payments={payments} // Données déjà filtrées par le serveur
        isLoading={isLoading}
        isError={isError}
      />

      {/* Pagination basée sur les infos du serveur */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}
    </div>
  );
}