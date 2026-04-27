import React, { useState, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { ShieldAlert, AlertCircle, MoreVertical } from "lucide-react";
import { Card } from "../../ui/Card";
import { Table } from "../../ui/Table";
import { Badge } from "../../ui/Badge";
import { Button } from '../../ui/Button';
import { ActionMenu } from "../global/ActionMenu";
import { Pagination } from "../global/Pagination";
import { NotFound } from "../global/NotFound";
import { Loader } from "../global/Loader";
import { useSecurityLogs } from "../../hooks/useStats";

/**
 * UI component responsible for rendering the ip detection section.
 */
export function IpDetection() {
  const { onActiveModal } = useOutletContext();
  const { data: logsResponse, isLoading, isError } = useSecurityLogs();
  const logs = logsResponse?.data?.logs || [];
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuId, setOpenMenuId] = useState(null);
  const triggerRef = useRef(null);
  const itemsPerPage = 15;

  const headers = [
    "Date",
    "Heure",
    "Événement",
    "IP",
    "Utilisateur",
    "Risque",
    "Status",
  ];

  const getEventDisplay = (type) => {
    if (type === "login_failed") return "Connexion échoué";
    if (type === "login_success") return "Connexion réussi";
    return type;
  };

  const getRiskDisplay = (level) => {
    if (level === "high") return "Elevé";
    if (level === "medium") return "Moyen";
    return "Aucun";
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const currentItems = logs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(logs.length / itemsPerPage);

  return (
    <>
      <Card>
        <div className="px-2 py-2">
          <h3 className="text-lg font-semibold text-gray-800 ">
            Logs de securite ressent
          </h3>
        </div>
        {isLoading ? (
          <Loader message="Chargement des logs de sécurité..." />
        ) : isError ? (
          <NotFound
            Icon={AlertCircle}
            title="Erreur de chargement"
            message="Impossible de récupérer les logs de sécurité."
          />
        ) : logs.length > 0 ? (
          <Table headers={headers}>
            {currentItems.map((log) => {
              const dateObj = new Date(log.createdAt);
              const displayDate = dateObj.toLocaleDateString("fr-FR");
              const displayTime = dateObj.toLocaleTimeString("fr-FR");
              const eventtype = getEventDisplay(log.eventType);
              const risklevel = getRiskDisplay(log.riskLevel);
              const status = log.success ? "Succes" : "Echoué";

              return (
                <tr
                  key={log.id}
                  className="group hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-900">
                      {displayDate}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-slate-900">
                      {displayTime}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded truncate ${eventtype === "Connexion échoué"
                        ? "bg-red-50 text-red-700"
                        : eventtype === "Detection bot"
                          ? "bg-purple-50 text-purple-700"
                          : "bg-green-100 text-green-700"
                        }`}
                    >
                      {eventtype}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="flex items-center gap-2">
                      {log.ipAddress.replace("::ffff:", "")}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="flex items-center gap-2">{log.email}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-xs font-medium ">
                    <div
                      className={`flex items-center rounded-full items-center justify-center gap-2 w-fit py-1 px-2 ${risklevel === "Elevé" ? "bg-red-50 text-red-700" : risklevel === "Moyen" ? "bg-yellow-50 text-yellow-700" : "bg-green-50 text-green-700"}`}
                    >
                      {risklevel}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      status={status}
                      variant={
                        status === "Succes"
                          ? "green"
                          : status === "Bloqué"
                            ? "gray"
                            : "red"
                      }
                    />
                  </td>
                  <td className="relative px-6 py-4 text-right">
                    <div className="flex justify-end">
                      <Button
                        ref={openMenuId === log.id ? triggerRef : null}
                        onClick={() =>
                          setOpenMenuId(openMenuId === log.id ? null : log.id)
                        }
                        className="text-slate-400 hover:text-slate-600 border-none bg-transparent"
                      >
                        <MoreVertical size={18} />
                      </Button>
                    </div>
                    <ActionMenu
                      isOpen={openMenuId === log.id}
                      onClose={() => setOpenMenuId(null)}
                      triggerRef={triggerRef}
                      onBannerIp={() => {
                        onActiveModal(5, {
                          data: {
                            ipAddress: log.ipAddress.replace("::ffff:", ""),
                          },
                        });
                      }}
                    />
                  </td>
                </tr>
              );
            })}
          </Table>
        ) : (
          <NotFound
            Icon={ShieldAlert}
            title="Aucun log de sécurité"
            message="Aucun événement de sécurité ne correspond à la période ou aux filtres appliqués."
          />
        )}
      </Card>
      {totalPages && (
        <div className="mt-6 overflow-x-auto ">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </div>
      )}
    </>
  );
}
