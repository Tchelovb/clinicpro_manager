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
    TrendingUp,
    BarChart3,
    Brain,
    Sparkles,
    UserCog,
    Building2,
    Plus,
    Gamepad2,
    Rocket
} from "lucide-react";
import { CreateClinicModal } from "./CreateClinicModal";
import { ClinicSwitcher } from "./ClinicSwitcher";

interface SidebarProps {
    isCollapsed: boolean;
    toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, toggleSidebar }) => {
    const { signOut, profile } = useAuth();
    const navigate = useNavigate();
    const [showCreateClinic, setShowCreateClinic] = useState(false);

    const handleLogout = async () => {
        try {
            // 1. Sign out from Supabase
            await signOut();

            // 2. Clear any local storage (optional, but good practice)
            localStorage.removeItem('supabase.auth.token');
            sessionStorage.clear();

            // 3. Force redirect to login
            window.location.href = '/login';
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
            // Force redirect anyway
            window.location.href = '/login';
        }
    };

    // =====================================================
    // MENU OPERACIONAL (Admin, Professional, CRC, Receptionist)
    // =====================================================
    // OPERATIONAL SECTION
    const OPERATIONAL_ITEMS = [
        { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        // INTELLIGENCE SECTION (PRIORITY)
        {
            path: "/chat-bos",
            label: "ChatBOS",
            icon: Sparkles,
            highlight: true
        },
        // TEAM MANAGEMENT (ADMIN ONLY)
        ...(profile?.role === 'ADMIN' ? [{
            path: "/dashboard/team-command",
            label: "Gestão de Equipe",
            icon: UserCog,
            highlight: true,
            adminOnly: true
        }] : []),
        // OPERATIONAL SECTION
        { path: "/crm", label: "Comercial", icon: TrendingUp },
        { path: "/patients", label: "Pacientes", icon: Users },
        { path: "/agenda", label: "Agenda", icon: Calendar },
        { path: "/financial", label: "Financeiro", icon: DollarSign },
        // FINTECH MODULES
        { path: "/receivables", label: "Contas a Receber", icon: BarChart3 },
        ...(profile?.role === 'ADMIN' || profile?.role === 'MANAGER' ? [{
            path: "/professional-financial",
            label: "Extrato Profissional",
            icon: UserCog
        }] : []),
        ...(profile?.role === 'ADMIN' || profile?.role === 'MANAGER' ? [{
            path: "/cfo",
            label: "CFO Dashboard",
            icon: TrendingUp,
            highlight: true
        }] : []),
        { path: "/documents", label: "Central Docs", icon: FileText },
        { path: "/reports", label: "Relatórios", icon: PieChart },
        { path: "/settings", label: "Configurações", icon: Settings },
    ];

    // =====================================================
    // MENU MASTER (CEO / Holding) - LIMPO E ORGANIZADO
    // =====================================================
    const MASTER_ITEMS = [
        {
            path: "/chat-bos",
            label: "ChatBOS",
            icon: Sparkles,
            highlight: true,
            desc: "Assistente IA Executivo"
        },
        {
            path: "/dashboard/network",
            label: "Rede Real",
            icon: Building2,
            highlight: true,
            desc: "Gestão de franquias e unidades"
        },
        {
            path: "/dashboard/game",
            label: "Tycoon Game",
            icon: Gamepad2,
            highlight: true,
            desc: "Simuladores e cenários"
        },
        {
            path: "/settings",
            label: "Configurações",
            icon: Settings
        }
    ];

    // Selecionar menu baseado no role
    const navItems = profile?.role === 'MASTER' ? MASTER_ITEMS : OPERATIONAL_ITEMS;

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 transition-all duration-300">

            {/* Header / Clinic Switcher */}
            <div className="h-auto min-h-16 flex items-center justify-between px-2 py-2 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-blue-600 to-purple-600">
                {!isCollapsed && (
                    <div className="flex-1">
                        <ClinicSwitcher />
                    </div>
                )}
                <button
                    onClick={toggleSidebar}
                    className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white"
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
                        className={({ isActive }) => {
                            const baseClasses = "flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group relative";

                            // Intelligence items get special styling
                            if (item.highlight) {
                                return `${baseClasses} ${isActive
                                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-lg"
                                    : "bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 text-purple-700 dark:text-purple-300 hover:from-purple-100 hover:to-indigo-100 dark:hover:from-purple-900/30 dark:hover:to-indigo-900/30 font-semibold border border-purple-200 dark:border-purple-800"
                                    }`;
                            }

                            // Regular items
                            return `${baseClasses} ${isActive
                                ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-medium"
                                : "hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                                }`;
                        }}
                    >
                        <item.icon
                            size={20}
                            className={`shrink-0 transition-colors ${isCollapsed ? "mx-auto" : "mr-3"
                                } ${item.highlight ? "animate-pulse" : ""}`}
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



            {/* MASTER ONLY: Expandir Rede Button */}
            {profile?.role === 'MASTER' && !isCollapsed && (
                <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-800">
                    <button
                        onClick={() => setShowCreateClinic(true)}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                        <Rocket className="w-5 h-5" />
                        Expandir Rede
                    </button>
                </div>
            )}

            {/* User Profile & Logout */}
            <div className="border-t border-gray-100 dark:border-gray-800 p-3">
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-2`}>
                    {!isCollapsed && (
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0 text-xs font-bold text-white shadow-md">
                                {profile?.name?.substring(0, 2).toUpperCase() || 'US'}
                            </div>
                            <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {profile?.name || 'Usuário'}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {profile?.role || 'Usuário'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Logout Button - Always visible */}
                    <button
                        onClick={handleLogout}
                        className={`p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all group ${isCollapsed ? 'w-full' : ''
                            }`}
                        title="Sair do Sistema"
                    >
                        <LogOut size={18} className="group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            </div>

            {/* Create Clinic Modal (MASTER ONLY) */}
            <CreateClinicModal
                isOpen={showCreateClinic}
                onClose={() => setShowCreateClinic(false)}
                onSuccess={() => {
                    setShowCreateClinic(false);
                    window.location.reload(); // Reload to update clinic list
                }}
            />

        </div>
    );
};

export default Sidebar;
