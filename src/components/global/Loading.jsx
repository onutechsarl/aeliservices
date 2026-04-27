import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import animationData from '../../assets/Loading.json';

/**
 * UI component responsible for rendering loading.
 */
export function Loading({ className = "", size = "default", title }) {
    const sizeClasses = {
        small: "w-20 h-20",
        default: "w-35 h-35",
        large: "w-48 h-48"
    };

    return (
        <div className={`flex flex-col items-center justify-center flex-1 w-full h-full ${className}`}>
            <div className={sizeClasses[size] || sizeClasses.default}>
                <DotLottieReact
                    data={animationData}
                    loop
                    autoplay
                />
            </div>
            {title && (
                <div className="flex flex-col items-center gap-2 mt-4">
                    <h3 className="text-lg font-semibold text-gray-600">{title}</h3>
                </div>
            )}
        </div>
    );
};
