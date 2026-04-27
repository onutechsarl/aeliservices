import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/global/Sidebar";
import { Header } from "../components/global/Header";
import { Confirmation } from "../components/modal/Confirmation";
import { BanIp } from "../components/modal/BanIp";
import { ViewInfoProvider } from "../components/modal/ViewInfoProvider";
import { VerifyDocumentProvider } from "../components/modal/VerifyDocumentProvider";

const MODALS = {
  CONFIRM: 1,
  RECOVERY: 2,
  VIEWINFOPROVIDER: 3,
  VERIFYDOCUMENTSPROVIDER: 4,
  BANIP: 5,
};

/**
 * UI component responsible for rendering the base section.
 */
export function Base() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const closeModal = () => setActiveModal(MODALS.NONE);
  const [filters, setFilters] = useState({
    search: "",
  });

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900 relative">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden ">
        <div className="absolute top-[10%] -left-[5%] w-[350px] h-[350px] bg-purple-500/30 rounded-full blur-[100px]" />
        <div className="absolute top-[5%] -right-[5%] w-[400px] h-[400px] bg-yellow-200/40 rounded-full blur-[110px]" />
        <div className="absolute bottom-[20%] left-[30%] w-[300px] h-[300px] bg-blue-100/60 rounded-full blur-[90px]" />
      </div>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          setFilters={setFilters}
          filters={filters}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto  lg:p-8">
            <Outlet
              context={{
                filters,
                setFilters,
                onActiveModal: (type, config = {}) =>
                  setActiveModal({ type, ...config }),
                closeConfirm: closeModal,
              }}
            />
          </div>
        </div>
      </main>

      {activeModal?.type === MODALS.CONFIRM && (
        <Confirmation
          closeConfirm={closeModal}
          title={activeModal.title}
          description={activeModal.description}
          isPending={activeModal.isPending}
          onConfirm={() => {
            if (activeModal.onConfirm) activeModal.onConfirm();
          }}
        />
      )}

      {activeModal?.type === MODALS.VIEWINFOPROVIDER && (
        <ViewInfoProvider
          closeView={closeModal}
          providerData={activeModal.data}
        />
      )}

      {activeModal?.type === MODALS.VERIFYDOCUMENTSPROVIDER && (
        <VerifyDocumentProvider
          closeView={closeModal}
          providerData={activeModal.data}
        />
      )}

      {activeModal?.type === MODALS.BANIP && (
        <BanIp
          closeView={closeModal}
          defaultIp={activeModal?.data?.ipAddress || ""}
        />
      )}
    </div>
  );
}
