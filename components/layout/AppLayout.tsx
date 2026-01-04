import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Calendar,
    Users,
    DollarSign,
    MessageSquare,
    Brain,
    Menu,
    X,
    LogOut,
    Settings,
    ChevronRight,
    Sparkles,
    FlaskConical,
    Package,
    BarChart3,
    Sun,
    Moon,
    UserCheck,
    UserPlus,
    Target,
    Search,
    MoreHorizontal,
    ShoppingCart,
    FileText,
    CreditCard,
    Landmark,
    Activity
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { MobileTabBar } from '../ui/MobileTabBar';
import { Sidebar } from '../Sidebar';
import { cn } from '../../src/lib/utils';


// Navigation Configuration with Role-Based Access
interface MenuItem {
    path: string;
    label: string;
    icon: React.ComponentType<any>;
    roles: string[];
    color: string;
}

// Main Navigation Items (Always Visible)
const MAIN_NAV_ITEMS: MenuItem[] = [
    {
        path: '/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        roles: ['MASTER', 'ADMIN', 'PROFESSIONAL', 'RECEPTIONIST', 'CRC'],
        color: 'text-violet-600'
    },
    {
        path: '/clinical-production',
        label: 'Produção',
        icon: Activity,
        roles: ['MASTER', 'ADMIN', 'PROFESSIONAL', 'CRC'],
        color: 'text-violet-600',
        color: 'text-violet-600'
    },
    {
        path: '/agenda',
        label: 'Agenda',
        icon: Calendar,
        roles: ['MASTER', 'ADMIN', 'PROFESSIONAL', 'RECEPTIONIST'],
        color: 'text-violet-600'
    },
    {
        path: '/pipeline',
        label: 'Pipeline',
        icon: Target,
        roles: ['MASTER', 'ADMIN', 'CRC'],
        color: 'text-violet-600'
    },
    {
        path: '/leads',
        label: 'Leads',
        icon: UserPlus,
        roles: ['MASTER', 'ADMIN', 'CRC'],
        color: 'text-violet-600'
    },
    {
        path: '/patients',
        label: 'Pacientes',
        icon: Users,
        roles: ['MASTER', 'ADMIN', 'PROFESSIONAL', 'RECEPTIONIST', 'CRC'],
        color: 'text-violet-600'
    },
    {
        path: '/sales',
        label: 'Terminal de Vendas',
        icon: CreditCard,
        roles: ['MASTER', 'ADMIN', 'RECEPTIONIST'],
        color: 'text-blue-600'
    },
    {
        path: '/budgets',
        label: 'Orçamentos',
        icon: FileText,
        roles: ['MASTER', 'ADMIN', 'PROFESSIONAL', 'CRC'],
        color: 'text-blue-600'
    },
    {
        path: '/financial',
        label: 'Financeiro & Caixa',
        icon: Landmark,
        roles: ['MASTER', 'ADMIN'],
        color: 'text-amber-600'
    },
];

// Secondary Navigation Items ("More Options" Dropdown)
const SECONDARY_NAV_ITEMS: MenuItem[] = [
    {
        path: '/chat-bos',
        label: 'ChatBOS',
        icon: Sparkles,
        roles: ['MASTER', 'ADMIN', 'PROFESSIONAL'],
        color: 'text-violet-600'
    },
    {
        path: '/attendance-queue',
        label: 'Fila de Atendimento',
        icon: UserCheck,
        roles: ['MASTER', 'ADMIN', 'PROFESSIONAL', 'RECEPTIONIST'],
        color: 'text-green-600'
    },
    {
        path: '/inventory',
        label: 'Estoque',
        icon: Package,
        roles: ['MASTER', 'ADMIN'],
        color: 'text-violet-600'
    },
    {
        path: '/lab',
        label: 'Laboratório',
        icon: FlaskConical,
        roles: ['MASTER', 'ADMIN', 'PROFESSIONAL'],
        color: 'text-violet-600'
    },
    {
        path: '/reports',
        label: 'Relatórios',
        icon: BarChart3,
        roles: ['MASTER', 'ADMIN'],
        color: 'text-violet-600'
    },
    {
        path: '/settings',
        label: 'Configurações',
        icon: Settings,
        roles: ['MASTER', 'ADMIN'],
        color: 'text-slate-500'
    }
];

import { GlobalSheetManager } from '../ui/GlobalSheetManager';

export const AppLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const { profile, signOut, loading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Filter menu items based on user role
    const userRole = profile?.role || 'GUEST';
    const allowedMainItems = MAIN_NAV_ITEMS.filter(item => item.roles.includes(userRole));
    const allowedSecondaryItems = SECONDARY_NAV_ITEMS.filter(item => item.roles.includes(userRole));

    // Bottom navigation items (mobile - Thumb Zone optimized)
    // NOTE: This logic is now handled inside MobileTabBar component

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const isActive = (path: string) => {
        if (path === '/dashboard' && location.pathname === '/dashboard') return true;
        if (path !== '/dashboard' && location.pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] dark:bg-slate-950 flex flex-col md:flex-row transition-colors duration-300">

            {/* GLOBAL MODAL MANAGER (Search, Tasks, etc.) */}
            <GlobalSheetManager />

            {/* ============================================ */}
            {/* DESKTOP SIDEBAR (Smart Component) */}
            {/* ============================================ */}
            <Sidebar isExpanded={isSidebarExpanded} setIsExpanded={setIsSidebarExpanded} />

            {/* ============================================ */}
            {/* MOBILE HEADER & BOTTOM NAVIGATION */}
            {/* ============================================ */}
            <div className="md:hidden">
                {/* Mobile Header - Optimized h-14 */}
                <header className="fixed top-0 left-0 right-0 h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-40 flex items-center justify-between px-3 shadow-sm">

                    {/* Left: Logo (Menu button removed as it is in TabBar) */}
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-violet-600 dark:bg-violet-500 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm">
                            CP
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-800 dark:text-white">ClinicPro</span>
                            <span className="text-[9px] text-slate-500 dark:text-slate-400 leading-none">{profile?.clinics?.name || 'Clínica'}</span>
                        </div>
                    </div>

                    {/* Right: Theme + Avatar */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={toggleTheme}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-600" />}
                        </button>
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                            {(profile as any)?.avatar_url ? (
                                <img src={(profile as any).avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="font-bold text-slate-500 dark:text-slate-300 text-[10px]">{profile?.name?.substring(0, 2).toUpperCase() || 'US'}</span>
                            )}
                        </div>
                    </div>
                </header>

                {/* Bottom Navigation - iOS Premium Tab Bar */}
                <MobileTabBar />
            </div>

            {/* ============================================ */}
            {/* MAIN CONTENT AREA */}
            {/* ============================================ */}
            <main className={`
                flex-1 flex flex-col min-h-screen transition-all duration-300
                md:ml-20 ${isSidebarExpanded && 'md:ml-64'} 
                pt-14 md:pt-0 pb-16 md:pb-0 
                bg-[#F5F5F7] dark:bg-slate-950
                overflow-x-hidden
            `}>
                <div className="flex-1 p-4 md:p-6 lg:p-8">
                    {/* Page Content */}
                    <div className="animate-in fade-in duration-500">
                        {children || <Outlet />}
                    </div>
                </div>
            </main>


        </div>
    );
};

export default AppLayout;
