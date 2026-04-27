import React, { useState, useRef, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "react-toastify";
import {
  MoreVertical,
  Image as ImageIcon,
  Plus,
  AlertCircle,
} from "lucide-react";
import { ActionMenu } from "../global/ActionMenu";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { Badge } from "../../ui/Badge";
import { NotFound } from "../global/NotFound";
import { Loader } from "../global/Loader";
import {
  useGetBanners,
  useDeleteBanner,
  useUpdateBanner,
} from "../../hooks/useBanner";

/**
 * UI component responsible for rendering the banner list section.
 */
export const BannerList = ({ onAddBanner, onEditBanner }) => {
  const { onActiveModal, closeConfirm } = useOutletContext();
  const [openMenuId, setOpenMenuId] = useState(null);
  const triggerRef = useRef(null);

  const { data: apiResponse, isLoading, isError, refetch } = useGetBanners();
  const banners = apiResponse?.data?.banners || apiResponse?.data || [];

  const {
    mutate: mutateDelete,
    isSuccess: isSuccessDelete,
    data: dataDelete,
    isError: isErrorDelete,
    error: errorDelete,
    reset: resetDelete,
  } = useDeleteBanner();
  const {
    mutate: mutateUpdate,
    isSuccess: isSuccessUpdate,
    data: dataUpdate,
    isError: isErrorUpdate,
    error: errorUpdate,
    reset: resetUpdate,
  } = useUpdateBanner();

  /**
   * Handles status change behavior.
   */
  const handleStatusChange = (banner) => {
    mutateUpdate({
      id: banner.id,
      formData: { isActive: !banner.isActive },
    });
  };

  /**
   * Handles delete click behavior.
   */
  const handleDeleteClick = (banner) => {
    onActiveModal(1, {
      title: "Supprimer la bannière ?",
      description: `Voulez-vous vraiment supprimer la bannière "${banner.title}" ? Cette action est irréversible.`,
      onConfirm: () => {
        mutateDelete({ id: banner.id });
      },
    });
  };

  useEffect(() => {
    if (isSuccessDelete && dataDelete?.success) {
      toast.success(dataDelete.message || "Bannière supprimée avec succès");
      refetch();
      if (closeConfirm) closeConfirm();
    }

    if (isSuccessUpdate && dataUpdate?.success) {
      toast.success(dataUpdate.message || "Bannière mise à jour avec succès");
      refetch();
    }

    if (isErrorDelete || isErrorUpdate) {
      const mainMessage = errorDelete?.message || errorUpdate?.message;
      toast.error(mainMessage);

      const backendErrors =
        errorDelete?.response?.errors || errorUpdate?.response?.errors;
      if (Array.isArray(backendErrors)) {
        backendErrors.forEach((err) => {
          toast.info(err.message);
        });
      }
    }

    resetDelete();
    resetUpdate();
  }, [
    isSuccessDelete,
    isErrorDelete,
    dataDelete,
    errorDelete,
    isSuccessUpdate,
    isErrorUpdate,
    dataUpdate,
    errorUpdate,
    refetch,
  ]);

  const getTypeLabel = (type) => {
    const types = {
      main_home: "Accueil principal",
      sidebar: "Barre latérale",
      featured: "Mise en avant",
      popup: "Popup",
    };
    return types[type] || type;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Non défini";
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) return <Loader variant="centered" message="Chargement..." />;

  return (
    <Card>
      <div className="flex justify-between mb-1">
        <div>
          <h1 className="text-xl text-gray-700 font-bold lg:pacifico-regular">
            Bannières
          </h1>
        </div>
        <Button
          variant="primary"
          onClick={onAddBanner}
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          Ajouter
        </Button>
      </div>
      {banners.length > 0 ? (
        <div className="mt-4 grid gap-4 grid-cols-1 xl:grid-cols-2">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="relative bg-white shadow-md border border-gray-200 overflow-hidden w-full h-[120px] md:h-[130px] rounded-lg flex group transition-all hover:shadow-lg"
            >
              <div className="absolute top-0 left-0 w-[4px] h-full bg-blue-900 z-10" />
              <div className="flex-1 flex flex-col justify-center px-4 md:px-8 bg-white overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">
                    Annonce • {banner.isActive ? "Actif" : "Inactif"}
                  </span>
                  <div className="relative">
                    <Button
                      ref={openMenuId === banner.id ? triggerRef : null}
                      onClick={() =>
                        setOpenMenuId(
                          openMenuId === banner.id ? null : banner.id
                        )
                      }
                      className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-all border-none"
                    >
                      <MoreVertical size={18} />
                    </Button>
                    <ActionMenu
                      isOpen={openMenuId === banner.id}
                      onClose={() => setOpenMenuId(null)}
                      triggerRef={triggerRef}
                      initialStatus={!banner.isActive}
                      onStatusChange={() => handleStatusChange(banner)}
                      onEdit={() => {
                        onEditBanner(banner);
                        setOpenMenuId(null);
                      }}
                      onDelete={() => handleDeleteClick(banner)}
                    />
                  </div>
                </div>
                <h2 className="text-gray-900 font-black text-sm md:text-lg leading-tight uppercase italic truncate">
                  {banner.title}
                </h2>
                <p className="text-gray-500 text-[11px] md:text-xs line-clamp-2 mt-1 max-w-[95%] font-medium">
                  {banner.description || "Aucune description disponible."}
                </p>
                <span className="text-[9px] text-gray-400 mt-2">
                  Créé le {new Date(banner.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div className="relative w-[35%] md:w-[30%] h-full overflow-hidden">
                {banner.imageUrl ? (
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <ImageIcon size={24} className="text-gray-300" />
                  </div>
                )}
                {banner.linkUrl && (
                  <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 z-20">
                    <button
                      onClick={() => banner.linkUrl && window.open(banner.linkUrl, '_blank')}
                      disabled={!banner.linkUrl}
                      className={`w-12 h-12 md:w-14 md:h-14 bg-white border-4 border-gray-50 rounded-full shadow-xl flex items-center justify-center group/btn hover:scale-110 transition-transform active:scale-95 ${!banner.linkUrl && 'opacity-50 cursor-not-allowed'}`}
                    >
                      <span className="text-blue-700 font-black text-[9px] md:text-[10px] uppercase tracking-tighter">
                        Click
                      </span>
                    </button>
                  </div>
                )}
              </div>
              <div className="absolute top-0 right-0 w-[4px] h-full bg-[#E85D26]" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <NotFound
          Icon={AlertCircle}
          title="Erreur de chargement"
          message="Impossible de récupérer la répartition des événements."
        />
      ) : (
        <NotFound
          Icon={ImageIcon}
          title="Aucune bannière"
          message="Il semble qu'aucune bannière n'ait été créée"
        />
      )}
    </Card>
  );
};
