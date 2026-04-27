import React, { useMemo, useState } from "react";
import { Pagination } from "../components/global/Pagination";
import { TabButton } from "../components/global/TabButton";
import { SubscriptionList } from "../components/Subscription/SubscriptionList";
import { usePayments } from "../hooks/useSubscription";

/**
 * UI component responsible for rendering the subscriptions screen section.
 */
export function SubscriptionsScreen() {
  const TABS = ["Paiement", "Attente", "Revoque"];
  const [actifTabs, setActifTabs] = useState(TABS[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: paymentsResponse, isLoading, isError } = usePayments();
  const payments = paymentsResponse?.data?.payments || [];

  const filteredPayments = useMemo(() => {
    switch (actifTabs) {
      case "Paiement":
        return payments.filter((payment) =>
          ["PAID", "SUCCESS", "COMPLETED", "ACCEPTED"].includes(
            (payment.status || "").toUpperCase(),
          ),
        );
      case "Attente":
        return payments.filter((payment) =>
          ["PENDING", "WAITING"].includes(
            (payment.status || "").toUpperCase(),
          ),
        );
      case "Revoque":
        return payments.filter((payment) =>
          ["REVOKED", "CANCELLED", "CANCELED", "FAILED"].includes(
            (payment.status || "").toUpperCase(),
          ),
        );
      case "Gratuit":
        return payments.filter((payment) =>
          Number(payment.amount) === 0 ||
          (payment.currency && payment.currency.toUpperCase() === "FREE"),
        );
      default:
        return payments;
    }
  }, [actifTabs, payments]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPayments.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

  const handleTabChange = (tab) => {
    setActifTabs(tab);
    setCurrentPage(1);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        <TabButton TABS={TABS} setActifTabs={handleTabChange} />
      </div>
      <SubscriptionList
        payments={currentItems}
        isLoading={isLoading}
        isError={isError}
      />
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      )}
    </div>
  );
}
