import React from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'

/**
 * UI component responsible for rendering modal card.
 */
export function ModalCard({
    title = false,
    children,
    closeModal,
    isWide = false
}) {
    return (
        <div
            onClick={() => closeModal()}
            className="fixed w-full bg-black/60 backdrop-blur-sm h-screen flex flex-col z-[1002] "
        >
            <div

                onClick={(e) => e.stopPropagation()}
                className={`w-full md:w-fit   h-full flex flex-col bg-[#FAFAFB] px-4`}
            >
                {title && (
                    <header className="py-6 md:py-10 flex-shrink-0">
                        <h1 className="text-2xl md:text-3xl font-bold text-[#0F172A]">{title}</h1>
                        <Button
                            variant="close"
                            size="none"
                            isCircle={true}
                            onClick={closeModal}
                            className="md:hidden absolute top-5 right-4 z-10 p-2"
                            aria-label="Fermer"
                        >
                            <X size={24} />
                        </Button>
                    </header>
                )}

                <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] flex-1 min-h-0 ">
                    {children}
                </div>
            </div>
        </div>
    )
}