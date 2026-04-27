import React from 'react';
import { Avatar } from '../../../ui/Avatar';

/**
 * UI component responsible for rendering chat list.
 */
export function ChatList({ contacts, onSelectContact, selectedId }) {
    return (
        <div className="flex flex-col h-full md:border-r md:border-gray-200 overflow-hidden w-full">
            <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
                {contacts.length > 0 ? (
                    contacts.map((contact) => {
                        const isSelected = selectedId === contact.id;
                        return (
                            <button key={contact.id} onClick={() => onSelectContact(contact)}
                                className={`w-full flex items-start p-4 transition-all relative text-left hover:bg-gray-50 
                                ${isSelected ? 'bg-orange-50/50' : ''}`}>
                                {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500" />}
                                <Avatar src={contact.avatar || `./no-user.jpg`} alt={contact.name} isOnline={contact.isOnline} />
                                <div className="ml-3 flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline">
                                        <h3 className="text-sm font-bold text-gray-900 truncate">{contact.name}</h3>
                                        <span className="text-[10px] text-gray-400">{contact.lastMessageTime}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 line-clamp-1 mt-1">{contact.lastMessage}</p>
                                </div>
                            </button>
                        )
                    })
                ) : (
                    <div className="p-4 text-center text-gray-400 text-sm">Aucun message</div>
                )}
            </div>
        </div>
    )
}