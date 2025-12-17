import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useData } from "../contexts/DataContext";
import {
  LayoutDashboard,
  Users,
  Calendar,
  DollarSign,
  PieChart,
  Settings,
  UserPlus,
  FileText,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Stethoscope,
  HelpCircle,
  Sun,
  Moon,
} from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar }) => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useData();
  const [activeTooltip, setActiveTooltip] = useState<{
    label: string;
    top: number;
  } | null>(null);

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/crm", icon: UserPlus, label: "Comercial" },
    { to: "/agenda", icon: Calendar, label: "Agenda" },
    { to: "/patients", icon: Users, label: "Pacientes" },
    { to: "/documents", icon: FileText, label: "Documentos" },
    { to: "/financial", icon: DollarSign, label: "Financeiro" },
    { to: "/reports", icon: PieChart, label: "RelatÃ³rios" },
    { to: "/settings", icon: Settings, label: "Configurações" },
  ];

  const showTooltip = (e: React.MouseEvent<HTMLElement>, label: string) => {
    e.stopPropagation();
    if (!isCollapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveTooltip({
      label,
      top: rect.top + rect.height / 2,
    });
  };

  const hideTooltip = () => setActiveTooltip(null);

  return (
    <>
      {/* Sidebar Container - Fills the parent div in App.tsx */}
      <div className="flex flex-col h-full w-full relative">
        {/* Header / Logo */}
        <div
          className={`h-20 flex items-center border-b border-gray-100 dark:border-gray-700 transition-all duration-300 flex-shrink-0 ${
            isCollapsed ? "justify-center px-0" : "justify-start px-6"
          }`}
        >
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-lg shadow-blue-200 dark:shadow-none">
              C
            </div>
            <span
              className={`text-xl font-bold text-gray-800 dark:text-white tracking-tight transition-all duration-300 origin-left
                ${
                  isCollapsed
                    ? "w-0 opacity-0 scale-0"
                    : "w-auto opacity-100 scale-100"
                }`}
            >
              ClinicPro
            </span>
          </div>
        </div>

        {/* Navigation - Scrollable if height is too small */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 scrollbar-hide">
          <ul className="space-y-2 px-3">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onMouseEnter={(e) => showTooltip(e, item.label)}
                  onMouseLeave={hideTooltip}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative
                  ${
                    isActive
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-blue-100 dark:ring-blue-800"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200"
                  }
                  ${isCollapsed ? "justify-center" : ""}`
                  }
                >
                  <item.icon
                    size={22}
                    className={`shrink-0 transition-transform duration-200 ${
                      isCollapsed ? "group-hover:scale-110" : ""
                    }`}
                  />

                  <span
                    className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300
                    ${
                      isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100 ml-1"
                    }`}
                  >
                    {item.label}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Collapse Toggle Button */}
        <div className="absolute -right-3 top-24 z-40">
          <button
            onClick={toggleSidebar}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 transition-all shadow-sm hover:scale-110 active:scale-95"
            title={isCollapsed ? "Expandir Menu" : "Recolher Menu"}
          >
            {isCollapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronLeft size={14} />
            )}
          </button>
        </div>

        {/* Footer / User Profile */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
          {/* Support Link */}
          <button
            onClick={() => navigate("/support")}
            onMouseEnter={(e) => showTooltip(e, "Ajuda e Suporte")}
            onMouseLeave={hideTooltip}
            className={`w-full flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group relative
            ${isCollapsed ? "justify-center" : ""}`}
          >
            <HelpCircle size={20} />
            <span
              className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${
                isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
              }`}
            >
              Ajuda
            </span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            onMouseEnter={(e) =>
              showTooltip(e, theme === "dark" ? "Modo Claro" : "Modo Escuro")
            }
            onMouseLeave={hideTooltip}
            className={`w-full flex items-center gap-3 px-3 py-2.5 mb-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors group relative
            ${isCollapsed ? "justify-center" : ""}`}
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            <span
              className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${
                isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
              }`}
            >
              {theme === "dark" ? "Modo Claro" : "Modo Escuro"}
            </span>
          </button>

          {/* Profile Card */}
          <div
            onClick={() => navigate("/profile")}
            onMouseEnter={(e) => showTooltip(e, "Meu Perfil")}
            onMouseLeave={hideTooltip}
            className={`flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-all duration-200 group relative
            ${
              isCollapsed
                ? "justify-center"
                : "bg-gray-50/50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-600"
            }`}
          >
            <div className="relative shrink-0">
              <img
                src="https://i.pravatar.cc/300?img=11"
                alt="User"
                className="w-9 h-9 rounded-full object-cover border-2 border-white dark:border-gray-600 shadow-sm"
              />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-600 rounded-full"></div>
            </div>

            <div
              className={`overflow-hidden transition-all duration-300 ${
                isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
              }`}
            >
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate w-32">
                Dr. Marcelo
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate uppercase font-bold tracking-wider">
                Admin
              </p>
            </div>
          </div>

          {/* Logout Quick Link (Visible when Expanded) */}
          {!isCollapsed && (
            <div className="mt-3 flex justify-center">
              <button className="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors uppercase tracking-wide">
                <LogOut size={12} /> Sair
              </button>
            </div>
          )}
        </div>
      </div>

      {/* PORTAL-LIKE TOOLTIP (Fixed Position) */}
      {isCollapsed && activeTooltip && (
        <div
          className="fixed left-20 ml-3 z-[9999] px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-medium rounded-lg shadow-xl whitespace-nowrap pointer-events-none transform -translate-y-1/2 animate-in fade-in slide-in-from-left-2 duration-200"
          style={{ top: activeTooltip.top }}
        >
          {activeTooltip.label}
          <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-white"></div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
