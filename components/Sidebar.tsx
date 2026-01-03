import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Search, Calendar, Users, Landmark, Target, CreditCard,
    Settings, LogOut, MoreHorizontal, LayoutDashboard,
    Activity, FileText, ChevronRight, Sun, Moon, Scroll
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useSearchStore } from '../stores/useSearchStore';

interface SidebarProps {
    isExpanded: boolean;
    setIsExpanded: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isExpanded, setIsExpanded }) => {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { profile, signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { setOpen: setSearchOpen } = useSearchStore();
    const [loadingLogout, setLoadingLogout] = useState(false);

    // 1. SMART ALGORITHM (Simulated Intelligence)
    // Priority modules based on Dr. Marcelo's high-ticket workflow
    const PRIORITY_MODULES = [
        { path: '/search', label: 'Pesquisar', icon: Search },
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/agenda', label: 'Agenda', icon: Calendar },
        { path: '/patients', label: 'Pacientes', icon: Users },
        { path: '/financial', label: 'Financeiro CFO', icon: Landmark },
        { path: '/documents', label: 'Docs & Jurídico', icon: Scroll },
        { path: '/pipeline', label: 'CRM & Leads', icon: Target },
        { path: '/settings', label: 'Configurações', icon: Settings },
    ];

    // Secondary modules (Hidden in "More")
    const SECONDARY_MODULES = [
        { path: '/sales', label: 'Vendas', icon: CreditCard },
        { path: '/clinical-production', label: 'Produção', icon: Activity },
        { path: '/budgets', label: 'Orçamentos', icon: FileText },
    ];

    const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

    const handleSignOut = async () => {
        setLoadingLogout(true);
        try {
            await signOut();
            navigate('/login');
        } catch (error) {
            console.error('Error signing out', error);
        } finally {
            setLoadingLogout(false);
        }
    };

    return (
        <aside
            className={`
                hidden md:flex flex-col fixed left-0 top-0 h-screen 
                bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl
                border-r border-slate-200 dark:border-slate-800 z-50 
                transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]
                ${isExpanded ? 'w-64 shadow-2xl' : 'w-20 shadow-sm'}
            `}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
        >
            {/* LOGO AREA */}
            <div className="h-20 flex items-center justify-center border-b border-slate-100 dark:border-slate-800/50 relative overflow-hidden shrink-0">
                <div className={`flex items-center gap-3 transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 absolute'}`}>
                    <div className="w-9 h-9 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-violet-500/20">
                        CP
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">ClinicPro</span>
                        <span className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Elite OS</span>
                    </div>
                </div>
                {!isExpanded && (
                    <div className="w-9 h-9 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md">
                        CP
                    </div>
                )}
            </div>

            {/* ZONE 2: SMART MODULES (Predictive) */}
            <nav className="flex-1 px-3 space-y-1 overflow-y-auto px-2">
                <div className={`px-2 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 hidden'}`}>
                    Frequentes
                </div>

                {PRIORITY_MODULES.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`
                                w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative
                                ${active
                                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                                }
                            `}
                        >
                            <item.icon
                                size={20}
                                strokeWidth={active ? 2.5 : 2}
                                className={`min-w-[20px] transition-colors ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}
                            />
                            <span className={`
                                text-sm font-medium whitespace-nowrap transition-all duration-300 origin-left 
                                ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 absolute left-14 pointer-events-none'}
                            `}>
                                {item.label}
                            </span>

                            {/* Tooltip for collapsed state */}
                            {!isExpanded && (
                                <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-xl transformtranslate-y-1/2">
                                    {item.label}
                                </div>
                            )}
                        </button>
                    );
                })}

                <div className="my-4 border-t border-slate-100 dark:border-slate-800/50 mx-2" />

                {/* ZONE 3: EXPANSION & SECONDARY */}
                <div className={`px-2 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 hidden'}`}>
                    Mais Opções
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className={`
                            w-full flex items-center gap-3 px-3 py-2.5 rounded-xl 
                            text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 
                            transition-all duration-200 group
                        `}>
                            <MoreHorizontal size={20} className="min-w-[20px]" />
                            <span className={`text-sm font-medium transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'}`}>
                                Menu Completo
                            </span>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start" className="w-56 ml-2 p-2">
                        <DropdownMenuLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            Acessórios
                        </DropdownMenuLabel>
                        {SECONDARY_MODULES.map((item) => (
                            <DropdownMenuItem
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className="flex items-center gap-2 cursor-pointer rounded-lg py-2 focus:bg-violet-50 dark:focus:bg-violet-900/20 focus:text-violet-700 dark:focus:text-violet-300"
                            >
                                <item.icon size={16} />
                                <span>{item.label}</span>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

            </nav>

            {/* FOOTER: PROFILE & THEME */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 space-y-1">
                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${!isExpanded && 'justify-center'}`}
                >
                    {theme === 'dark' ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} />}
                    <span className={`text-sm font-medium transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 absolute'}`}>
                        {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                    </span>
                </button>

                {/* Profile Widget */}
                <button
                    onClick={() => navigate('/settings')}
                    className={`w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all ${!isExpanded && 'justify-center'}`}
                >
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden ring-2 ring-white dark:ring-slate-800 shadow-sm shrink-0">
                        {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500">
                                {profile?.name?.substring(0, 2).toUpperCase() || 'DR'}
                            </div>
                        )}
                    </div>
                    <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                        <div className="flex flex-col items-start">
                            <p className="text-sm font-bold text-slate-800 dark:text-white truncate max-w-[140px]">
                                {profile?.name || 'Doutor'}
                            </p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                                {profile?.role || 'Acesso Total'}
                            </p>
                        </div>
                    </div>
                </button>
            </div>
        </aside>
    );
};
