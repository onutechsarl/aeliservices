import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "../../ui/Button";
import {
  LayoutDashboard,
  Users,
  UserCircle,
  CreditCard,
  TrendingUp,
  ShieldCheck,
  Lock,
  X,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Image,
} from "lucide-react";

/**
 * UI component responsible for rendering the sidebar section.
 */
export function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboards", path: "/dashboard" },
    { icon: Users, label: "Prestataire", path: "/provider" },
    { icon: CreditCard, label: "Paiements", path: "/subscriptions" },
    { icon: TrendingUp, label: "Boost", path: "/feature" },
    { icon: UserCircle, label: "Utilisateurs", path: "/users" },
    { icon: ShieldCheck, label: "Moderation", path: "/moderation" },
    { icon: Image, label: "Bannières", path: "/banners" },
    { icon: Lock, label: "Securite", path: "security" },
  ];

  return (
    <>
      <div
        className={`fixed inset-0 bg-zinc-900/20 backdrop-blur-sm z-[60] lg:hidden transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        onClick={onClose}
      />

      <aside
        className={`
                    fixed top-0 left-0 z-[70] h-full bg-white border-r border-slate-100 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                    lg:sticky lg:translate-x-0

                    ${isCollapsed ? "w-[80px]" : "w-[280px]"}

                    ${isOpen ? "translate-x-0" : "-translate-x-full"}
                `}
      >
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-12 bg-zinc-900 text-white rounded-full p-2 shadow-lg z-[80] hover:scale-110 transition-transform"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div
          className={`p-6 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}
        >
          <div className="flex items-center gap-3">
            <img src="./logo.png" className="w-10 h-10 flex-shrink-0" />
            <span
              className={`font-bold text-xl  md:transition-opacity pacifico-regular ${isCollapsed ? "hidden" : "flex"}`}
            >
              AELI services
            </span>
          </div>
          <Button
            variant="secondary"
            size={false}
            onClick={onClose}
            className="lg:hidden relative p-2.5 shadow-sm "
          >
            <X size={24} className="text-gray-500" />
          </Button>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto overflow-x-hidden">
          {menuItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={({ isActive }) => `
                                flex items-center gap-4 py-3 rounded-xl text-sm font-bold transition-all
                                ${isCollapsed ? "justify-center px-0" : "px-4"}
                                ${isActive
                  ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200"
                  : "text-zinc-500 hover:bg-zinc-50"
                }
                            `}
              title={isCollapsed ? item.label : ""}
            >
              <item.icon size={20} className="flex-shrink-0" />
              <span
                className={`whitespace-nowrap transition-all duration-300 ${isCollapsed
                  ? "hidden opacity-0 w-0 invisible"
                  : "flex opacity-100 visible"
                  }`}
              >
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        <div className={`${isCollapsed ? "py-6" : "p-6"} relative z-10`}>
          <div
            className={`relative overflow-hidden bg-white/40 border border-white  shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] group ${isCollapsed ? "px-0" : "px-6 rounded-[2.5rem]"}`}
          >
            <div className="absolute top-0 right-0 p-2 opacity-5">
              <Sparkles size={80} />
            </div>

            <div className="relative z-10 text-center">
              <img
                src="/icon-documentation.svg"
                alt="Help Illustration"
                className={`mx-auto  ${isCollapsed ? "w-[150px]" : "w-25"}`}
              />
              <h4
                className={`${isCollapsed ? "hidden" : "blcok"} font-black text-zinc-900 text-sm mb-1 uppercase tracking-wider`}
              >
                Assistance
              </h4>
              <p
                className={`${isCollapsed ? "hidden" : "block"}  text-[11px] text-zinc-400 mb-5 font-medium`}
              >
                Système d'aide actif 24/7
              </p>
              <Button
                onClick={() => {onClose(); navigate("documentation")}}
                variant="primary">
                <span className="relative z-10 ">
                  Doc{!isCollapsed && "umentation"}{" "}
                </span>
              </Button>
            </div>
          </div>
        </div>

        <div className="px-8 pb-4">
          <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-300 tracking-[0.3em] uppercase">
            <div className="w-1 h-1 bg-green-400 rounded-full animate-ping" />
            <span className={`${isCollapsed ? "hidden" : "flex"} `}>
              {" "}
              System v1.0.0
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
