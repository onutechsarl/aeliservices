import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { toast } from "react-toastify";
import { ProductCard } from '../../ui/productCard';
import { Button, CategoryTag } from '../../ui/Button';
import { MoreVerticalIcon, Star, MapPin, ShoppingBag, AlertCircle, ChevronRight, MoreVertical } from 'lucide-react';
import { ActionMenu } from '../global/ActionMenu';
import { NotFound } from '../global/Notfound';
import { Pagination } from '../global/Pagination';
import { ReviewList } from './ReviewList';
import { useInfoUserConnected } from '../../hooks/useUser';
import { useGetServicesByProvider, useDeleteServices } from '../../hooks/useServices';
import { useGetProviderByid } from '../../hooks/useProvider';
import { Loading } from '../global/Loading';

/**
 * UI component responsible for rendering service provider.
 */
export function ServiceProvider({ mode, dataConsult }) {
    const navigate = useNavigate();
    const [openMenuId, setOpenMenuId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const triggerRef = useRef(null);
    const { openContact, openFeedback, openConfirm, setConfirmConfig, closeModal2, setDataContact } = useOutletContext();
    const [rating, setRating] = useState(5);
    const [customerContact, SetcustomerContact] = useState(false);

    const { data: userData } = useInfoUserConnected();
    const provider = userData?.data?.provider;

    const { data: providerResponse, isLoading: isLoadingProvider, isError: isErrorProvider } = useGetProviderByid(dataConsult?.id);
    const providerDetail = providerResponse?.data?.provider;

    const { data: servicesData, isLoading: isLoadingServices, isError: isErrorServices, refetch: refetchService } = useGetServicesByProvider(provider?.id);

    const apiCategories = useMemo(() => {
        if (mode === "consultationCustomers") {
            if (!providerDetail?.services) return [];

            const categoriesMap = providerDetail.services.reduce((acc, service) => {
                const cat = service.category;
                if (!cat) return acc;

                if (!acc[cat.id]) {
                    acc[cat.id] = {
                        id: cat.id,
                        name: cat.name,
                        slug: cat.slug,
                        services: []
                    };
                }
                acc[cat.id].services.push(service);
                return acc;
            }, {});

            return Object.values(categoriesMap);
        }

        return servicesData?.data?.categories || [];
    }, [mode, providerDetail, servicesData]);

    const { mutate: mutateDeleteService, isPending: isPendingDeleteService, isSuccess: isSuccessDeleteService, isError: isErrorDeleteService, data: dataDeleteService, error: errorDeleteService } = useDeleteServices();

    const [activeCatId, setActiveCatId] = useState(null);

    useEffect(() => {
        if (apiCategories.length > 0 && !activeCatId) {
            setActiveCatId(apiCategories[0].id);
        }
    }, [apiCategories, activeCatId]);

    const currentCategory = apiCategories.find(c => c.id === activeCatId);
    const currentServices = currentCategory?.services || [];
    const itemsPerPage = 8;
    const totalPages = Math.ceil(currentServices.length / itemsPerPage);
    const paginatedServices = currentServices.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [activeCatId, mode]);

    /**
     * Handles handle delete click behavior.
     */
    const handleDeleteClick = (service) => {
        setOpenMenuId(null);
        setConfirmConfig({
            onConfirm: () => mutateDeleteService({ id: service.id }),
            isPending: false,
            title: `Supprimer le service "${service.name}" ?`,
            description: "Cette action est irréversible. Le service sera définitivement supprimé."
        });
        openConfirm();
    };

    /**
     * Handles open contact with data behavior.
     */
    const openContactWithData = (provider, service) => {
        setDataContact({
            ...provider,
            selectedService: service // Ici service contient : name, price, description, etc.
        });
        openContact();
    }

    useEffect(() => {
        setConfirmConfig(prev => ({ ...prev, isPending: isPendingDeleteService }));
    }, [isPendingDeleteService, setConfirmConfig]);

    useEffect(() => {
        if (isSuccessDeleteService && dataDeleteService?.success) {
            toast.success(dataDeleteService.message);
            closeModal2();
            refetchService();
        }
    }, [isSuccessDeleteService, dataDeleteService, closeModal2, refetchService]);

    useEffect(() => {
        if (providerDetail?.averageRating) {
            setRating(Math.round(parseFloat(providerDetail.averageRating)));
        }
    }, [providerDetail]);

    const isComponentLoading = mode === "consultationCustomers" ? isLoadingProvider : isLoadingServices;
    const isComponentError = mode === "consultationCustomers" ? isErrorProvider : isErrorServices;


    if (isComponentError) {
        return (
            <NotFound
                Icon={AlertCircle}
                title="Erreur de chargement"
                message="Une erreur est survenue lors de la récupération des services."
                className="bg-gray-100 h-[300px] flex-1"
            />
        );
    }

    return (
        <>
            {mode === "consultationCustomers" && (
                <div>
                    <div className="flex flex-col md:flex-row gap-5 mb-10 md:mb-8">
                        <div className="w-32 h-32 rounded-full border-4 border-pink-200 flex relative mb-4">
                            <div className="w-full h-full rounded-full overflow-hidden no-scrollbar">
                                <img
                                    src={providerDetail?.profilePhoto || `./defaultstructure.jpg`}
                                    alt="Stats"
                                    className="w-full h-full object-cover opacity-80"
                                />
                            </div>
                            <div className="absolute inset-0 border-t-4 border-purple-500 rounded-full rotate-45" />
                        </div>
                        <div className='md:max-w-2/4'>
                            <h4 className="font-bold text-[25px] text-gray-800">
                                {providerDetail?.businessName || dataConsult?.name}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1 ">
                                {providerDetail?.description || "Franchir la porte de notre institut, c'est s'offrir une parenthèse enchantée..."}
                            </p>
                            <p className="flex gap-2 items-center text-xs text-gray-500 mt-1 mt-4 mb-4">
                                <svg height="22" width="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
                                        <path d="M10.08 2C5.47 2.936 2 7.012 2 11.899C2 17.478 6.522 22 12.101 22c4.887 0 8.963-3.47 9.899-8.08" />
                                        <path d="M18.938 18A3.8 3.8 0 0 0 20 17.603m-5.312-.262q.895.39 1.717.58m-5.55-2.973c.413.29.855.638 1.285.938M3 13.826c.322-.157.67-.338 1.063-.493M6.45 13c.562.062 1.192.223 1.906.523M18.5 7a1.5 1.5 0 1 0-3 0a1.5 1.5 0 0 0 3 0" />
                                        <path d="M17 2c2.706 0 5 2.218 5 4.91c0 2.733-2.331 4.652-4.485 5.956a1.06 1.06 0 0 1-1.03 0C14.335 11.55 12 9.653 12 6.91C12 4.22 14.294 2 17 2" />
                                    </g>
                                </svg>
                                {providerDetail?.location || dataConsult?.location}
                            </p>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {(providerDetail?.activities || dataConsult?.activities)?.map((act) => (
                                    <span
                                        key={act}
                                        className="inline-flex items-center gap-1 px-3 py-1 bg-[#E8524D]/10 text-[#E8524D] text-sm font-medium rounded-full border border-[#E8524D]/20 animate-in zoom-in duration-200"
                                    >
                                        {act}
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-4 mt-2 items-center">
                                <Button
                                    variant="gradient"
                                    size="md"
                                    onClick={() => openContactWithData(providerDetail, null)}
                                >
                                    contacter
                                </Button>
                                <Button
                                    variant="softRed"
                                    size="md"
                                    onClick={() => openFeedback(providerDetail)}
                                    className={`${customerContact && "bg-gray-300 hover:bg-gray-300 hover:text-white"}`}
                                >
                                    noter
                                </Button>
                                <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            size={14}
                                            className={`${i < rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {isLoadingProvider ? (
                <Loading className="h-64 mb-50" size="small" title="Chargement des services..." />
            ) : (
                <ReviewList idProvider={providerDetail?.id || provider?.id} />
            )}
            {isLoadingServices ? (
                <Loading className="h-64 mt-30" size="small" title="Chargement des services..." />
            ) : (
                <>
                    <div className="flex overflow-x-auto no-scrollbar items-center gap-4 mb-10">
                        {apiCategories.map((cat) => (
                            <React.Fragment key={cat.id}>
                                <div className="relative">
                                    <CategoryTag
                                        cat={{ ...cat, active: cat.id === activeCatId }}
                                        isConsult={mode === "consultationCustomers" || true}
                                        onSelect={() => setActiveCatId(cat.id)}
                                        onPressMenu={() => setOpenMenuId(openMenuId === cat.id ? null : cat.id)}
                                        ref={openMenuId === cat.id ? triggerRef : null}
                                    />
                                    {mode !== "consultationCustomers" && (
                                        <ActionMenu
                                            isOpen={openMenuId === cat.id}
                                            onClose={() => setOpenMenuId(null)}
                                            triggerRef={triggerRef}
                                            onEdit={() => navigate(`/edit-category/${cat.id}`)}
                                            onDelete={() => console.log("Supprimer", cat.id)}
                                        />
                                    )}
                                </div>
                            </React.Fragment>
                        ))}
                    </div>

                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <ShoppingBag className="text-[#E8524D]" size={20} />
                            {currentCategory?.name || "Sélectionnez une catégorie"}
                        </h2>
                        {mode !== "consultationCustomers" && (
                            <Button variant="gradient" size="md" onClick={() => navigate("/add-service")}>
                                Ajouter un service
                            </Button>
                        )}
                    </div>


                    {/* Conteneur principal modifié : passage de grid à columns pour l'effet puzzle */}
                    <div className={`gap-6 mb-20 md:mb-4 ${currentServices.length > 0
                            ? `columns-1 ${mode === "consultationCustomers" ? "sm:columns-2 lg:columns-3 xl:columns-4" : "sm:columns-2 lg:columns-3"}`
                            : "flex"
                        }`}>
                        {currentServices.length > 0 ? (
                            paginatedServices.map((service) => (
                                /* Wrapper indispensable pour l'effet puzzle (Masonry) : 
                                   break-inside-avoid empêche une carte de se couper entre deux colonnes */
                                <div key={service.id} className="break-inside-avoid mb-6">
                                    <ProductCard
                                        title={service.name}
                                        description={service.description}
                                        price={service.price}
                                        image={service.photo}
                                        createdAt={service?.duration}
                                        isAdmin={mode !== "consultationCustomers"}
                                        actions={mode === "consultationCustomers"
                                            ? [
                                                <button
                                                    key="contact"
                                                    onClick={() => openContactWithData(providerDetail, service)}
                                                    className="flex items-center gap-2 bg-gradient-to-r from-[#E8524D] to-[#FCE0D6] text-white px-6 py-2.5 rounded-[12px] font-bold text-[14px] transition-all active:scale-95 shadow-lg group/btn"
                                                >
                                                    <span className="font-semibold text-[14px]">
                                                        Contacter
                                                    </span>
                                                    <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                                                </button>
                                            ]
                                            : [
                                                <Button
                                                    key="trigger"
                                                    variant="none"
                                                    size="none"
                                                    ref={openMenuId === service.id ? triggerRef : null}
                                                    onClick={() => setOpenMenuId(openMenuId === service.id ? null : service.id)}
                                                    className="text-black"
                                                >
                                                    <MoreVerticalIcon size={20} />
                                                </Button>,
                                                <ActionMenu
                                                    key="menu"
                                                    isOpen={openMenuId === service.id}
                                                    onClose={() => setOpenMenuId(null)}
                                                    triggerRef={triggerRef}
                                                    onEdit={() => navigate(`/add-service`, { state: { data: service } })}
                                                    onDelete={() => handleDeleteClick(service)}
                                                />
                                            ]
                                        }
                                    />
                                </div>
                            ))
                        ) : (
                            <NotFound
                                Icon={ShoppingBag}
                                title="Aucun service trouvé"
                                message="Aucun service disponible dans cette catégorie."
                                className="bg-gray-100 h-[300px] flex-1 mb-4"
                            />
                        )}
                    </div>
                </>
            )}

            {currentServices.length > 0 &&
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            }
        </>
    )
}
