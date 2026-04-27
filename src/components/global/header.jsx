import React, { useState, useEffect } from 'react';
import { Search, Bell, Menu, Star, Coins, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SelectFilter } from './SelectFilter';
import { Button } from '../../ui/Button';
import { useInfoUserConnected } from '../../hooks/useUser';

/**
 * UI component responsible for rendering header.
 */
export function Header({ onOpenMenu, openSidebar, filters, setFilters }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [date, setDate] = useState('');

  const { data: userData } = useInfoUserConnected();
  const user = userData?.data?.user;

  const [query, setQuery] = useState("")
  const [rating, setRating] = useState('Tout')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  const isSearchPage = location.pathname === '/search'

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])


  /**
   * useEffect date.
   */
  useEffect(() => {
    const today = new Date();
    const weekday = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(today);
    const day = today.getDate();
    const month = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(today);
    const year = today.getFullYear();
    const cleanWeekday = weekday.replace('.', '').charAt(0).toUpperCase() + weekday.replace('.', '').slice(1);
    const cleanMonth = month.replace('.', '');

    setDate(`${cleanWeekday}, ${day} ${cleanMonth} ${year}`);
  }, []);

  /**
   * Handles handle search change behavior.
   */
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setFilters(prev => ({ ...prev, search: value })); // Met à jour le contexte
    if (value.length > 0 && location.pathname !== '/search') {
      navigate('/search');
    }
  };

  /**
   * Handles handle price change behavior.
   */
  const handlePriceChange = (e) => {
    setFilters(prev => ({ ...prev, maxPrice: e.target.value }));
  };

  /**
   * Handles handle rating change behavior.
   */
  const handleRatingChange = (val) => {
    setRating(val);
    const numericRating = val.replace('+', ''); // Transforme "4.0+" en "4.0"
    setFilters(prev => ({ ...prev, minRating: numericRating }));
  };

  const isExpanded = query.length > 0
  const showFilters = isSearchPage && (isMobile || isExpanded)

  return (
    <header className={`flex flex-col md:flex-row md:items-start ${openSidebar ? "justify-between " : "justify-end "} gap-4 mb-8`}>
      <div className="w-full flex items-center justify-between gap-4 md:hidden">
        <div className="flex items-center gap-3">
          <img src='./aelilogo.svg' alt='logo' className="w-10 h-10 flex-shrink-0" />
          <span className="font-bold text-xl pacifico-regular">AELI Services</span>
        </div>
        <Button onClick={onOpenMenu}
          variant="secondary"
          size={false}
          className="p-2.5 shadow-sm">
          <Menu className="w-6 h-6 " />
        </Button>
      </div>
      <div className={`w-full flex items-center justify-between gap-4 ${openSidebar ? "flex" : "md:hidden lg:flex"}`}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Bienvenue, <span className="text-[#E8524D] pacifico-regular text-3xl"> {user?.firstName}</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">{date}</p>
        </div>
        <div onClick={() => navigate("/profile")} className='cursor-pointer md:hidden'>
          <img
            src={user?.profilePhoto || `./no-user.jpg`}
            alt="Profile"
            className="w-10.5 h-10 rounded-xl object-cover border-2 border-white shadow-sm hover:scale-105 transition-transform"
          />
        </div>
      </div>
      <div className="relative flex w-auto items-center justify-end gap-4">
        <div className="flex w-full flex-col gap-4">
          <div className={`relative transition-all duration-500 w-full md:w-80`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={handleSearchChange}
              autoFocus={isSearchPage}
              placeholder="Rechercher un service..."
              className="w-full pl-10 pr-10 py-2.5 h-[48px] bg-white md:border md:border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-[#FCE0D6] outline-none md:shadow-sm"
            />
            {isExpanded && (
              <Button
                onClick={() => setQuery("")}
                variant="ghost"
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </Button>
            )}
          </div>
          <div className={`absolute top-14 right-0 left-0 w-full items-center gap-2 transition-all duration-500 z-[2]
            ${showFilters ? 'flex opacity-100 translate-y-0' : 'hidden opacity-0 -translate-y-2 pointer-events-none'}
          `}>
            <div className="flex flex-1 items-center gap-2 bg-white md:border md:border-gray-100 px-3 rounded-xl md:shadow-sm transition-colors">
              <Coins color="gold" size={20} />
              <input
                type="number"
                onChange={handlePriceChange}
                placeholder="Prix Max"
                className="w-full outline-none text-[11px] font-medium bg-transparent py-[14px]"
              />
            </div>
            <div className="flex-1">
              <SelectFilter
                label="Note"
                options={['0.0', '1.0', '1.5', '2.0', '2.5', '3.0', '3.5', '4.0', '4.5', '5.0']}
                value={rating}
                onChange={handleRatingChange}
                className="w-full border-none shadow-none"
                classNameButon="border-none md:shadow-sm "
                customIcon={<Star size={16} className="text-yellow-400 fill-yellow-400" />}
              />
            </div>
          </div>
        </div>
        <Button
          variant="secondary"
          size={false}
          className="relative p-2.5 shadow-sm !hidden"
        >
          <Bell className="w-5 h-5 text-gray-500" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </Button>
        <div onClick={() => navigate("/profile")} className='w-14 cursor-pointer hidden md:block'>
          <img
            src={user?.profilePhoto || `https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}&background=random&color=fff&size=128`}
            alt="Profile"
            className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm hover:scale-105 transition-transform"
          />
        </div>
      </div>
    </header>
  )
}