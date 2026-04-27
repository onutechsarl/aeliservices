import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  CheckCircle2,
  XCircle,
  Eye,
  ShieldCheck,
  AlertCircle,
  FileText,
  Info,
} from "lucide-react";
import { ButtonLoader } from "../global/Loader";
import { Button } from "../../ui/Button";
import { useReviewProviderDocuments } from "../../hooks/useProvider";

/**
 * UI component responsible for rendering the verify document provider section.
 */
export function VerifyDocumentProvider({ closeView, providerData }) {
  const isAlreadyApproved = providerData?.status === "approved";
  const {
    mutate: reviewDocuments,
    isLoading,
    isSuccess,
    data,
    isError,
    error,
  } = useReviewProviderDocuments();

  const app = providerData;

  const [decision, setDecision] = useState("approved");
  const [adminNotes, setAdminNotes] = useState("");
  const [docStates, setDocStates] = useState({});

  useEffect(() => {
    providerData
  }), [providerData];

  /**
   * Handles toggle doc behavior.
   */
  const handleToggleDoc = (index, isApproved) => {
    setDocStates((prev) => ({
      ...prev,
      [index]: {
        approved: isApproved,
        reason: isApproved ? "" : prev[index]?.reason || "",
      },
    }));
  };

  /**
   * Handles reason change behavior.
   */
  const handleReasonChange = (index, reason) => {
    setDocStates((prev) => ({
      ...prev,
      [index]: { ...prev[index], reason },
    }));
  };

  const submitReview = () => {
    const approvedDocuments = [];
    const rejectedDocuments = [];

    app?.documents?.forEach((doc, index) => {
      const state = docStates[index];
      if (state?.approved) {
        approvedDocuments.push(index);
      } else {
        rejectedDocuments.push({
          index,
          reason: state?.reason,
        });
      }
    });

    const payload = {
      decision,
      notes: adminNotes,
      approvedDocuments,
      rejectedDocuments,
    };

    reviewDocuments({
      id: providerData?.id,
      formData: payload,
    });
  };

  useEffect(() => {
    if (isSuccess && data?.success) {
      toast.success(data.message);
      closeView();
    }

    if (isError) {
      const mainMessage = error?.message;
      toast.error(mainMessage);

      const backendErrors = error?.response?.errors;
      if (Array.isArray(backendErrors)) {
        backendErrors.forEach((err) => {
          toast.info(err.message);
        });
      }
    }
  }, [isSuccess, isError, data, error]);

  return (
    <main
      onClick={closeView}
      className="fixed inset-0 overflow-y-auto bg-slate-900/60 backdrop-blur-sm z-[100] py-8 px-4"
    >
      <div className="flex w-full justify-center min-h-full">
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full lg:w-3/4 max-w-5xl space-y-6"
        >
          <div className="bg-white rounded-[1.5rem] p-6 border border-white shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-[#E8524D]/10 flex items-center justify-center text-[#E8524D]">
                <ShieldCheck size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 pacifico-regular">
                  Vérification : {app?.businessName}
                </h2>
                <p className="text-xs text-slate-500 font-medium italic">
                  ID du prestataire : {providerData?.id}
                </p>
              </div>
            </div>
            <button
              onClick={closeView}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
            >
              <XCircle size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 bg-white rounded-[1.5rem]">
            {app?.documents?.map((doc, index) => {
              const currentState = docStates[index];

              const statusToShow =
                currentState !== undefined
                  ? currentState.approved
                    ? "approved"
                    : "rejected"
                  : doc.status;

              return (
                <section
                  key={index}
                  className={`p-6 transition-all duration-300  ${statusToShow === "approved"
                    ? "bg-emerald-50/30"
                    : statusToShow === "rejected"
                      ? "bg-red-50/30"
                      : ""
                    }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-slate-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {doc.type.replace("_", " ")}
                      </span>

                      <span
                        className={`text-[8px] px-2 py-0.5 rounded-[1.5rem] font-bold ${doc.status === "approved"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                          }`}
                      >
                        {doc.status}
                      </span>
                    </div>

                    {!isAlreadyApproved && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleDoc(index, true)}
                          className={`p-2 rounded-xl transition-all ${currentState?.approved === true
                            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                            : "bg-slate-50 text-slate-400 hover:bg-emerald-50"
                            }`}
                        >
                          <CheckCircle2 size={20} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleDoc(index, false)}
                          className={`p-2 rounded-xl transition-all ${currentState?.approved === false
                            ? "bg-[#E8524D] text-white shadow-lg shadow-red-200"
                            : "bg-slate-50 text-slate-400 hover:bg-red-50"
                            }`}
                        >
                          <XCircle size={20} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relative aspect-[4/3] rounded-[1.5rem] overflow-hidden bg-slate-100 group shadow-sm border border-slate-100">
                    <img
                      src={doc.url}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      alt={doc.type}
                    />
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2"
                    >
                      <Eye size={24} />
                      <span className="text-[10px] font-bold uppercase">
                        Agrandir
                      </span>
                    </a>
                  </div>

                  {currentState?.approved === false && (
                    <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2">
                      <label className="text-[10px] font-black text-[#E8524D] ml-1 uppercase flex items-center gap-1">
                        <AlertCircle size={10} /> Raison du rejet obligatoire
                      </label>
                      <textarea
                        value={currentState?.reason || ""}
                        onChange={(e) =>
                          handleReasonChange(index, e.target.value)
                        }
                        className="w-full bg-white border border-red-100 rounded-2xl p-4 text-xs h-20 outline-none focus:ring-2 focus:ring-[#E8524D]/10 resize-none shadow-inner"
                        placeholder="Ex: Document expiré ou flou..."
                      />
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          {!isAlreadyApproved && (
            <div className="bg-white rounded-[1.5rem] p-8 border border-white shadow-xl space-y-6">
              <div className="flex flex-col gap-8">
                <div>
                  <label className="text-sm font-black text-slate-700 mb-4 block flex items-center gap-2">
                    <Info size={16} className="text-[#E8524D]" /> Statut final
                    de la vérification
                  </label>
                  <div className="flex p-1.5 bg-slate-100 rounded-xl">
                    {[
                      { id: "approved", label: "Approuver" },
                      { id: "under_review", label: "En attente" },
                      { id: "rejected", label: "Rejeter" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setDecision(opt.id)}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${decision === opt.id
                          ? "bg-white shadow-md text-slate-900"
                          : "text-slate-400"
                          }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-black text-slate-700 mb-4 block">
                    Notes administratives (Interne)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-xs h-24 outline-none focus:ring-2 focus:ring-blue-500/10"
                    placeholder="Notes internes pour l'historique de modération..."
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 pt-4">
                <Button
                  onClick={submitReview}
                  className={`flex-1 py-4 rounded-[1.5rem] font-bold text-white transition-all shadow-lg ${decision === "approved"
                    ? "bg-emerald-500 shadow-emerald-200"
                    : decision === "rejected"
                      ? "bg-[#E8524D] shadow-red-200"
                      : "bg-slate-800 shadow-slate-200"
                    }`}
                >
                  {isLoading ? (
                    <ButtonLoader className="mx-auto" />
                  ) : (
                    "Confirmer la décision"
                  )}
                </Button>
                <Button
                  onClick={closeView}
                  variant="outline"
                  className="px-10 rounded-[1.5rem] border-slate-200"
                >
                  Annuler
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
