import React, { useRef, useMemo } from 'react';
import { ModalCard } from '../../ui/ModalCard';
import { Button } from '../../ui/Button';
import { CountItems } from '../global/CountItems';
import { Loading } from '../global/Loading';
import { NotFound } from '../global/Notfound';
import { MessageCard } from '../../ui/MessageCustomerCard';
import { Trash2, MessageSquare, Loader2, Send, AlertCircle } from 'lucide-react';
import { useGetContactSend } from '../../hooks/useContact';

/**
 * UI component responsible for rendering messagecustomer.
 */
export function Messagecustomer({ closeMessage, onConfirmation }) {
    const scrollRef = useRef(null);

    const { data: contactResponse, isLoading, isError } = useGetContactSend();

    const contactsList = useMemo(() => {
        return contactResponse?.data?.contacts || [];
    }, [contactResponse]);

    const totalItems = contactResponse?.data?.pagination?.totalItems || 0;

    const formattedMessages = useMemo(() => {
        return contactsList.map((contact) => {
            const dateObj = new Date(contact.createdAt);
            return {
                id: contact.id,
                businessName: contact.provider?.businessName || 'Prestataire',

                image: contact.provider?.user?.profilePhoto || `./defaultstructure.jpg`,
                date: dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
                time: dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                displayId: contact.id.substring(0, 8), // Petit ID visuel
                message: contact.message,
                status: contact.status, // 'pending', etc.
            };
        });
    }, [contactsList]);

    return (
        <ModalCard
            title={
                <div className="flex items-center gap-2">
                    <Send className="text-[#E8524D]" size={20} />
                    Messages envoyés
                </div>
            }
            closeModal={closeMessage}
            isWide={true}
        >
            {isLoading ? (
                <Loading className="h-64" size="small" title="Chargement de vos messages..." />
            ) : isError ? (
                <NotFound
                    Icon={AlertCircle}
                    title="Erreur de chargement"
                    message="Une erreur est survenue lors de la récupération de vos messages."
                    className="h-40"
                />
            ) : (
                <>
                    <CountItems count={totalItems} scrollContainerRef={scrollRef} />

                    <div
                        ref={scrollRef}
                        className="flex flex-col gap-4 overflow-y-auto h-full pb-25 md:pb-10 no-scrollbar "
                    >
                        {formattedMessages.length > 0 ? (
                            formattedMessages.map((msg, index) => (
                                <div key={msg.id} data-index={index} className="flex-shrink-0">
                                    <MessageCard
                                        {...msg}

                                    />
                                </div>
                            ))
                        ) : (
                            <NotFound
                                Icon={MessageSquare}
                                title="Aucun message envoyé"
                                message="Vous n'avez pas encore envoyé de messages."
                                className="bg-none h-[300px] border-none"
                            />
                        )}
                    </div>
                </>
            )}
        </ModalCard>
    );
}
