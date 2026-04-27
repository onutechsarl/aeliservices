import React, { useState, useRef, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "react-toastify";
import {
  MapPin,
  Upload,
  FileText,
  MoreVertical,
  Users,
  Phone,
  MessageSquare,
  ShieldCheck,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";
import { Badge } from "../../ui/Badge";
import { Table } from "../../ui/Table";
import { NotFound } from "../global/NotFound";
import { ActionMenu } from "../global/ActionMenu";
import { Loader, ButtonLoader } from "../global/Loader";
import { useExportProviders } from "../../hooks/useExport";
import { useDeactivateAccountProvider } from "../../hooks/useProvider";

/**
 * UI component responsible for rendering the provider table section.
 */
export const ProviderTable = ({
  applications,
  isLoading,
  isError,
  actifTabs,
  refetch,
  refetchPending,
}) => {
  const headers = [
    "Prestataire",
    "Contact",
    "Activités",
    "Localisation",
    "Documents",
    "Statut",
    "Compte",
    "Actions",
  ];

  const { onActiveModal } = useOutletContext();
  const [openMenuId, setOpenMenuId] = useState(null);
  const triggerRef = useRef(null);
  console.log("etat:", actifTabs)
  const {
    mutate: mutateStatus,
    isSuccess: isSuccessStatus,
    data: dataStatus,
    isError: isErrorStatus,
    error: errorStatus,
    reset: resetStatus,
  } = useDeactivateAccountProvider();
  const {
    mutate: mutateExport,
    isPending: isPendingExport,
    isSuccess: isSuccessExport,
    data: dataExport,
    isError: isErrorExport,
    error: errorExport,
    reset: resetExport,
  } = useExportProviders();

  /**
   * Handles status change behavior.
   */
  const handleStatusChange = (app) => {
    mutateStatus({
      id: app.id,
      formData: {
        isActive: !app.isActive,
        reason:
          "Non-respect des conditions d'utilisation de la plateforme. Veuillez contacter le service client.",
      },
    });
  };

  /**
   * Handles export behavior.
   */
  const handleExport = () => mutateExport();

  useEffect(() => {
    if (isSuccessStatus) {
      toast.success(dataStatus?.message);
      refetch();
      refetchPending();
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
      const time = `${now.getHours()}h${now.getMinutes()}m${now.getSeconds()}s`;

      link.href = url;
      link.setAttribute("download", `export-prestataires-${date}-${time}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Exportation réussie !");
    }

    if (isErrorExport || isErrorStatus) {
      const errorObj = errorExport || errorStatus;
      toast.error(errorObj?.message || "Une erreur est survenue");
      const backendErrors = errorObj?.response?.data?.errors;
      if (Array.isArray(backendErrors)) {
        backendErrors.forEach((err) => toast.info(err.message));
      }
    }

    resetStatus();
    resetExport();
  }, [
    isSuccessExport,
    isErrorExport,
    dataExport,
    errorExport,
    resetExport,
    isSuccessStatus,
    isErrorStatus,
    dataStatus,
    errorStatus,
    resetStatus,
    refetch,
    refetchPending,
  ]);

  if (isLoading) return <Loader variant="centered" message="Chargement..." />;

  return (
    <Card>
      <div className="flex justify-between mb-1 items-center">
        <h1 className="text-xl text-gray-700 font-bold lg:pacifico-regular">
          Prestataires
        </h1>
        <Button
          variant="primary"
          size={"icon"}
          disabled={isPendingExport}
          onClick={handleExport}
          className="p-2.5 md:px-3"
        >
          {isPendingExport ? (
            <span className="flex items-center gap-2">
              <ButtonLoader />
              <span className="hidden md:inline">Exportation...</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
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
          message="Impossible de récupérer la répartition des événements."
        />
      ) : applications.length > 0 ? (
        <Table headers={headers}>
          {applications.map((app) => (
            <tr
              key={app.id}
              className="group hover:bg-slate-50/50 transition-colors"
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <img
                      src={
                        app?.profilePhoto ||
                        `https://ui-avatars.com/api/?name=${app.businessName}&background=random`
                      }
                      className="h-10 w-10 rounded-full object-cover border border-slate-200"
                      alt="avatar"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <Briefcase size={10} className="text-red-500" />
                    </div>
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-slate-900 leading-none truncate">
                      {app.businessName}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 truncate">
                      {app.firstName} {app.lastName}
                    </span>
                  </div>
                </div>
              </td>

              <td className="px-6 py-4">
                <div className="flex flex-col gap-1">
                  <div className="text-xs text-slate-600">{app.phone}</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-blue-500">
                    <a
                      href={`https://wa.me/${app.whatsapp?.replace(/\s/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-slate-400 hover:text-blue-500 hover:underline"
                    >
                      {app.whatsapp}
                    </a>
                  </div>
                </div>
              </td>

              <td className="px-6 py-4">
                <div className="flex gap-1 flex-wrap max-w-[150px]">
                  {app.activities?.slice(0, 2).map((act, idx) => (
                    <span
                      key={idx}
                      className="bg-red-50 text-red-600 text-[9px] font-bold uppercase px-2 py-0.5 rounded"
                    >
                      {act}
                    </span>
                  ))}
                  {app.activities?.length > 2 && (
                    <span className="text-[9px] text-slate-400">
                      +{app.activities.length - 2}
                    </span>
                  )}
                </div>
              </td>

              <td className="px-6 py-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <MapPin size={12} className="text-red-400" />
                  <span className="truncate max-w-[120px]">{app.location}</span>
                </div>
              </td>

              <td className="px-6 py-4">
                <div className="flex -space-x-2">
                  {app.documents?.map((doc, idx) => (
                    <a
                      key={idx}
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:z-10 shadow-sm transition-all"
                      title={`Doc: ${doc.type}`}
                    >
                      <FileText size={14} />
                    </a>
                  ))}
                </div>
              </td>

              <td className="px-6 py-4">
                <Badge
                  status={app.verificationStatus}
                  variant={
                    app.verificationStatus === "approved"
                      ? "green"
                      : app.status === "approved"
                        ? "green"
                        : app.verificationStatus === "under_review"
                          ? "purple"
                          : app.verificationStatus === "pending" ||
                            app.status === "pending"
                            ? "yellow"
                            : "red"
                  }
                />
              </td>

              <td className="px-6 py-4">
                <Badge
                  status={app.isActive ? "Actif" : "Bloqué"}
                  variant={app.isActive ? "green" : "red"}
                />
              </td>

              <td className="relative px-6 py-4 text-right">
                <div className="flex justify-end">
                  <Button
                    ref={openMenuId === app.id ? triggerRef : null}
                    onClick={() =>
                      setOpenMenuId(openMenuId === app.id ? null : app.id)
                    }
                    className="text-slate-400 hover:text-slate-600 border-none bg-transparent"
                  >
                    <MoreVertical size={18} />
                  </Button>
                </div>
                <ActionMenu
                  isOpen={openMenuId === app.id}
                  onClose={() => setOpenMenuId(null)}
                  triggerRef={triggerRef}
                  initialStatus={!app.isActive}
                  onStatusChange={
                    (actifTabs === "Actifs" || actifTabs === "Bloquer")
                      ? () => handleStatusChange(app)
                      : false
                  }
                  onConsult={
                    actifTabs != "Attente"
                      ? false
                      : () => onActiveModal(3, { data: app })
                  }
                  onVerifyDoc={
                    actifTabs != "Doc verification"
                      ? false
                      : () => onActiveModal(4, { data: app })
                  }
                  onDelete={false}
                />
              </td>
            </tr>
          ))}
        </Table>
      ) : (
        <NotFound
          Icon={Users}
          title="Aucun prestataire trouvé"
          message="Aucun profil de prestataire ne correspond à vos critères."
        />
      )}
    </Card>
  );
};
