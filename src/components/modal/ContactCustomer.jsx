import React, { useState, useEffect } from 'react';
import { toast } from "react-toastify";
import { Send, Phone, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { useInfoUserConnected } from '../../hooks/useUser';
import { useContact } from '../../hooks/useContact';

/**
 * UI component responsible for rendering contact customer.
 */
export function ContactCustomer({ closeContact, dataContact }) {

  const { data: userData } = useInfoUserConnected();
  const user = userData?.data?.user;

  const {
    mutate: mutateContact,
    isPending: isPendingContact,
    isSuccess: isSuccessContact,
    isError: isErrorContact,
    data: dataResponse,
    error: errorResponse
  } = useContact();

  const [formData, setFormData] = useState({
    providerId: "",
    message: "",
    senderName: "",
    senderEmail: "",
    senderPhone: ""
  });


  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      providerId: dataContact?.id || "",
      senderName: `${user?.firstName} ${user?.lastName}` || "",
      senderEmail: user?.email || "",
      senderPhone: user?.phone || ""
    }));
  }, [user, dataContact]);

  /**
   * Handles handle change behavior.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Handles handle submit behavior.
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    mutateContact(formData);
  };

  useEffect(() => {
    if (isSuccessContact && dataResponse?.success) {
      toast.success(dataResponse.message);
      closeContact();
    }

    if (isSuccessContact && dataResponse?.success === false) {
      toast.error(dataResponse.message);
    }

    if (isErrorContact) {
      const mainMessage = errorResponse?.response?.message;
      toast.error(mainMessage);

      const backendErrors = errorResponse?.response?.errors;
      if (Array.isArray(backendErrors)) {
        backendErrors.forEach((err) => toast.info(err.message));
      }
    }
  }, [isSuccessContact, isErrorContact, dataResponse, errorResponse, closeContact]);

  return (
    <div
      onClick={() => closeContact()}
      className="fixed inset-0 z-[1003] h-screen overflow-y-auto bg-black/60 backdrop-blur-sm p-4 md:p-8 flex justify-center items-start md:items-center font-sans"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 my-auto"
      >
        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl relative">
          <div className="px-6 pt-8 md:px-10">
            <h1 className="text-3xl font-bold text-gray-700 mb-2 tracking-tight pacifico-regular">
              Prendre rendez-vous
            </h1>
            <p className="text-gray-500 text-sm md:text-base font-medium">
              Contactez <span className="text-[#E8524D]">{dataContact?.businessName || "le prestataire"}</span> pour réserver votre créneau.
            </p>
          </div>

          <form className="p-6 md:p-10 space-y-6" onSubmit={handleSubmit}>
            { }
            <div className="hidden  grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Nom complet"
                name="senderName"
                value={formData.senderName}
                onChange={handleChange}
                placeholder="Ex: Fatou Kamga"
                isreadOnly={true}
                readOnly
                required
              />
              <Input
                label="Email"
                name="senderEmail"
                type="email"
                value={formData.senderEmail}
                onChange={handleChange}
                placeholder="fatou@example.com"
                isreadOnly={true}
                readOnly
                required
              />
              <Input
                label="Téléphone"
                name="senderPhone"
                type="tel"
                value={formData.senderPhone}
                onChange={handleChange}
                placeholder="+237 6xx xxx xxx"
                isreadOnly={true}
                readOnly
              />
            </div>

            <Input
              label="Message"
              name="message"
              type="textarea"
              value={formData.message}
              onChange={handleChange}
              placeholder="Bonjour, je voudrais prendre rendez-vous pour..."
              required
              rows={4}
            />

            <div className="flex flex-col-reverse sm:flex-row gap-4 pt-2">
              <Button
                type="button"
                variant="secondary"
                className="flex-1 py-3"
                onClick={closeContact}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="gradient"
                className="flex-[2] gap-2 py-3"
                disabled={isPendingContact}
              >
                {isPendingContact ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Envoyer la demande...
                  </span>
                ) : (
                  <span key="loading-state" className="flex items-center gap-2">
                    <Send className="w-4 h-4 " />
                    Soumettre
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>

        { }
        {dataContact?.subscriptionActive && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            { }
            <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col transition-transform hover:-translate-y-1 duration-300">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="font-bold text-lg text-gray-700 pacifico-regular">WhatsApp</h3>
              </div>
              <p className="text-gray-500 text-sm mb-6 flex-grow">
                {dataContact?.whatsapp
                  ? "Réponse rapide pour vos questions urgentes."
                  : "Le numéro WhatsApp n'est pas renseigné par ce prestataire."}
              </p>
              <Button
                variant="whatsapp"
                disabled={!dataContact?.whatsapp}
                onClick={() => {
                  if (dataContact?.whatsapp) {
                    const cleanNumber = dataContact.whatsapp.replace(/\D/g, '');

                    const s = dataContact?.selectedService;

                    const messageBrut = s
                      ? `
Salut, je suis intéressé par votre service sur Aeli Service :
*Service :* ${s.name}
*Prix :* ${s.price ? s.price + ' FCFA' : 'Sur devis'}
*Description :* ${s.description || '/'}

J'aimerais avoir plus d'informations à ce sujet. Merci !`
                      : `Salut, je suis intéressé par vos services sur Aeli Service. J'aimerais avoir plus d'informations. Merci !`;

                    const messageEncoded = encodeURIComponent(messageBrut);

                    window.open(`https://wa.me/${cleanNumber}?text=${messageEncoded}`, '_blank');
                  }
                }}
                className={`w-full gap-2 py-3 ${!dataContact?.whatsapp ? 'bg-gray-300 cursor-not-allowed opacity-70 grayscale' : ''}`}
              >
                <MessageCircle className="w-6 h-6" />
                {dataContact?.whatsapp ? "Ouvrir WhatsApp" : "Indisponible"}
              </Button>
            </div>

            { }
            <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col transition-transform hover:-translate-y-1 duration-300">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="font-bold text-lg text-gray-700 pacifico-regular">Appel direct</h3>
              </div>
              <p className="text-gray-500 text-sm mb-6 flex-grow">
                Disponibilité immédiate par téléphone.
              </p>

              <Button
                variant="phone"
                className={`w-full gap-2 py-3 ${!dataContact?.businessContact ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!dataContact?.businessContact}
                onClick={() => {

                  const cleanPhone = dataContact.businessContact.replace(/\s/g, '');
                  window.location.href = `tel:${cleanPhone}`;
                }}
              >
                <Phone className="w-6 h-6" />
                {dataContact?.businessContact ? "Appeler maintenant" : "Indisponible"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
