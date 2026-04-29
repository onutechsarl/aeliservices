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
  const [actifTabs, setActifTabs] = useState("Actifs");
  const [currentPage, setCurrentPage] = useState(1);

  // 1. Appeler les hooks avec la page courante
  const { data: dataProvider } = useGetProviderList(currentPage, { search: filters?.search });
  const { data: allData } = useProviderApplications({ search: filters?.search, page: currentPage });
  const { data: pendingData } = useProviderPending({ search: filters?.search, page: currentPage });

  // 2. Déterminer quelle source utiliser
  const getActiveSource = () => {
    if (actifTabs === "Doc verification") return pendingData;
    if (actifTabs === "Attente") return allData;
    return dataProvider;
  };

  const activeResponse = getActiveSource();
  const items = activeResponse?.data?.providers || activeResponse?.data?.applications || [];

  // 3. Utiliser les données de pagination envoyées par l'API (LA SOURCE DE VÉRITÉ)
  const pagination = activeResponse?.data?.pagination;
  const totalPages = pagination?.totalPages || 1;

  return (
    <>
      <ProviderTable
        applications={items} // Plus de .slice() ici !
      // ... reste de vos props
      />

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
        />
      )}
    </>
  );
}