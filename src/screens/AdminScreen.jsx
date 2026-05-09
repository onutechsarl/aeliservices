import React, { useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import { useOutletContext } from "react-router-dom";
import {
  useGetAdmins,
  useCreateAdmin,
  usePromoteAdmin,
  useDemoteAdmin,
} from "../hooks/useAdmin";
import { AdminCreateForm } from "../components/admin/AdminCreateForm";
import { AdminTable } from "../components/admin/AdminTable";

/**
 * Écran de gestion des administrateurs.
 */
export function AdminScreen() {
  const { onActiveModal, closeConfirm } = useOutletContext();

  const { data, isLoading, isError, refetch } = useGetAdmins();
  const admins = data?.data?.admins || data?.data || [];

  const {
    mutate: createAdmin,
    isPending: isCreating,
    isSuccess: isCreateSuccess,
    data: createData,
    isError: isCreateError,
    error: createError,
    reset: resetCreate,
  } = useCreateAdmin();

  const {
    mutate: promoteAdmin,
    isPending: isPromoting,
    isSuccess: isPromoteSuccess,
    data: promoteData,
    isError: isPromoteError,
    error: promoteError,
    reset: resetPromote,
  } = usePromoteAdmin();

  const {
    mutate: demoteAdmin,
    isPending: isDemoting,
    isSuccess: isDemoteSuccess,
    data: demoteData,
    isError: isDemoteError,
    error: demoteError,
    reset: resetDemote,
  } = useDemoteAdmin();

  const handleCreateAdmin = (formData, onDone) => {
    createAdmin(formData, {
      onSuccess: () => onDone?.(),
    });
  };

  const handlePromoteAdmin = (id, onDone) => {
    promoteAdmin(
      { id },
      {
        onSuccess: () => onDone?.(),
      }
    );
  };

  const handleDemoteAdmin = (admin) => {
    onActiveModal(1, {
      title: "Rétrograder cet administrateur ?",
      description:
        "Cette action retire les droits administrateur à cet utilisateur. Les garde-fous serveur empêcheront toute rétrogradation invalide.",
      isPending: isDemoting,
      onConfirm: () => {
        demoteAdmin({ id: admin.id }, { onSuccess: () => closeConfirm() });
      },
    });
  };

  useEffect(() => {
    if (isCreateSuccess) {
      toast.success(createData?.message || "Administrateur créé avec succès.");
      refetch();
    }

    if (isPromoteSuccess) {
      toast.success(promoteData?.message || "Utilisateur promu administrateur.");
      refetch();
    }

    if (isDemoteSuccess) {
      toast.success(demoteData?.message || "Administrateur rétrogradé avec succès.");
      refetch();
    }

    if (isCreateError || isPromoteError || isDemoteError) {
      const message =
        createError?.message || promoteError?.message || demoteError?.message || "Une erreur est survenue.";
      toast.error(message);
    }

    resetCreate();
    resetPromote();
    resetDemote();
  }, [
    isCreateSuccess,
    createData,
    isPromoteSuccess,
    promoteData,
    isDemoteSuccess,
    demoteData,
    isCreateError,
    isPromoteError,
    isDemoteError,
    createError,
    promoteError,
    demoteError,
    refetch,
  ]);

  return (
    <>
      <AdminCreateForm
        onCreateAdmin={handleCreateAdmin}
        onPromoteAdmin={handlePromoteAdmin}
        isCreating={isCreating}
        isPromoting={isPromoting}
      />

      <AdminTable
        admins={admins}
        isLoading={isLoading}
        isError={isError}
        isDemoting={isDemoting}
        onDemote={handleDemoteAdmin}
      />

      <ToastContainer position="bottom-center" />
    </>
  );
}

