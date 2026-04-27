import React, { useState, useEffect, useMemo } from 'react' // Ajout de useState
import { useLocation, useNavigate } from 'react-router-dom'
import { X, ChevronRight, ChevronLeft, Filter as FilterIcon } from 'lucide-react'
import { Button } from '../../ui/Button';
import { useInfoUserConnected } from '../../hooks/useUser';
import { useLogout } from '../../hooks/useAuth';
import { useGetCategory } from '../../hooks/useServices';

const IconBase = ({ className = '', children }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
)

export const DashboardIcon = ({ className }) => (
  <IconBase className={className}>
    <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor" opacity="0.22" stroke="none" />
    <rect x="13" y="3" width="8" height="6" rx="2" />
    <rect x="13" y="11" width="8" height="10" rx="2" fill="currentColor" opacity="0.16" stroke="none" />
    <rect x="3" y="13" width="8" height="8" rx="2" />
  </IconBase>
)

export const SearchIcon = ({ className }) => (
  <IconBase className={className}>
    <circle cx="11" cy="11" r="6" fill="currentColor" opacity="0.2" stroke="none" />
    <circle cx="11" cy="11" r="5" />
    <path d="M15 15L20 20" />
  </IconBase>
)

export const StoreIcon = ({ className }) => (
  <IconBase className={className}>
    <path d="M4 10L5.6 5.8C5.9 5 6.6 4.5 7.5 4.5H16.5C17.4 4.5 18.1 5 18.4 5.8L20 10" fill="currentColor" opacity="0.2" stroke="none" />
    <path d="M4 10H20V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V10Z" />
    <path d="M9 14H15" />
  </IconBase>
)

export const MailIcon = ({ className }) => (
  <IconBase className={className}>
    <rect x="3" y="5" width="18" height="14" rx="3" fill="currentColor" opacity="0.16" stroke="none" />
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M4.5 7.5L12 13L19.5 7.5" />
  </IconBase>
)

export const UserIcon = ({ className }) => (
  <IconBase className={className}>
    <circle cx="12" cy="8" r="4" fill="currentColor" opacity="0.2" stroke="none" />
    <circle cx="12" cy="8" r="3.5" />
    <path d="M4 20C4.6 16.6 7.8 14 12 14C16.2 14 19.4 16.6 20 20" />
  </IconBase>
)

export const StarIcon = ({ className }) => (
  <IconBase className={className}>
    <path
      d="M12 3.8L14.5 8.8L20 9.6L16 13.5L17 19.2L12 16.6L7 19.2L8 13.5L4 9.6L9.5 8.8L12 3.8Z"
      fill="currentColor"
      opacity="0.2"
      stroke="none"
    />
    <path d="M12 4.2L14.4 9L19.7 9.8L15.8 13.6L16.7 19L12 16.5L7.3 19L8.2 13.6L4.3 9.8L9.6 9L12 4.2Z" />
  </IconBase>
)

export const StatsIcon = ({ className }) => (
  <IconBase className={className}>
    <rect x="4" y="10" width="3" height="10" rx="1" fill="currentColor" opacity="0.2" stroke="none" />
    <rect x="10.5" y="6" width="3" height="14" rx="1" fill="currentColor" opacity="0.2" stroke="none" />
    <rect x="17" y="3" width="3" height="17" rx="1" fill="currentColor" opacity="0.2" stroke="none" />
    <path d="M4 20H20" />
    <path d="M5.5 10V20" />
    <path d="M12 6V20" />
    <path d="M18.5 3V20" />
  </IconBase>
)

export const LogoutIcon = ({ className }) => (
  <IconBase className={className}>
    <rect x="3" y="4" width="9" height="16" rx="2" fill="currentColor" opacity="0.18" stroke="none" />
    <path d="M10 12H21" />
    <path d="M17.5 8.5L21 12L17.5 15.5" />
    <path d="M12 5H6C4.9 5 4 5.9 4 7V17C4 18.1 4.9 19 6 19H12" />
  </IconBase>
)

/**
 * UI component responsible for rendering sidebar.
 */
