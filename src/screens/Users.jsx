import React, { useState } from "react";
import { ToastContainer } from "react-toastify";
import { Pagination } from "../components/global/Pagination";
import { UserTable } from "../components/user/UserTable";
import { TabButton } from "../components/global/TabButton";
import { useGetUsers } from "../hooks/useUser";

/**
 * UI component responsible for rendering the users section.
 */
export function Users() {
  const TABS = ["Tout", "Actifs", "Bloquer"];
  const [actifTabs, setActifTabs] = useState("Tout");
  const [currentPage, setCurrentPage] = useState(1);

  // On passe maintenant la page ET le statut (le filtre) au hook
  const { data: apiResponse, isLoading, isError, refetch } = useGetUsers(currentPage, actifTabs);

  const users = apiResponse?.data?.users || [];
  const pagination = apiResponse?.data?.pagination;
  const totalPages = pagination?.totalPages || 1;

  const handleTabChange = (tab) => {
    setActifTabs(tab);
    setCurrentPage(1); // Très important : on reset la page à 1 quand on change de filtre
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        {/* Vérifiez que TabButton utilise bien la prop actifTabs pour le style visuel */}
        <TabButton TABS={TABS} actifTabs={actifTabs} setActifTabs={handleTabChange} />
      </div>

      <UserTable
        users={users}
        isLoading={isLoading}
        refetch={refetch}
        actifTabs={actifTabs}
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
      <ToastContainer position="bottom-center" />
    </>
  );
}