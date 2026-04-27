import React, { useEffect, useRef, useState } from 'react'
import { MessageSquare, Clock, CheckCheck, SendHorizontal } from 'lucide-react' // Nouvelles icônes plus adaptées
import { Button } from '../../ui/Button'
import { Portal } from '../../ui/Portal'

/**
 * UI component responsible for rendering status menu.
 */
export function StatusMenu({ isOpen, onClose, triggerRef, onUpdateStatus }) {
    const menuRef = useRef(null)
    const [coords, setCoords] = useState({ top: 0, left: 0 })

    const STATUS_OPTIONS = [
        {
            id: 'pending',
            label: 'En attente',
            icon: Clock,
            color: 'text-amber-500'
        },
        {
            id: 'read',
            label: 'Lu',
            icon: CheckCheck,
            color: 'text-blue-500'
        },
        {
            id: 'replied',
            label: 'Répondu',
            icon: SendHorizontal,
            color: 'text-green-500'
        },
    ]

    useEffect(() => {
        if (isOpen && triggerRef?.current) {
            const rect = triggerRef.current.getBoundingClientRect();

            setCoords({
                top: rect.top + window.scrollY - 130,
                left: rect.left + window.scrollX - 40
            });
        }
    }, [isOpen, triggerRef]);

    useEffect(() => {
        if (!isOpen) return;
        /**
         * Handles handle click outside behavior.
         */
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target) && !triggerRef.current.contains(e.target)) {
                onClose();
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen, onClose, triggerRef])

    if (!isOpen) return null

    return (
        <Portal>
            <div
                ref={menuRef}
                style={{ position: 'absolute', top: `${coords.top}px`, left: `${coords.left}px` }}
                className="bg-white rounded-xl shadow-2xl border border-gray-100 w-44 z-[1002] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            >
                <div className="flex flex-col">
                    {STATUS_OPTIONS.map((status, index) => (
                        <div
                            key={status.id}
                            className={`${index !== STATUS_OPTIONS.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-gray-50`}
                        >
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full gap-3 px-4 py-3 text-xs justify-start font-medium"
                                onClick={() => {
                                    onUpdateStatus(status.id);
                                    onClose();
                                }}
                            >
                                <status.icon size={16} className={status.color} />
                                <span>{status.label}</span>
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </Portal>
    )
}