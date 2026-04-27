import React from 'react';

export const NotFound = ({
    Icon,
    title = "Aucun élément trouvé",
    message = false,
    className = "",
}) => {
    return (
        <div className={`flex flex-col items-center justify-center py-10 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 ${className}`}>
            <div className="flex flex-col items-center gap-3">
                {Icon && (
                    <div className="p-3 bg-gray-100 rounded-full mb-2">
                        <Icon className="text-gray-400" size={40} />
                    </div>
                )}
                <h2 className="text-2xl font-bold text-gray-600 mb-1 text-center flex items-center justify-center gap-2">
                    {Icon && <Icon className="text-gray-400" size={24} />}
                    <span>{title}</span>
                </h2>
                <span className="text-sm text-gray-500 px-2 text-center max-w-md">{message}</span>
            </div>
        </div>
    );
};