export function Sidebar({ isOpenSidebar, showStats, onOpenMessage, onOpenFavorite, onOpenReview, activeModal, MODALS, isOpen, onClose, closeModal, isLoading, filters, setFilters }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { data: userData } = useInfoUserConnected();
  const { mutate: logout, isPending: isLogoutPending } = useLogout();
  const user = userData?.data?.user;
  const { data: categoryData } = useGetCategory();
  const categoriesFromApi = categoryData?.data?.categories || [];

  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  const selectedCategoryId = filters?.categoryId || ''

  const navLinks = [
    { icon: DashboardIcon, path: '/home', label: 'Accueil' },
    { icon: SearchIcon, path: '/search', label: 'Recherche' },
    user?.role === "provider" && { icon: StoreIcon, path: '/provider', label: 'Mon espace' },
    { icon: UserIcon, path: '/profile', label: 'Profil' },
  ].filter(Boolean);

  useEffect(() => {
    isOpenSidebar(isCollapsed)
  }, [isCollapsed])

  useEffect(() => {
    if (isOpen) {
      setIsCollapsed(false)
    }
  }, [isOpen])

  const categoryOptions = useMemo(() => ([
    { value: '', label: 'Toutes les catégories' },
    ...categoriesFromApi.map(cat => ({ value: cat.id, label: cat.name }))
  ]), [categoriesFromApi]);

  const handleCategoryChange = (categoryId) => {
    navigate("/home");
    onClose();
    setFilters((prev) => ({
      ...prev,
      categoryId
    }));
  };

  /**
   * Handles handle logout behavior.
   */
  const handleLogout = () => {
    logout(undefined, {
      onSettled: () => {
        localStorage.clear();
        onClose();
        closeModal();
        navigate('/login');
      },
    });
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[1003] md:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed md:sticky left-0 top-0 h-screen z-[1003]
        flex flex-col py-8 bg-white border-r border-gray-100
        transition-all duration-300 ease-in-out 
        
        
        w-70 ${isCollapsed ? 'md:w-20' : 'md:w-64'}
        
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0
      `}>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3 top-10 bg-[#E8524D] border border-gray-100 rounded-full p-2 shadow-sm hover:text-purple-600 transition-colors z-50 "
        >
          {isCollapsed ? <ChevronRight size={16} className="text-white" /> : <ChevronLeft size={16} className="text-white" />}
        </button>
        <div className={`flex items-center justify-between w-full px-6 mb-12 ${isCollapsed ? 'md:justify-center md:px-0' : 'md:justify-start md:px-6'}`}>
          <div className="flex items-center gap-3">
            <img src='./aelilogo.svg' alt='logo' className="w-10 h-10 flex-shrink-0" />
            <span className={`font-bold text-xl  md:transition-opacity pacifico-regular ${isCollapsed ? 'md:hidden' : 'md:block'}`}>
              AELI Services
            </span>
          </div>
          <Button
            variant="close"
            size="none"
            isCircle={true}
            onClick={onClose}
            className="md:hidden p-2 text-gray-400"
            aria-label="Fermer"
          >
            <X size={24} />
          </Button>
        </div>

        <nav className="flex-1 flex flex-col gap-4 w-full px-4 overflow-y-auto min-h-0">
          {navLinks.slice(0, 2).map((link) => {
            const isActive = location.pathname === link.path
            return (
              <button
                key={link.path}
                onClick={() => { navigate(link.path); onClose(); closeModal(); }}
                className={`p-3 rounded-xl transition-all duration-200 group relative flex items-center gap-4
                  ${isCollapsed ? 'md:justify-center' : 'md:justify-start'}
                  ${isActive ? 'bg-purple-50 text-[#E8524D] shadow-sm' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}
                `}
              >
                <link.icon className="w-6 h-6 flex-shrink-0" />
                <span className={`text-sm font-semibold truncate ${isCollapsed ? 'md:hidden' : 'md:block'}`}>
                  {link.label}
                </span>

                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#E8524D] rounded-r-full -ml-4" />
                )}
              </button>
            )
          })}

          <div className="w-full">
            <button
              type="button"
              onClick={() => setIsCategoryOpen((prev) => !prev)}
              className={`w-full p-3 rounded-xl transition-all duration-200 flex items-center gap-4
                ${isCollapsed ? 'md:justify-center' : 'md:justify-start'}
                ${isCategoryOpen ? 'bg-purple-50 text-[#E8524D] shadow-sm' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}
              `}
            >
              <FilterIcon className="w-6 h-6 flex-shrink-0" />
              <span className={`text-sm font-semibold truncate ${isCollapsed ? 'md:hidden' : 'md:block'}`}>
                Catégories
              </span>
            </button>

            {(!isCollapsed || isOpen) && isCategoryOpen && (
              <div className="mt-2 pl-12 flex flex-col gap-1">
                {categoryOptions.map((cat) => (
                  <button
                    key={cat.value || 'all'}
                    onClick={() => handleCategoryChange(cat.value)}
                    className={`text-left text-xs font-semibold rounded-lg px-3 py-2 transition-colors
                      ${selectedCategoryId === cat.value ? 'bg-red-50 text-[#E8524D]' : 'text-gray-500 hover:bg-gray-50'}
                    `}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {user?.role === "provider" && (
            <button
              onClick={() => {
                navigate('/provider', { state: { showStats: true } })
                onClose()
                closeModal()
              }}
              className={`lg:hidden p-3 rounded-xl transition-all duration-200 group relative flex items-center gap-4
                ${isCollapsed ? 'md:justify-center' : 'md:justify-start'}
                ${showStats ? 'bg-purple-50 text-[#E8524D] shadow-sm' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}
              `}
            >
              <StatsIcon className="w-6 h-6 flex-shrink-0" />
              <span className={`text-sm font-semibold truncate ${isCollapsed ? 'md:hidden' : 'md:block'}`}>
                Mes stats
              </span>
            </button>
          )}

          {navLinks.slice(2).map((link) => {
            const isActive = location.pathname === link.path
            return (
              <button
                key={link.path}
                onClick={() => { navigate(link.path); onClose(); closeModal(); }}
                className={`p-3 rounded-xl transition-all duration-200 group relative flex items-center gap-4
                  ${isCollapsed ? 'md:justify-center' : 'md:justify-start'}
                  ${isActive ? 'bg-purple-50 text-[#E8524D] shadow-sm' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}
                `}
              >
                <link.icon className="w-6 h-6 flex-shrink-0" />
                <span className={`text-sm font-semibold truncate ${isCollapsed ? 'md:hidden' : 'md:block'}`}>
                  {link.label}
                </span>

                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#E8524D] rounded-r-full -ml-4" />
                )}
              </button>
            )
          })}

          <div className="w-full h-px bg-gray-100 " />

          { }
          {[
            { icon: MailIcon, label: 'Messages', onClick: onOpenMessage, id: MODALS.MESSAGE },
            { icon: StarIcon, label: 'Favoris', onClick: onOpenFavorite, id: MODALS.FAVORITE }
          ].map((item, idx) => (
            <button
              key={idx}
              disabled={isLoading}
              onClick={item.onClick}
              className={`p-3 rounded-xl transition-all duration-200 flex items-center gap-4
                ${isCollapsed ? 'md:justify-center' : 'md:justify-start'}
                ${activeModal === item.id ? 'bg-purple-50 text-[#E8524D] shadow-sm' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}
              `}
            >
              <item.icon className="w-6 h-6 flex-shrink-0" />
              <span className={`text-sm font-semibold truncate ${isCollapsed ? 'md:hidden' : 'md:block'}`}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>

        { }
        <div className="flex flex-col gap-6 w-full px-4 mt-auto">
          <div className="w-full h-px bg-gray-100" />
          <button
            disabled={isLogoutPending}
            onClick={handleLogout}
            className={`p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed ${isCollapsed ? 'md:justify-center' : 'md:justify-start'}`}
          >
            <LogoutIcon className="w-6 h-6 flex-shrink-0" />
            <span className={`text-sm font-semibold truncate ${isCollapsed ? 'md:hidden' : 'md:block'}`}>
              {isLogoutPending ? 'Déconnexion...' : 'Déconnexion'}
            </span>
          </button>
        </div>
      </aside>
    </>
  )
}
