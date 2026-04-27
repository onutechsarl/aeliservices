import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../ui/Button';
import { DashboardIcon, SearchIcon, StoreIcon, MailIcon, StarIcon } from './Sidebar';
import { useInfoUserConnected } from '../../hooks/useUser';

/**
 * UI component responsible for rendering bottom tab (mobile).
 */
export function BottomTab({ onOpenMessage, onOpenFavorite, activeModal, MODALS, closeModal, isLoading }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { data: userData } = useInfoUserConnected();
    const user = userData?.data?.user;

    const isRouteActive = (path) => !activeModal && location.pathname === path;
    const isModalActive = (id) => activeModal === id;

    const navLinks = [
        { icon: DashboardIcon, path: '/home', label: 'Accueil' },
        { icon: SearchIcon, path: '/search', label: 'Recherche' },
        user?.role === 'provider' && { icon: StoreIcon, path: '/provider', label: 'Mon espace' },
    ].filter(Boolean);

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden z-[1002]">
            <div className="bg-white/95 backdrop-blur border-t border-slate-100 shadow-[0_-8px_24px_-16px_rgba(15,23,42,0.2)]">
                <div className={`grid ${user?.role === 'provider' ? 'grid-cols-5' : 'grid-cols-4'} gap-1 px-2 py-2`}>
                    {navLinks.map((link) => (
                        <button
                            key={link.path}
                            onClick={() => {
                                closeModal();
                                navigate(link.path);
                            }}
                            className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] font-semibold transition-colors
                                ${isRouteActive(link.path) ? 'text-[#E8524D] bg-purple-50' : 'text-slate-400 hover:text-slate-600'}
                            `}
                        >
                            <link.icon className="w-5 h-5" />
                            <span className="truncate">{link.label}</span>
                        </button>
                    ))}
                    <Button
                        type="button"
                        size="none"
                        variant="ghost"
                        disabled={isLoading}
                        onClick={onOpenMessage}
                        className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] font-semibold transition-colors
                            ${isModalActive(MODALS.MESSAGE) ? '!text-[#E8524D] !bg-purple-50' : 'text-slate-400 hover:text-slate-600'}
                        `}
                    >
                        <MailIcon className="w-5 h-5" />
                        <span className="truncate">Messages</span>
                    </Button>

                    <Button
                        type="button"
                        size="none"
                        variant="ghost"
                        disabled={isLoading}
                        onClick={onOpenFavorite}
                        className={`flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[10px] font-semibold transition-colors
                            ${isModalActive(MODALS.FAVORITE) ? '!text-[#E8524D] !bg-purple-50' : 'text-slate-400 hover:text-slate-600'}
                        `}
                    >
                        <StarIcon className="w-5 h-5" />
                        <span className="truncate">Favoris</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
