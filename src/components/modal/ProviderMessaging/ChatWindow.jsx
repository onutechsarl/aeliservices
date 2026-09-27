import React, { useState, useEffect, useRef } from 'react';
import { toast } from "react-toastify";
import { Phone, ArrowLeft, Mail, CheckCheck } from 'lucide-react';
import { Avatar } from '../../../ui/Avatar';
import { StatusMenu } from '../../global/StatusMenu';
import { useUpdateStatusMessage } from '../../../hooks/useContact';

/**
 * UI component responsible for rendering chat window.
 */
export function ChatWindow({ chat, onBack }) {
    const [openMenuId, setOpenMenuId] = useState(null);
    const triggerRefs = useRef({});

    const {
        mutate: mutateUpdateStatus,
        isSuccess: isSuccessUpdateStatus,
        isError: isErrorUpdateStatus,
        data: dataUpdateStatus,
        error: errorUpdateStatus,
        reset: resetUpdateStatus
    } = useUpdateStatusMessage();

    /**
     * Handles handle update status behavior.
     */
    const handleUpdateStatus = (messageId, newStatus) => {
        mutateUpdateStatus({
            id: messageId,
            formData: { status: newStatus }
        });
    };
    useEffect(() => {
        if (isSuccessUpdateStatus && dataUpdateStatus?.success) {
            toast.success(dataUpdateStatus.message);
        }

        if (isErrorUpdateStatus) {
            const mainMessage = errorUpdateStatus?.message;
            toast.error(mainMessage);

            const backendErrors = errorUpdateStatus?.response?.errors;
            if (Array.isArray(backendErrors)) {
                backendErrors.forEach((err) => {
                    toast.info(err.message);
                });
            }
        }

        resetUpdateStatus();
    }, [isSuccessUpdateStatus, isErrorUpdateStatus, dataUpdateStatus, errorUpdateStatus, resetUpdateStatus]);

    if (!chat) return <div className="flex-1 flex items-center justify-center text-gray-400">Sélectionnez une discussion</div>;
    const latestInfo = chat.messages[0].fullData;

    return (
        <div className="flex flex-col h-full w-full">
            <header className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-20">
                <div className="flex items-center">
                    <button onClick={onBack} className="mr-2 p-2 md:hidden text-gray-600 hover:bg-gray-100 rounded-full"><ArrowLeft size={20} /></button>
                    <Avatar src={chat.avatar || `./no-user.jpg`} alt={chat.name} isOnline={chat.isOnline} />
                    <div className="ml-3">
                        <h2 className="text-sm font-bold text-gray-900">{chat.name}</h2>
                        <p className="text-[10px] text-green-500 font-medium italic">Conversation groupée</p>
                    </div>
                </div>
                <div className="flex gap-1 animate-in fade-in zoom-in duration-300">
                    {latestInfo.senderPhone && (
                        <a href={`tel:${latestInfo.senderPhone}`} className="p-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                            <Phone size={18} />
                        </a>
                    )}
                    {latestInfo.senderEmail && (
                        <a href={`mailto:${latestInfo.senderEmail}`} className="p-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                            <Mail size={18} />
                        </a>
                    )}
                </div>

            </header>
            <div className="flex-1 min-h-0 overflow-y-auto py-4 md:p-4 md:p-6 space-y-8 no-scrollbar">
                {[...chat.messages].reverse().map((msg) => (
                    <div key={msg.id} className="flex items-start max-w-full">
                        <Avatar src={chat.avatar || `./no-user.jpg`} size="sm" />
                        <div className="ml-3 flex-1">
                            <div className="flex items-baseline mb-2 gap-2">
                                <span className="font-bold text-gray-900 text-xs">{chat.name}</span>
                                <span className="text-[10px] text-gray-400">{msg.timestamp}</span>
                            </div>

                            <div className="flex flex-col text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm">
                                <p className="text-gray-700 whitespace-pre-wrap">{msg.text}</p>
                                <span className="flex justify-end pt-2">
                                    {msg.fullData.status && (
                                        <span className={`text-[10px] ${msg.fullData.status == "pending" ? "text-gray-500" : "text-green-500"}`}>
                                            <CheckCheck size={14} />
                                        </span>
                                    )}
                                </span>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2 items-center">
                                <button
                                    ref={el => triggerRefs.current[msg.id] = el}
                                    onClick={() => setOpenMenuId(openMenuId === msg.id ? null : msg.id)}
                                    className="px-4 py-1.5 rounded-full border border-purple-400 text-purple-600 text-[10px] font-bold hover:bg-purple-50 transition-colors"
                                >
                                    Changer status
                                </button>
                                <StatusMenu
                                    isOpen={openMenuId === msg.id}
                                    onClose={() => setOpenMenuId(null)}
                                    triggerRef={{ current: triggerRefs.current[msg.id] }}
                                    onUpdateStatus={(newStatus) => handleUpdateStatus(msg.id, newStatus)}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}