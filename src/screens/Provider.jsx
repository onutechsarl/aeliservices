import React, { useState, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import { useOutletContext } from "react-router-dom";
import { Pagination } from "../components/global/Pagination";
import { ProviderTable } from "../components/provider/ProviderTable";
import { TabButton } from "../components/global/TabButton";
import {
  useProviderApplications,
  useProviderPending,
  useGetProviderList,
} from "../hooks/useProvider";

/**
 * UI component responsible for rendering the provider section.
 */
export function Provider() {
  const { filters } = useOutletContext();

  const TABS = ["Actifs", "Attente", "Doc verification", "Bloquer"];
  const [actifTabs, setActifTabs] = useState("Actifs");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const {
    data: dataProvider,
    isLoading: loadingProvider,
    isError: isErrorProvider,
    refetch: refetchProvider,
  } = useGetProviderList();
  const {
    data: allData,
    isLoading: loadingAll,
    isError: isErrorAll,
    refetch,
  } = useProviderApplications({ search: filters?.search });
  const {
    data: pendingData,
    isLoading: loadingPending,
    isError: isErrorPending,
    refetch: refetchPending,
  } = useProviderPending({ search: filters?.search });

  const getFilteredData = () => {
    if (actifTabs === "Doc verification") {
      return pendingData?.data?.providers || [];
    }

    const allApps = allData?.data?.applications || [];
    const providerList =
      dataProvider?.data?.providers || dataProvider?.data || [];

    switch (actifTabs) {
      case "Actifs":
        return providerList.filter((app) => app.isActive === true);
      case "Bloquer":
        return providerList.filter((app) => app.isActive === false);
      case "Attente":
        return allApps.filter((app) => app.status === "pending");
      default:
        return allApps;
    }
  };

  const fullFilteredData = getFilteredData();

  const totalItems = fullFilteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = fullFilteredData.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [actifTabs, filters?.search]);

  /**
   * Handles tab change behavior.
   */
  const handleTabChange = (tab) => {
    setActifTabs(tab);
  };

  return (
    <>
      <div className="flex mb-6 flex-wrap gap-2">
        <TabButton TABS={TABS} setActifTabs={handleTabChange} />
      </div>

      <ProviderTable
        applications={currentItems}
        isLoading={
          actifTabs === "Doc verification"
            ? loadingPending
            : actifTabs === "Actifs" || actifTabs === "Bloquer"
              ? loadingProvider
              : loadingAll
        }
        isError={
          actifTabs === "Doc verification"
            ? isErrorPending
            : actifTabs === "Actifs" || actifTabs === "Bloquer"
              ? isErrorProvider
              : isErrorAll
        }
        actifTabs={actifTabs}
        refetch={
          actifTabs === "Actifs" || actifTabs === "Bloquer"
            ? refetchProvider
            : refetch
        }
        refetchPending={refetchPending}
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

      <ToastContainer position="bottom-center" />
    </>
  );
}
