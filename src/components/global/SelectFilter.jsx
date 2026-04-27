import React, { useState, useRef, useEffect } from 'react';
import { Filter, ChevronDown } from 'lucide-react';
import { Button } from '../../ui/Button'; // Ajuste le chemin

export const SelectFilter = ({
    options,
    value,
    onChange,
    label = "Secteur",
    className = "",
    classNameButon = "",
    customIcon
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        /**
         * Handles handle click outside behavior.
         */
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative inline-block ${className}`} ref={containerRef}>
            { }
            <Button
                variant="secondary"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between w-full h-[46px] px-4 rounded-xl !font-semibold ${classNameButon}`}
            >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    {customIcon ? customIcon : <Filter size={18} className="text-[#E8524D] flex-shrink-0" />}
                    <span className="text-sm text-gray-700 truncate flex-1 text-left">
                        {value === 'All' || value === 'Tout' ? `Tous les ${label}s` : value}
                    </span>
                </div>
                <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                />
            </Button>

            { }
            {isOpen && (
                <div className="absolute left-0 md:right-0 mt-2 min-w-full bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
                    <div className="p-1.5 flex flex-col gap-0.5">
                        <Button
                            variant={value === 'Tout' ? 'filterSelected' : 'filterGhost'}
                            onClick={() => { onChange(''); setIsOpen(false); }}
                            className="w-full !justify-start"
                        >
                            Toutes les {label}s
                        </Button>

                        <div className="h-px bg-gray-100 my-1 mx-2" />

                        { }
                        {options.map((opt) => (
                            <Button
                                key={opt}
                                variant={value === opt ? 'filterSelected' : 'filterGhost'}
                                onClick={() => { onChange(opt); setIsOpen(false); }}
                                className="w-full !justify-start"
                            >
                                {opt}
                            </Button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};