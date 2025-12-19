import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
    LayoutDashboard,
    Users,
    Calendar,
    DollarSign,
    PieChart,
    Settings,
    FileText,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Menu,
    Megaphone,
    TrendingUp
} from "lucide-react";

interface SidebarProps {
    isCollapsed: boolean;
    toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar }) => {
    const { signOut, profile } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        signOut();
        navigate("/login");
    };

    const navItems = [
        { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { path: "/crm", label: "Comercial", icon: TrendingUp },
        { path: "/patients", label: "Pacientes", icon: Users },
        { path: "/agenda", label: "Agenda", icon: Calendar },
        { path: "/financial", label: "Financeiro", icon: DollarSign },
        { path: "/documents", label: "Central Docs", icon: FileText },
        { path: "/reports", label: "Relatórios", icon: PieChart },
        { path: "/settings", label: "Configurações", icon: Settings },
    ];

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 transition-all duration-300">

            {/* Header / Logo Area */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-gray-800">
                {!isCollapsed && (
                    <div className="font-bold text-xl text-blue-600 dark:text-blue-400 animate-in fade-in duration-200">
                        ClinicPro
                    </div>
                )}
                <button
                    onClick={toggleSidebar}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    {isCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            {/* Navigation Items */}
            <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden space-y-1 px-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group relative
              ${isActive
                                ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-medium"
                                : "hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                            }`
                        }
                    >
                        <item.icon
                            size={20}
                            className={`shrink-0 transition-colors ${isCollapsed ? "mx-auto" : "mr-3"
                                }`}
                        />
                        {!isCollapsed && (
                            <span className="truncate animate-in fade-in duration-200">
                                {item.label}
                            </span>
                        )}

                        {/* Tooltip for collapsed state */}
                        {isCollapsed && (
                            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                                {item.label}
                            </div>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* User Profile & Logout */}
            <div className="border-t border-gray-100 dark:border-gray-800 p-3">
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-2`}>
                    <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0 text-xs font-bold text-gray-600 dark:text-gray-300">
                            {profile?.name?.substring(0, 2).toUpperCase() || 'US'}
                        </div>
                        {!isCollapsed && (
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {profile?.name || 'Usuário'}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {profile?.clinic_id || 'Clínica'}
                                </span>
                            </div>
                        )}
                    </div>

                    {!isCollapsed && (
                        <button
                            onClick={handleLogout}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Sair"
                        >
                            <LogOut size={18} />
                        </button>
                    )}
                </div>
            </div>

        </div>
    );
};

export default Sidebar;
