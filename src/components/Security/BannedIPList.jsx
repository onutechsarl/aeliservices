import React, { useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "react-toastify";
import { Trash2, Plus, ShieldAlert } from "lucide-react";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";
import { NotFound } from "../global/NotFound";
import { useGetIpBanned, useUnBanIps } from "../../hooks/useSecurity";

/**
 * UI component responsible for rendering the banned i p list section.
 */
export function BannedIPList() {
  const { onActiveModal, closeConfirm } = useOutletContext();
  const { data: bannedIpsResponse, isLoading, refetch } = useGetIpBanned();
  const {
    mutate: mutateUnbanIps,
    data: dataUnbanIps,
    isSuccess: isSuccessUnBanIps,
    isError: isErrorUnBanIps,
    error: errorUnBanIps,
  } = useUnBanIps();

  const bannedList = bannedIpsResponse?.data?.bannedIPs || [];

  const formatExpiresAt = (expiresAt) => {
    if (!expiresAt) {
      return "-";
    }

    const parsedDate = new Date(expiresAt);
    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  /**
   * Handles unban behavior.
   */
  const handleUnban = (item) => {
    onActiveModal(1, {
      title: "Débloquer l'IP ?",
      description: `Voulez-vous vraiment débloquer l'IP ${item.ipAddress} ? Cette action est irréversible.`,
      onConfirm: () => {
        mutateUnbanIps(item.id);
      },
    });
  };

  useEffect(() => {
    if (isSuccessUnBanIps && dataUnbanIps?.success) {
      toast.success(dataUnbanIps.message);
      refetch();
      if (closeConfirm) closeConfirm();
    }

    if (isErrorUnBanIps) {
      const mainMessage = errorUnBanIps?.message;
      toast.error(mainMessage);

      const backendErrors = errorUnBanIps?.response?.errors;
      if (Array.isArray(backendErrors)) {
        backendErrors.forEach((err) => {
          toast.info(err.message);
        });
      }
    }
  }, [isSuccessUnBanIps, isErrorUnBanIps, dataUnbanIps, errorUnBanIps]);

  return (
    <Card className="w-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-gray-900">IPs Bannies</h2>
          <p className="text-xs text-gray-500">
            Liste des adresses restreintes par le système
          </p>
        </div>
      </div>

      <div className="space-y-3 flex-1">
        {bannedList.length > 0 ? (
          bannedList.map((item, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-lg p-4 flex items-center justify-between group hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
            >
              <div className="flex flex-col">
                <span className="font-mono font-bold text-slate-800">
                  {item.ipAddress}
                </span>
                <span className="text-sm text-gray-500">{item.reason}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[11px] font-medium bg-gray-200 text-gray-600 px-2 py-1 rounded">
                  {formatExpiresAt(item.expiresAt)}
                </span>
                <button
                  className="text-gray-400 hover:text-red-500 p-1.5 transition-colors"
                  onClick={() => handleUnban(item)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <NotFound
            Icon={ShieldAlert}
            title="Aucune IP bannie"
            message="Aucune IP bannie actuellement"
          />
        )}
      </div>
    </Card>
  );
}
