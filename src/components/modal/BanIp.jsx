import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { Ban, XCircle, ShieldAlert } from "lucide-react";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";
import { ButtonLoader } from "../global/Loader";
import { useBanIps } from "../../hooks/useSecurity";

const DURATION_OPTIONS = [
    { label: "1 heure", value: 3600 },
    { label: "6 heures", value: 21600 },
    { label: "12 heures", value: 43200 },
    { label: "24 heures", value: 86400 },
    { label: "7 jours", value: 604800 },
    { label: "30 jours", value: 2592000 },
];

/**
 * UI component responsible for rendering the ban IP modal.
 */
export function BanIp({ closeView, defaultIp = "" }) {
    const {
        mutate: mutateBanIps,
        isPending: isPendingBanIps,
        isSuccess: isSuccessBanIps,
        isError: isErrorBanIps,
        error: errorBanIps,
        data: dataBanIps,
    } = useBanIps();

    const [formData, setFormData] = useState({
        ipAddress: defaultIp || "",
        reason: "",
        duration: 86400,
    });

    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            ipAddress: defaultIp || "",
        }));
    }, [defaultIp]);

    const isValid = useMemo(() => {
        return (
            formData.ipAddress.trim().length > 0 &&
            formData.reason.trim().length > 0 &&
            Number(formData.duration) > 0
        );
    }, [formData]);

    /**
     * Handles change behavior.
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "duration" ? Number(value) : value,
        }));
    };

    /**
     * Handles submit behavior.
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isValid || isPendingBanIps) return;
        mutateBanIps({
            ipAddress: formData.ipAddress.trim(),
            reason: formData.reason.trim(),
            duration: Number(formData.duration),
        });
    };

    useEffect(() => {
        if (isSuccessBanIps && dataBanIps?.success) {
            toast.success(dataBanIps.message);
            closeView();
        }

        if (isErrorBanIps) {
            const mainMessage = errorBanIps?.message;
            toast.error(mainMessage);

            const backendErrors = errorBanIps?.response?.errors;
            if (Array.isArray(backendErrors)) {
                backendErrors.forEach((err) => {
                    toast.info(err.message);
                });
            }
        }
    }, [isSuccessBanIps, dataBanIps, isErrorBanIps, errorBanIps]);

    return (
        <main
            onClick={closeView}
            className="fixed inset-0 overflow-y-auto bg-slate-900/60 backdrop-blur-sm z-[100] py-8 px-4"
        >
            <div className="flex w-full justify-center min-h-full">
                <div
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-xl space-y-6"
                >
                    <Card className="bg-white rounded-[1.5rem] p-6 border border-white shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
                                <ShieldAlert size={20} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-zinc-900 pacifico-regular">
                                    Bannir une adresse IP
                                </h2>
                                <p className="text-xs text-slate-500 font-medium italic">
                                    Action de sécurité (admin)
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={closeView}
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                        >
                            <XCircle size={24} />
                        </button>
                    </Card>

                    <form
                        onSubmit={handleSubmit}
                        className="bg-white rounded-[1.5rem] p-6 border border-white shadow-xl space-y-5"
                    >
                        <div className="grid grid-cols-1 gap-4">
                            <label className="text-sm font-semibold text-slate-700">
                                Adresse IP
                            </label>
                            <input
                                type="text"
                                name="ipAddress"
                                value={formData.ipAddress}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#FCE0D6] focus:border-transparent transition-all outline-none text-slate-800 placeholder:text-slate-400"
                                placeholder="192.168.1.100"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <label className="text-sm font-semibold text-slate-700">
                                Raison du bannissement
                            </label>
                            <textarea
                                name="reason"
                                value={formData.reason}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-[#FCE0D6] focus:border-transparent transition-all outline-none text-slate-800 placeholder:text-slate-400 min-h-[120px]"
                                placeholder="Ex: Brute force attack"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <label className="text-sm font-semibold text-slate-700">
                                Durée du bannissement
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {DURATION_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                duration: option.value,
                                            }))
                                        }
                                        className={`px-3 py-2 rounded-xl text-[11px] font-bold uppercase transition-all ${Number(formData.duration) === option.value
                                            ? "bg-rose-600 text-white shadow-lg shadow-rose-200"
                                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-2">
                            <Button
                                type="submit"
                                className="flex-1 py-3 rounded-[1.2rem] font-bold text-white bg-rose-600 shadow-lg shadow-rose-200"
                                disabled={!isValid || isPendingBanIps}
                            >
                                {isPendingBanIps ? (
                                    <ButtonLoader className="mx-auto" />
                                ) : (
                                    <>
                                        <Ban size={18} /> Bannir
                                    </>
                                )}
                            </Button>

                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}
