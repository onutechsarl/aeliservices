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

  // On passe la currentPage au hook
  const { data: apiResponse, isLoading, isError, refetch } = useGetUsers(currentPage);

  // Les données sont maintenant déjà paginées par le serveur
  const users = apiResponse?.data?.users || [];
  const pagination = apiResponse?.data?.pagination;

  // On utilise les valeurs fournies par l'API au lieu de les calculer
  const totalPages = pagination?.totalPages || 1;

  const handleTabChange = (tab) => {
    setActifTabs(tab);
    setCurrentPage(1); // Retour à la page 1 lors du changement de filtre
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        <TabButton TABS={TABS} setActifTabs={handleTabChange} />
      </div>

      <UserTable
        // On passe directement la liste reçue (elle est déjà la "bonne" page)
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