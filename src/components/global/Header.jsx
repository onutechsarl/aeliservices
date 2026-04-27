import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, Bell, Menu, X } from "lucide-react";
import { Button } from "../../ui/Button";

/**
 * UI component responsible for rendering the header section.
 */
export function Header({ onMenuClick, filters, setFilters }) {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const [query, setQuery] = useState(filters?.search || "");

  const getHeaderContent = () => {
    if (pathname.startsWith("/dashboard")) {
      return {
        title: "Tableau de bord",
        subtitle: "Vue d'ensemble de votre activité",
      };
    }
    if (pathname.startsWith("/provider")) {
      return {
        title: "Gestion des Prestataires",
        subtitle: "Gérez vos salons et professionnels enregistrés",
      };
    }
    if (pathname.startsWith("/subscriptions")) {
      return {
        title: "Abonnements",
        subtitle: "Suivi des paiements et des formules",
      };
    }
    if (pathname.startsWith("/feature")) {
      return {
        title: "Mise en avant",
        subtitle: "Gérez la visibilité des services",
      };
    }
    if (pathname.startsWith("/users")) {
      return {
        title: "Gestion des Utilisateurs",
        subtitle: "Liste et gestion des comptes clients",
      };
    }
    if (pathname.startsWith("/moderation")) {
      return {
        title: "Modération",
        subtitle: "Contrôle des avis et contenus signalés",
      };
    }
    if (pathname.startsWith("/security")) {
      return {
        title: "Sécurité",
        subtitle: "Paramètres d'accès et logs système",
      };
    }
    if (pathname.startsWith("/banners")) {
      return { title: "Bannière", subtitle: "Gérez vos bannières" };
    }
    if (pathname.startsWith("/documentation")) {
      return { title: "Documentation", subtitle: "Guide d'utilisation" };
    }
    return {
      title: "Administration",
      subtitle: "Bienvenue sur votre espace de gestion",
    };
  };

  const { title, subtitle } = getHeaderContent();

  /**
   * Handles search change behavior.
   */
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    setFilters((prev) => ({ ...prev, search: value }));

    if (value.length > 0 && pathname !== "/feature") {
      navigate("/feature");
    }
  };

  const clearSearch = () => {
    setQuery("");
    setFilters((prev) => ({ ...prev, search: "" }));
  };

  return (
    <header className="p-4 lg:p-8 z-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="w-full flex items-center justify-between gap-4 lg:hidden">
          <div className="flex items-center gap-3">
            <img src='./logo.png' alt='logo' className="w-10 h-10 flex-shrink-0" />
            <span className="font-bold text-xl pacifico-regular">AELI Services</span>
          </div>
          <Button
            variant="secondary"
            size={false}
            onClick={onMenuClick}
            className="lg:hidden relative p-2.5 shadow-sm h-fit"
          >
            <Menu className="w-6 h-6 text-gray-500" />
          </Button>
        </div>
        <div className="flex flex-col md:flex-row w-full justify-between">
          <div className="flex gap-4 mb-4 md:mb-0">
            <div>
              <h1 className="text-xl md:text-2xl text-gray-700 font-bold lg:pacifico-regular">
                {title}
              </h1>
              <p className="text-sm text-gray-500">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-full block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={handleSearchChange}
                placeholder="Rechercher..."
                className="pl-10 pr-10 py-[10px] rounded-md bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#FCE0D6] focus:border-transparent w-full md:w-64 shadow-sm border border-gray-100"
              />

              {query.length > 0 && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex hidden items-center gap-2">
              <Button
                variant="secondary"
                size={false}
                className="relative p-2.5 shadow-sm"
              >
                <Bell className="w-5 h-5 text-gray-500" />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </Button>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}
