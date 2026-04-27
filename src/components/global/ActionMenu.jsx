import React, { useEffect, useRef, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '../../ui/Button'
import { Portal } from '../../ui/Portal'

/**
 * UI component responsible for rendering action menu.
 */
export function ActionMenu({ isOpen, onClose, triggerRef, onEdit, onDelete }) {
    const menuRef = useRef(null)
    const [coords, setCoords] = useState({ top: 0, left: 0 })

    useEffect(() => {
        if (isOpen && triggerRef?.current) {

            const rect = triggerRef.current.getBoundingClientRect();

            setCoords({
                top: rect.top + window.scrollY - 80, // -80 pour l'afficher juste au dessus
                left: rect.left + window.scrollX - 100 // Ajuste selon la largeur de ton menu
            });
        }
    }, [isOpen, triggerRef]);

    useEffect(() => {
        if (!isOpen) return;

        /**
         * Handles handle click outside behavior.
         */
        function handleClickOutside(event) {
            if (
                menuRef.current && !menuRef.current.contains(event.target) &&
                triggerRef?.current && !triggerRef.current.contains(event.target)
            ) {
                onClose()
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
                style={{
                    position: 'absolute',
                    top: `${coords.top}px`,
                    left: `${coords.left}px`
                }}
                className="bg-white rounded-xl shadow-xl border border-gray-100 w-40 z-[999] animate-in fade-in zoom-in-95 duration-200"
            >
                <div className="flex flex-col ">
                    <div className="border-b border-gray-300 hover:bg-gray-50 rounded-tl-xl rounded-tr-xl">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full gap-2 px-3 py-[13px] text-xs justify-start "
                            onClick={() => { onEdit?.(); onClose(); }}
                        >
                            <Pencil size={14} />
                            <span>Modifier</span>
                        </Button>
                    </div>
                    <div className="hover:bg-red-50 rounded-bl-xl rounded-br-xl">
                        <Button
                            variant="ghostDanger"
                            size="sm"
                            className="w-full gap-2 px-3 py-3 text-xs justify-start"
                            onClick={() => { onDelete?.(); onClose(); }}
                        >
                            <Trash2 size={14} />
                            <span>Supprimer</span>
                        </Button>
                    </div>
                </div>
            </div>
        </Portal>
    )
}