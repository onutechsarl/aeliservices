import React from 'react';


export function VideoPresentation({ isOpen, onClose, videoSrc }) {
    if (!isOpen) {
        return null
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Lecture vidéo"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
                <div className="aspect-video w-full overflow-hidden rounded-2xl">
                    <video className="h-full w-full" src={videoSrc} controls autoPlay />
                </div>
            </div>
        </div>
    )
}
