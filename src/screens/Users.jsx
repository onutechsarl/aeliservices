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
  const itemsPerPage = 15;

  const { data: apiResponse, isLoading, isError, refetch } = useGetUsers();
  const allUsers = apiResponse?.data?.users || [];

  const getFilteredData = () => {
    switch (actifTabs) {
      case "Actifs":
        return allUsers.filter((user) => user.isActive === true);
      case "Bloquer":
        return allUsers.filter((user) => user.isActive === false);
      default:
        return allUsers;
    }
  };

  const fullFilteredData = getFilteredData();

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = fullFilteredData.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(fullFilteredData.length / itemsPerPage);

  /**
   * Handles tab change behavior.
   */
  const handleTabChange = (tab) => {
    setActifTabs(tab);
    setCurrentPage(1);
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-2">
        <TabButton TABS={TABS} setActifTabs={handleTabChange} />
      </div>
      <UserTable
        users={currentItems}
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
