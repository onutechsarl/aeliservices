import React, { useState, useRef, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "react-toastify";
import {
  MoreVertical,
  Upload,
  ShieldCheck,
  Users,
  AlertCircle,
} from "lucide-react";
import { ActionMenu } from "../global/ActionMenu";
import { Table } from "../../ui/Table";
import { Badge } from "../../ui/Badge";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { NotFound } from "../global/NotFound";
import { Loader, ButtonLoader } from "../global/Loader";
import { useDeactivateAccount } from "../../hooks/useUser";
import { useExportUsers } from "../../hooks/useExport";

/**
 * UI component responsible for rendering the user table section.
 */
export const UserTable = ({
  users,
  isLoading,
  refetch,
  actifTabs,
  isError,
}) => {
  const headers = [
    "Utilisateur",
    "Rôle",
    "Genre",
    "Contact",
    "Localisation",
    "Vérifié",
    "Dernière Connexion",
    "Status",
    "Actions",
  ];

  const { onActiveModal } = useOutletContext();
  const [openMenuId, setOpenMenuId] = useState(null);
  const triggerRef = useRef(null);

  const {
    mutate: mutateDesactivate,
    isSuccess,
    data: dataDesactivate,
    isError: isErrorDesactivate,
    error,
    reset,
  } = useDeactivateAccount();
  const {
    mutate: mutateExport,
    isPending: isPendingExport,
    isSuccess: isSuccessExport,
    data: dataExport,
    isError: isErrorExport,
    error: errorExport,
    reset: resetExport,
  } = useExportUsers();

  /**
   * Handles status change behavior.
   */
  const handleStatusChange = (user) => {
    mutateDesactivate({
      id: user.id,
      formData: { isActive: !user.isActive },
    });
  };

  /**
   * Handles export behavior.
   */
  const handleExport = () => {
    mutateExport();
  };

  useEffect(() => {
    if (isSuccess && dataDesactivate?.success) {
      toast.success(dataDesactivate.message);
      refetch();
    }

    if (isSuccessExport && dataExport) {
      const csvContent = dataExport.message;

      const blob = new Blob(["\ufeff", csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      const now = new Date();
      const date = now.toLocaleDateString("fr-FR").replace(/\//g, "-");
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const seconds = now.getSeconds().toString().padStart(2, "0");

      const time = `${hours}h${minutes}m${seconds}s`;

      link.href = url;
      link.setAttribute("download", `export-users-${date}-${time}.csv`);

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Exportation réussie !");
    }

    if (isErrorDesactivate || isErrorExport) {
      const mainMessage = error?.message || errorExport?.message;
      toast.error(mainMessage);

      const backendErrors =
        error?.response?.errors || errorExport?.response?.data?.errors;
      if (Array.isArray(backendErrors)) {
        backendErrors.forEach((err) => {
          toast.info(err.message);
        });
      }
    }

    reset();
    resetExport();
  }, [
    isSuccess,
    isErrorDesactivate,
    dataDesactivate,
    error,
    refetch,
    isSuccessExport,
    isErrorExport,
    dataExport,
    errorExport,
  ]);

  if (isLoading) return <Loader variant="centered" message="Chargement..." />;

  return (
    <Card>
      <div className="flex justify-between mb-1">
        <div>
          <h1 className="text-xl text-gray-700 font-bold lg:pacifico-regular">
            Utilisateurs
          </h1>
        </div>
        <Button
          variant="primary"
          size={"icon"}
          disabled={isPendingExport}
          onClick={handleExport}
          className="p-2.5 md:px-3"
        >
          {isPendingExport ? (
            <span key="loading-state" className="flex items-center gap-2">
              <ButtonLoader />
              <span className="hidden md:inline">Exportation...</span>
            </span>
          ) : (
            <span key="idle-state" className="flex items-center gap-2">
              <Upload size={18} />
              <span className="hidden md:inline">Exporter</span>
            </span>
          )}
        </Button>
      </div>
      {isError ? (
        <NotFound
          Icon={AlertCircle}
          title="Erreur de chargement"
          message="Impossible de récupérer la liste des utilisateurs."
        />
      ) : users.length > 0 ? (
        <Table headers={headers}>
          {users.map((user) => (
            <tr
              key={user.id}
              className="group hover:bg-slate-50/50 transition-colors"
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <img
                    src={
                      user.profilePhoto ||
                      `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`
                    }
                    className="h-10 w-10 rounded-full object-cover border border-slate-200"
                    alt="avatar"
                  />
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 leading-none truncate">
                      {user.firstName} {user.lastName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono mt-1 italic">
                      ID: {user.id.slice(0, 8)}
                    </span>
                  </div>
                </div>
              </td>

              <td className="px-6 py-4">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${user.role === "admin"
                      ? "bg-purple-100 text-purple-700"
                      : user.role === "provider"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                >
                  {user.role}
                </span>
              </td>

              <td className="px-6 py-4 text-xs capitalize text-slate-600">
                <div
                  className={`text-xs capitalize px-2 py-1 rounded-full w-fit truncate ${user.gender === "male"
                      ? "bg-blue-50 text-blue-600"
                      : user.gender === "female"
                        ? "bg-pink-50 text-pink-600"
                        : "bg-slate-50 text-slate-400"
                    }`}
                >
                  {user.gender || "Non défini"}
                </div>
              </td>

              <td className="px-6 py-4">
                <div className="text-xs text-slate-600">{user.email}</div>
                <div className="text-[10px] text-slate-400">{user.phone}</div>
              </td>

              <td className="px-6 py-4 text-sm text-slate-600">
                {user.country}
              </td>

              <td className="px-6 py-4 text-center">
                {user.isEmailVerified && (
                  <ShieldCheck size={18} className="text-emerald-500 mx-auto" />
                )}
              </td>

              <td className="px-6 py-4 text-[11px] text-slate-500">
                {user.lastLogin
                  ? new Date(user.lastLogin).toLocaleDateString()
                  : "Jamais"}
              </td>

              <td className="px-6 py-4">
                <Badge
                  status={user.isActive ? "Actif" : "Bloqué"}
                  variant={user.isActive ? "green" : "red"}
                />
              </td>

              <td className="relative px-6 py-4 text-right">
                <div className="flex justify-end">
                  <Button
                    ref={openMenuId === user.id ? triggerRef : null}
                    onClick={() =>
                      setOpenMenuId(openMenuId === user.id ? null : user.id)
                    }
                    className="text-slate-400 hover:text-slate-600 border-none bg-transparent"
                  >
                    <MoreVertical size={18} />
                  </Button>
                </div>
                <ActionMenu
                  isOpen={openMenuId === user.id}
                  onClose={() => setOpenMenuId(null)}
                  triggerRef={triggerRef}
                  initialStatus={!user.isActive}
                  onStatusChange={() => handleStatusChange(user)}
                  onEdit={false}
                  onDelete={false}
                />
              </td>
            </tr>
          ))}
        </Table>
      ) : (
        <NotFound
          Icon={Users}
          title="Aucun utilisateur"
          message="Il semble qu'aucun utilisateur ne se soit inscrit"
        />
      )}
    </Card>
  );
};
