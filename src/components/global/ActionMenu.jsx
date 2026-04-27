import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Trash2, Eye, ShieldAlert, ShieldCheck, FileText, Ban } from "lucide-react";
import { Button } from "../../ui/Button";
import { Portal } from "../../ui/Portal";

/**
 * UI component responsible for rendering the action menu section.
 */
export function ActionMenu({
  isOpen,
  onClose,
  triggerRef,
  onEdit = false,
  onVerifyDoc = false,
  onDelete = false,
  onConsult = false,
  onStatusChange = false,
  initialStatus = false,
  onBannerIp = false
}) {
  const menuRef = useRef(null);
  const location = useLocation();
  const isProvider = location.pathname.startsWith("/provider");
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [isBlocked, setIsBlocked] = useState(initialStatus);

  useLayoutEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX - 150,
      });
    }
  }, [isOpen, triggerRef]);

  useEffect(() => {
    if (isOpen) {
      setIsBlocked(initialStatus);
    }
  }, [isOpen, initialStatus]);

  /**
   * Handles toggle behavior.
   */
  const handleToggle = (e) => {
    e.stopPropagation();
    onStatusChange?.();
    setIsBlocked(!isBlocked);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[90]" onClick={onClose} />
      <div
        ref={menuRef}
        style={{
          position: "absolute",
          top: `${coords.top}px`,
          left: `${coords.left}px`,
          width: "12rem",
        }}
        className="bg-white rounded-2xl shadow-2xl border border-gray-100 z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top-right overflow-hidden"
      >
        <div className="flex flex-col">
          {isProvider && (
            <>
              {onConsult &&
                <div className="border-b border-gray-100 hover:bg-gray-50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full gap-3 px-4 py-3.5 text-xs font-bold justify-start text-zinc-600"
                    onClick={() => {
                      onConsult?.();
                      onClose();
                    }}
                  >
                    <Eye size={16} />
                    <span>Consulter</span>
                  </Button>
                </div>
              }
              {onVerifyDoc &&
                <div className="border-b border-gray-100 hover:bg-gray-50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full gap-3 px-4 py-3.5 text-xs font-bold justify-start text-zinc-600"
                    onClick={() => {
                      onVerifyDoc?.();
                      onClose();
                    }}
                  >
                    <FileText size={16} />
                    <span>Verifier doc</span>
                  </Button>
                </div>
              }
            </>
          )}
          {onEdit && (
            <div className="border-b border-gray-100 hover:bg-gray-50">
              <Button
                variant="ghost"
                size="sm"
                className="w-full gap-3 px-4 py-3.5 text-xs font-bold justify-start text-zinc-600"
                onClick={() => {
                  onEdit?.();
                  onClose();
                }}
              >
                <Eye size={16} />
                <span>Modifier</span>
              </Button>
            </div>
          )}
          {onStatusChange &&
            <div
              className="flex items-center justify-between px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer group"
              onClick={handleToggle}
            >
              <div className="flex items-center gap-3">
                {isBlocked ? (
                  <ShieldAlert size={16} className="text-rose-600" />
                ) : (
                  <ShieldCheck size={16} className="text-emerald-600" />
                )}
                <span
                  className={`text-xs font-bold ${isBlocked ? "text-rose-600" : "text-zinc-600"}`}
                >
                  {isBlocked ? "Débloquer" : "Bloquer"}
                </span>
              </div>

              <div
                className={`relative w-8 h-4.5 rounded-full transition-colors duration-300 ${isBlocked ? "bg-rose-600" : "bg-zinc-200"}`}
              >
                <div
                  className={`absolute top-[2px] left-[2px] bg-white w-3.5 h-3.5 rounded-full transition-transform duration-300 shadow-sm ${isBlocked ? "translate-x-[14px]" : "translate-x-0"}`}
                />
              </div>
            </div>
          }
          {onBannerIp &&
            <div className="border-b border-gray-100 hover:bg-gray-50">
              <Button
                variant="ghost"
                size="sm"
                className="w-full gap-3 px-4 py-3.5 text-xs font-bold justify-start text-zinc-600"
                onClick={() => {
                  onBannerIp?.();
                  onClose();
                }}
              >
                <Ban size={16} />
                <span>Bannir IP</span>
              </Button>
            </div>
          }
          {onDelete && (
            <div className="hover:bg-red-50">
              <Button
                variant="ghostDanger"
                size="sm"
                className="w-full gap-3 px-4 py-3.5 text-xs font-bold justify-start"
                onClick={() => {
                  onDelete?.();
                  onClose();
                }}
              >
                <Trash2 size={16} />
                <span>Supprimer</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}
