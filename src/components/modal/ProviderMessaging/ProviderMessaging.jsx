import { useState, useMemo } from 'react'
import { ChatList } from './ChatList'
import { ChatWindow } from './ChatWindow'
import { ModalCard } from '../../../ui/ModalCard'
import { Loading } from '../../global/Loading'
import { NotFound } from '../../global/Notfound'
import { MessageSquare, Users, AlertCircle } from 'lucide-react'
import { useGetReceivedContact } from '../../../hooks/useContact'

/**
 * UI component responsible for rendering provider messaging.
 */
export function ProviderMessaging({ closeMessaging }) {
    const { data: dataRecivedContact, isLoading, isError } = useGetReceivedContact();
    const [selectedId, setSelectedId] = useState(null);
    const [showMobileChat, setShowMobileChat] = useState(false);

    const chatGroups = useMemo(() => {
        const rawContacts = dataRecivedContact?.data?.contacts || [];
        const groups = {};

        rawContacts.forEach(contact => {
            const email = contact.senderEmail;
            if (!groups[email]) {
                groups[email] = {
                    id: email,
                    name: `${contact.sender?.firstName} ${contact.sender?.lastName}` || contact.senderName,
                    avatar: contact.sender?.profilePhoto,
                    isOnline: true,
                    messages: []
                };
            }
            groups[email].messages.push({
                id: contact.id,
                text: contact.message,
                timestamp: new Date(contact.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                isUnlocked: contact.isUnlocked, // On remonte l'info ici
                fullData: contact
            });
        });

        return Object.values(groups);
    }, [dataRecivedContact]);

    useMemo(() => {
        if (chatGroups.length > 0 && !selectedId) {
            setSelectedId(chatGroups[0].id);
        }
    }, [chatGroups, selectedId]);

    const selectedChat = chatGroups.find(c => c.id === selectedId);

    return (
        <ModalCard
            title={
                <div className="flex items-center gap-2">
                    <Users className="text-[#E8524D]" size={20} />
                    Messages clients
                </div>
            }
            closeModal={closeMessaging}
            isWide={true}
        >
            {isLoading ? (
                <Loading className="h-[450px]" size="small" title="Chargement des messages..." />
            ) : isError ? (
                <NotFound
                    Icon={AlertCircle}
                    title="Erreur de chargement"
                    message="Une erreur est survenue lors de la récupération des messages clients."
                    className="h-[450px] border-none"
                />
            ) : chatGroups.length === 0 ? (
                <NotFound
                    Icon={MessageSquare}
                    title="Aucun message trouvé"
                    message="Vous n'avez pas encore reçu de messages de clients."
                    className="h-[450px] border-none"
                />
            ) : (
                <div className="flex overflow-hidden font-sans h-[500px]">
                    <div className={`${showMobileChat ? 'hidden' : 'flex'} md:flex w-full md:w-auto lg:max-w-sm md:max-w-[250px] flex-shrink-0 h-full border-r border-gray-100`}>
                        <ChatList
                            contacts={chatGroups.map(group => ({
                                ...group,
                                lastMessage: group.messages[0].text,
                                lastMessageTime: group.messages[0].timestamp
                            }))}
                            onSelectContact={(c) => { setSelectedId(c.id); setShowMobileChat(true); }}
                            selectedId={selectedId}
                        />
                    </div>
                    <div className={`${showMobileChat ? 'flex' : 'hidden'} md:flex flex-1 h-full bg-gray-50/30 md:w-[400px]`}>
                        <ChatWindow
                            chat={selectedChat}
                            onBack={() => setShowMobileChat(false)}
                        />
                    </div>
                </div>
            )}
        </ModalCard>
    )
}
