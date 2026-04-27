import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/global/Sidebar';
import { Header } from '../components/global/header';
import { BottomTab } from '../components/global/BottomTab';
import { Messagecustomer } from '../components/modal/Messagecustomer';
import { ContactCustomer } from '../components/modal/ContactCustomer';
import { FeedbackCard } from '../components/modal/FeedbackCard';
import { FavoriteList } from '../components/modal/FavoriteList';
import { ManageDocument } from '../components/modal/ManageDocument';

import { Confirmation } from '../components/modal/Confirmation';
import { ProviderMessaging } from '../components/modal/ProviderMessaging/ProviderMessaging';
import { Banner } from '../components/modal/Banner';
import { useGlobalLoading } from '../context/GlobalLoadingContext';

/**
 * UI component responsible for rendering base.
 */
export function Base() {
    const MODALS = { NONE: 0, MESSAGE: 1, FEEDBACK: 2, CONTACT: 3, FAVORITE: 4, REVIEW: 5, MESSAGING: 6, CONFIRM: 7, BANNER: 8, MANAGE_DOCUMENT: 9 };
    const [activeModal, setActiveModal] = useState(null);
    const [activeModal2, setActiveModal2] = useState(8); // Par défaut, le banner est actif
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // État pour le burger
    const [openSidebar, isOpenSidebar] = useState(false);
    const [providerShowStats, setProviderShowStats] = useState(false);
    const { isLoading } = useGlobalLoading();
    const [confirmConfig, setConfirmConfig] = useState({ onConfirm: () => { }, isPending: false, title: "", description: "" });
    const [dataProviderToRate, setDataProviderToRate] = useState(null);
    const [filters, setFilters] = useState({
        search: "",
        maxPrice: "",
        minRating: "",
        categoryId: ""
    });
    const [dataContact, setDataContact] = useState(null);
    const closeModal = () => setActiveModal(MODALS.NONE);
    const closeModal2 = () => setActiveModal2(MODALS.NONE);

    return (
        <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] min-h-screen bg-[#FAFAFB] font-sans text-slate-900 relative">
            <aside className="block">
                <Sidebar
                    isOpenSidebar={isOpenSidebar}
                    showStats={providerShowStats}
                    onOpenMessage={() => { setActiveModal(MODALS.MESSAGE); setIsSidebarOpen(false); }}
                    onOpenFavorite={() => { setActiveModal(MODALS.FAVORITE); setIsSidebarOpen(false); }}
                    onOpenReview={() => { setActiveModal(MODALS.REVIEW); setIsSidebarOpen(false); }}
                    activeModal={activeModal}
                    MODALS={MODALS}
                    isOpen={isSidebarOpen} // Prop pour l'ouverture mobile
                    onClose={() => setIsSidebarOpen(false)} // Prop pour fermer
                    closeModal={closeModal}
                    isLoading={isLoading}
                    filters={filters}
                    setFilters={setFilters}
                />
            </aside>
            <main className="relative h-screen overflow-y-auto pb-20 md:pb-0">
                <div className="flex flex-col relative mx-auto ">
                    <div className="p-4 md:p-8 lg:p-10">

                        <Header
                            onOpenMenu={() => setIsSidebarOpen(true)}
                            openSidebar={openSidebar}
                            setFilters={setFilters}
                            filters={filters}
                        />
                        {activeModal2 === MODALS.BANNER && (
                            <Banner closeBanner={closeModal2} />
                        )}
                        <div className="mt-6 ">
                            <Outlet context={{
                                filters,
                                setFilters,
                                setConfirmConfig,
                                setDataContact,
                                openContact: () => setActiveModal2(MODALS.CONTACT),
                                openConfirm: () => setActiveModal2(MODALS.CONFIRM),
                                openFeedback: () => setActiveModal(MODALS.FEEDBACK),
                                openMessaging: () => setActiveModal(MODALS.MESSAGING),
                                openManageDocuments: () => setActiveModal(MODALS.MANAGE_DOCUMENT),
                                closeModal2: () => setActiveModal2(MODALS.NONE),
                                openSidebar: openSidebar,
                                providerShowStats,
                                setProviderShowStats,
                                openFeedback: (data) => {
                                    setDataProviderToRate(data); // Stocke les données quand on ouvre
                                    setActiveModal(MODALS.FEEDBACK);
                                },

                            }} />
                        </div>
                    </div>
                    {activeModal === MODALS.MESSAGE && (
                        <Messagecustomer
                            closeMessage={closeModal}
                            onConfirmation={() => setActiveModal2(MODALS.CONFIRM)}
                        />
                    )}
                    {activeModal === MODALS.FEEDBACK && (
                        <FeedbackCard
                            closeFeedback={closeModal}
                            providerData={dataProviderToRate}
                        />
                    )}
                    {activeModal === MODALS.FAVORITE && (
                        <FavoriteList
                            closeFavorite={closeModal}
                            onContact={() => setActiveModal2(MODALS.CONTACT)}
                        />
                    )}
                    { }
                    {activeModal === MODALS.MESSAGING && (
                        <ProviderMessaging closeMessaging={closeModal} />
                    )}
                    {activeModal === MODALS.MANAGE_DOCUMENT && (
                        <ManageDocument
                            closeManageDocument={closeModal}
                            openConfirm={() => setActiveModal2(MODALS.CONFIRM)}
                            setConfirmConfig={setConfirmConfig}
                            closeModal2={closeModal2}
                        />
                    )}
                </div>
            </main>
            <BottomTab
                onOpenMessage={() => setActiveModal(MODALS.MESSAGE)}
                onOpenFavorite={() => setActiveModal(MODALS.FAVORITE)}
                activeModal={activeModal}
                MODALS={MODALS}
                closeModal={closeModal}
                isLoading={isLoading}
            />
            {activeModal2 === MODALS.CONTACT && (
                <ContactCustomer
                    closeContact={closeModal2}
                    dataContact={dataContact}
                />
            )}
            {activeModal2 === MODALS.CONFIRM && (
                <Confirmation
                    closeConfirm={closeModal2}
                    onConfirm={confirmConfig.onConfirm}
                    isPending={confirmConfig.isPending}
                    title={confirmConfig.title}
                    description={confirmConfig.description}
                />
            )}

        </div>
    )
}
