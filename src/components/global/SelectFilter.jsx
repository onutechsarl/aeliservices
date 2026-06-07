import React, { useState, useRef, useEffect } from 'react';
import { Filter, ChevronDown, Search } from 'lucide-react';
import { Button } from '../../ui/Button';

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
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef(null);
    const searchInputRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 50);
        }
        if (!isOpen) setSearchQuery('');
    }, [isOpen]);

    const filteredOptions = options.filter(opt =>
        opt.toString().toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={`relative inline-block ${className}`} ref={containerRef}>
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

            {isOpen && (
                <div className="absolute right-0 mt-2 min-w-full bg-white border border-gray-100 rounded-2xl shadow-xl z-50">
                    {options.length > 4 && (
                        <div className="p-2 border-b border-gray-100">
                            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg">
                                <Search size={14} className="text-slate-400 flex-shrink-0" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Rechercher..."
                                    className="flex-1 bg-transparent text-xs text-slate-700 outline-none placeholder:text-slate-400"
                                />
                            </div>
                        </div>
                    )}
                    <div className="p-1.5 flex flex-col gap-0.5 max-h-[250px] overflow-y-auto no-scrollbar">
                        {!searchQuery && (
                            <>
                                <Button
                                    variant={value === 'Tout' ? 'filterSelected' : 'filterGhost'}
                                    onClick={() => { onChange(''); setIsOpen(false); }}
                                    className="w-full !justify-start"
                                >
                                    Toutes les {label}s
                                </Button>
                                <div className="h-px bg-gray-100 my-1 mx-2" />
                            </>
                        )}
                        {filteredOptions.map((opt) => (
                            <Button
                                key={opt}
                                variant={value === opt ? 'filterSelected' : 'filterGhost'}
                                onClick={() => { onChange(opt); setIsOpen(false); }}
                                className="w-full !justify-start"
                            >
                                {opt}
                            </Button>
                        ))}
                        {filteredOptions.length === 0 && (
                            <p className="text-xs text-slate-400 text-center py-3">Aucun résultat</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};