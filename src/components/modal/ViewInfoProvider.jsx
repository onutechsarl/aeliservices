import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  UserIcon,
  Building2Icon,
  CheckIcon,
  XIcon,
  FileTextIcon,
  EyeIcon,
  MapPinIcon,
  GlobeIcon,
} from "lucide-react";
import { Button } from "../../ui/Button";
import { ReadOnlyField } from "../../ui/Input";
import {
  useProviderApplicationsDetail,
  useProvidersCreation,
} from "../../hooks/useProvider";

/**
 * UI component responsible for rendering the view info provider section.
 */
export function ViewInfoProvider({ closeView, providerData }) {
  const isAlreadyApproved =
    providerData?.status === "approved" ||
    providerData?.verificationStatus === "under_review";
  const { data: response } = useProviderApplicationsDetail(
    !isAlreadyApproved ? providerData?.id : null,
  );
  const {
    mutate: mutateVerifyProvider,
    isLoading,
    isSuccess,
    data,
    isError,
    error,
  } = useProvidersCreation();
  const app = isAlreadyApproved ? providerData : response?.data?.application;

  const getDoc = (type) => app?.documents?.find((d) => d.type === type)?.url;

  const [formData, setFormData] = useState({
    adminNotes: "",
    rejectionReason: "",
  });

  /**
   * Handles change behavior.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Handles action behavior.
   */
  const handleAction = (isApproved) => {
    const payload = {
      decision: isApproved ? "approved" : "rejected",
      adminNotes: formData.adminNotes,
    };

    if (!isApproved) {
      payload.rejectionReason = formData.rejectionReason;
    }

    mutateVerifyProvider({
      id: providerData?.id,
      formData: payload,
    });
    console.log(
      "Payload envoyé pour vérification :",
      providerData?.id,
      payload,
    );
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
      className="fixed inset-0 overflow-y-auto bg-black/60 backdrop-blur-sm z-80 py-8 px-4"
    >
      <div className="flex w-full justify-center min-h-full">
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full lg:w-3/4 space-y-8"
        >
          <section className="bg-white rounded-[1.5rem] shadow-sm p-6 md:p-8 border border-white">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <UserIcon size={20} strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 pacifico-regular">
                  Identité du postulant
                </h3>
              </div>
              <div className="w-16 h-16">
                <img
                  src={
                    app?.profilePhoto ||
                    `https://ui-avatars.com/api/?name=${app?.businessName}&background=random`
                  }
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 shadow-sm"
                  alt="profile"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ReadOnlyField label="Nom" value={app?.firstName} />
              <ReadOnlyField label="Prénom" value={app?.lastName} />
              <ReadOnlyField
                label="Genre"
                value={app?.gender === "male" ? "Homme" : "Femme"}
              />
              <ReadOnlyField label="Pays" value={app?.country} />
              <ReadOnlyField label="E-mail de contact" value={app?.email} />
              <ReadOnlyField label="Téléphone personnel" value={app?.phone} />
            </div>
          </section>

          <section className="bg-white rounded-[1.5rem] shadow-sm p-6 md:p-8 border border-white">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Building2Icon size={20} strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 pacifico-regular">
                Détails de l'activité
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ReadOnlyField
                label="Nom de l'activité / Business"
                value={app?.businessName}
              />
              <ReadOnlyField
                label="Contact Professionnel"
                value={app?.businessContact}
              />
              <ReadOnlyField label="Numéro CNI" value={app?.cniNumber} />
              <ReadOnlyField label="WhatsApp Business" value={app?.whatsapp} />

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-2.5">
                  Activités sélectionnées
                </label>
                <div className="flex flex-wrap gap-2">
                  {app?.activities?.map((act) => (
                    <span
                      key={act}
                      className="inline-flex items-center px-3 py-1.5 bg-[#E8524D]/10 text-[#E8524D] text-xs font-bold rounded-full border border-rose-100"
                    >
                      {act}
                    </span>
                  ))}
                </div>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1.5">
                  Description des services
                </label>
                <div className="w-full bg-gray-50 border border-gray-100 rounded-xl px-5 py-4 text-zinc-700 text-sm">
                  {app?.description}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-[1.5rem] shadow-sm p-6 md:p-8 border border-white">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <MapPinIcon size={20} strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 pacifico-regular">
                Localisation géographique
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ReadOnlyField
                label="Adresse complète"
                value={app?.location}
                fullWidth
              />
              <ReadOnlyField
                label="Point de repère / Précisions"
                value={app?.address}
              />
              <div className="flex gap-4">
                <ReadOnlyField label="Latitude" value={app?.latitude} />
                <ReadOnlyField label="Longitude" value={app?.longitude} />
              </div>
            </div>
          </section>

          <section className="bg-white rounded-[1.5rem] shadow-sm p-6 md:p-8 border border-white">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                <FileTextIcon size={20} strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-bold text-zinc-900 pacifico-regular">
                Documents CNI
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {["cni_recto", "cni_verso"].map((type) => (
                <div key={type} className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">
                    {type.replace("_", " ")}
                  </span>
                  <div className="group relative bg-gray-100 rounded-2xl overflow-hidden aspect-[16/10] border border-gray-200">
                    <>
                      <img
                        src={getDoc(type)}
                        alt={type}
                        className="w-full h-full object-cover"
                      />
                      <a
                        href={getDoc(type)}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white"
                      >
                        <EyeIcon size={24} />
                        <span className="text-xs font-bold mt-2">Agrandir</span>
                      </a>
                    </>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="bg-white rounded-[1.5rem] shadow-sm p-6 md:p-8 border border-white flex flex-col">
            {!isAlreadyApproved && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-2">
                    Notes administratives (Interne)
                  </label>
                  <textarea
                    name="adminNotes"
                    disabled={isLoading}
                    value={formData.adminNotes}
                    onChange={handleChange}
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 h-24 resize-none"
                    placeholder="Notes pour l'équipe interne..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-2 text-red-600">
                    Motif du rejet (Envoyé au prestataire)
                  </label>
                  <textarea
                    name="rejectionReason"
                    disabled={isLoading}
                    value={formData.rejectionReason}
                    onChange={handleChange}
                    className="w-full bg-red-50/30 border border-red-100 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-red-500/20 h-24 resize-none"
                    placeholder="Ex: CNI illisible, veuillez resoumettre..."
                  />
                </div>
              </div>
            )}
            <div
              className={`flex flex-col md:flex-row gap-4 ${!isAlreadyApproved ? "mt-8" : ""}`}
            >
              {!isAlreadyApproved && (
                <>
                  <Button
                    variant="primary"
                    onClick={() => handleAction(true)}
                    isLoading={isLoading}
                    disabled={isLoading}
                    className="w-full py-3 bg-emerald-600 text-white"
                  >
                    <CheckIcon size={18} /> Accepter la candidature
                  </Button>

                  <Button
                    variant="danger"
                    onClick={() => handleAction(false)}
                    isLoading={isLoading}
                    disabled={isLoading || !formData.rejectionReason}
                    className="w-full py-3 border-red-200 text-red-600"
                  >
                    <XIcon size={18} /> Rejeter la candidature
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                onClick={closeView}
                className="w-full py-3"
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
