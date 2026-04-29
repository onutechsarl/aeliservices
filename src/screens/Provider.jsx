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

export function Provider() {
  const { filters } = useOutletContext();

  const TABS = ["Actifs", "Attente", "Doc verification", "Bloquer"];
  const [actifTabs, setActifTabs] = useState("Actifs");
  const [currentPage, setCurrentPage] = useState(1);

  // 1. On définit les filtres à envoyer au serveur selon l'onglet
  const providerParams = {
    search: filters?.search,
  };

  // Si on est sur l'onglet Actifs ou Bloquer, on ajoute le filtre isActive
  if (actifTabs === "Actifs") providerParams.isActive = "true";
  if (actifTabs === "Bloquer") providerParams.isActive = "false";

  // 2. Appels API
  const {
    data: dataProvider,
    isLoading: loadingProvider,
    isError: isErrorProvider,
    refetch: refetchProvider,
  } = useGetProviderList(currentPage, providerParams);

  const {
    data: allData,
    isLoading: loadingAll,
    isError: isErrorAll,
    refetch,
  } = useProviderApplications(currentPage, { search: filters?.search });

  const {
    data: pendingData,
    isLoading: loadingPending,
    isError: isErrorPending,
    refetch: refetchPending,
  } = useProviderPending(currentPage, { search: filters?.search });

  // 3. Logique de récupération des données filtrées
  const getActiveData = () => {
    if (actifTabs === "Doc verification") {
      return pendingData?.data?.providers || [];
    }

    if (actifTabs === "Attente") {
      const allApps = allData?.data?.applications || [];
      return allApps.filter((app) => app.status === "pending");
    }

    // Pour "Actifs" et "Bloquer", le serveur a déjà fait le travail
    return dataProvider?.data?.providers || dataProvider?.data || [];
  };

  const currentItems = getActiveData();

  // 4. Récupération de la pagination serveur
  const activeResponse =
    actifTabs === "Doc verification" ? pendingData :
      (actifTabs === "Attente" ? allData : dataProvider);

  const totalPages = activeResponse?.data?.pagination?.totalPages || 1;

  // Reset de la page quand on change d'onglet ou de recherche
  useEffect(() => {
    setCurrentPage(1);
  }, [actifTabs, filters?.search]);

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
          actifTabs === "Doc verification" ? loadingPending :
            (actifTabs === "Actifs" || actifTabs === "Bloquer") ? loadingProvider : loadingAll
        }
        isError={
          actifTabs === "Doc verification" ? isErrorPending :
            (actifTabs === "Actifs" || actifTabs === "Bloquer") ? isErrorProvider : isErrorAll
        }
        actifTabs={actifTabs}
        refetch={(actifTabs === "Actifs" || actifTabs === "Bloquer") ? refetchProvider : refetch}
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