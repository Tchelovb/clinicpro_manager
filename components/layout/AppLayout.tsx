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
import { Drawer, DrawerContent, DrawerTitle } from '../ui/drawer';

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
        highlight: true
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
        color: 'text-blue-600',
        highlight: true
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

    // Bottom navigation items (mobile - top 4 most used)
    const bottomNavItems = allowedMainItems.slice(0, 4);

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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row transition-colors duration-300">

            {/* ============================================ */}
            {/* DESKTOP SIDEBAR (Polymorphic Slim/Expanded) */}
            {/* ============================================ */}
            <aside
                className={`
                    hidden md:flex flex-col fixed left-0 top-0 h-screen bg-white dark:bg-slate-900 
                    border-r border-slate-200 dark:border-slate-800 z-50 
                    transition-all duration-300 ease-in-out
                    ${isSidebarExpanded ? 'w-64 shadow-xl' : 'w-20 shadow-sm'}
                `}
                onMouseEnter={() => setIsSidebarExpanded(true)}
                onMouseLeave={() => setIsSidebarExpanded(false)}
            >
                {/* Logo Area */}
                <div className="h-20 flex items-center justify-center border-b border-slate-100 dark:border-slate-800 relative overflow-hidden shrink-0 px-4">
                    <div className={`flex items-center gap-3 transition-all duration-300 ${isSidebarExpanded ? 'opacity-100' : 'opacity-0 absolute'}`}>
                        <div className="w-10 h-10 bg-violet-600 dark:bg-violet-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
                            CP
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800 dark:text-white">ClinicPro</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">MEDICAL SYSTEM</span>
                        </div>
                    </div>
                    {!isSidebarExpanded && (
                        <div className="w-10 h-10 bg-violet-600 dark:bg-violet-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
                            CP
                        </div>
                    )}
                </div>

                {/* Search Button - Minimalist Apple Style */}
                <div className="px-3 mb-4">
                    <button
                        onClick={() => navigate('/')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    >
                        <Search className="h-5 w-5 min-w-[20px]" />
                        <span className={`text-sm transition-all duration-300 ${isSidebarExpanded ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'}`}>
                            Pesquisar
                        </span>
                    </button>
                </div>

                {/* Main Navigation Items */}
                <nav className="px-3 space-y-1 overflow-hidden">
                    {allowedMainItems.map((item) => {
                        const active = isActive(item.path);
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`
                                    w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative
                                    ${active
                                        ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 shadow-sm border border-violet-100 dark:border-transparent'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'}
                                `}
                            >
                                <Icon
                                    size={20}
                                    strokeWidth={active ? 2.5 : 2}
                                    className={`min-w-[20px] transition-colors ${active ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`}
                                />
                                <span className={`
                                    text-sm font-medium whitespace-nowrap transition-all duration-300 origin-left 
                                    ${isSidebarExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 absolute left-14 pointer-events-none'}
                                `}>
                                    {item.label}
                                </span>
                                {!isSidebarExpanded && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                                        {item.label}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Spacer - pushes everything below to bottom */}
                <div className="flex-grow" />

                {/* More Options Dropdown */}
                {allowedSecondaryItems.length > 0 && (
                    <div className="px-3 mb-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition-colors group">
                                    <MoreHorizontal size={20} className="min-w-[20px]" />
                                    <span className={`text-sm font-medium transition-all duration-300 ${isSidebarExpanded ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'}`}>
                                        Mais Opções
                                    </span>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="right" align="end" className="w-56">
                                <DropdownMenuLabel className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    Gestão & Backoffice
                                </DropdownMenuLabel>
                                {allowedSecondaryItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <DropdownMenuItem
                                            key={item.path}
                                            onClick={() => navigate(item.path)}
                                            className="cursor-pointer"
                                        >
                                            <Icon className="mr-2 h-4 w-4" />
                                            <span>{item.label}</span>
                                        </DropdownMenuItem>
                                    );
                                })}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}

                {/* Theme Toggle & User Profile */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-800 shrink-0 space-y-2">

                    {/* Theme Toggle Button */}
                    <button
                        onClick={toggleTheme}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${!isSidebarExpanded && 'justify-center'}`}
                        title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
                    >
                        {theme === 'dark' ? (
                            <Sun size={20} className="text-amber-400 min-w-[20px]" />
                        ) : (
                            <Moon size={20} className="text-slate-600 min-w-[20px]" />
                        )}
                        <span className={`text-sm font-medium text-slate-600 dark:text-slate-300 transition-all duration-300 ${isSidebarExpanded ? 'opacity-100' : 'opacity-0 absolute'}`}>
                            {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                        </span>
                    </button>

                    {/* User Profile */}
                    <button
                        onClick={() => navigate('/settings')}
                        className={`w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${!isSidebarExpanded && 'justify-center'}`}
                    >
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden min-w-[32px]">
                            {(profile as any)?.avatar_url ? (
                                <img src={(profile as any).avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="font-bold text-slate-500 dark:text-slate-300 text-[10px]">{profile?.name?.substring(0, 2).toUpperCase() || 'AD'}</span>
                            )}
                        </div>
                        <div className={`overflow-hidden transition-all duration-300 ${isSidebarExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                            {loading ? (
                                <div className="space-y-1">
                                    <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                                    <div className="h-3 w-16 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                                        {profile?.name || 'Administrador'}
                                    </p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                        {profile?.role || 'MASTER'}
                                    </p>
                                </>
                            )}
                        </div>
                    </button>

                    <button
                        onClick={handleSignOut}
                        className={`
                            w-full flex items-center gap-3 px-3 py-2 mt-1 rounded-lg 
                            text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/10 
                            transition-colors font-medium
                            ${!isSidebarExpanded && 'justify-center'}
                        `}
                    >
                        <LogOut size={20} className="min-w-[20px]" />
                        <span className={`text-sm transition-all duration-300 ${isSidebarExpanded ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'}`}>
                            Sair
                        </span>
                    </button>
                </div>
            </aside>

            {/* ============================================ */}
            {/* MOBILE HEADER & BOTTOM NAVIGATION */}
            {/* ============================================ */}
            <div className="md:hidden">
                {/* Mobile Header - Optimized h-14 */}
                <header className="fixed top-0 left-0 right-0 h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-40 flex items-center justify-between px-3 shadow-sm">
                    {/* Left: Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-700 dark:text-slate-300"
                    >
                        {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>

                    {/* Center: Logo */}
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

                {/* Mobile Overlay Menu -> Native Drawer */}
                <Drawer open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <DrawerContent className="h-[85vh] rounded-t-[10px] outline-none">
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                            <DrawerTitle className="text-lg font-bold text-slate-800 dark:text-white">Menu</DrawerTitle>
                            <button className="p-2" onClick={() => setIsMobileMenuOpen(false)}>
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                            {/* Pesquisa Global - Acesso Rápido */}
                            <button
                                onClick={() => {
                                    navigate('/');
                                    setIsMobileMenuOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800/50 mb-2 rounded-b-none"
                            >
                                <Search size={20} className="text-violet-600 dark:text-violet-400" />
                                <span className="font-bold text-base">Pesquisa Global</span>
                            </button>

                            {[...allowedMainItems, ...allowedSecondaryItems].map((item) => {
                                const active = isActive(item.path);
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.path}
                                        onClick={() => {
                                            navigate(item.path);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className={`
                                            w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                                            ${active
                                                ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}
                                        `}
                                    >
                                        <Icon size={20} className={active ? 'text-violet-600' : 'text-slate-400'} />
                                        <span className="font-medium text-base">{item.label}</span>
                                        {active && <ChevronRight size={16} className="ml-auto" />}
                                    </button>
                                );
                            })}
                        </nav>

                        <div className="p-4 border-t border-slate-200 dark:border-slate-800 pb-safe">
                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 font-medium text-sm"
                            >
                                <LogOut size={20} />
                                <span>Sair do Sistema</span>
                            </button>
                        </div>
                    </DrawerContent>
                </Drawer>

                {/* Bottom Navigation */}
                <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-40 flex justify-around items-center px-2 pb-safe">
                    {bottomNavItems.map((item) => {
                        const active = isActive(item.path);
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`
                                    flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all min-w-[60px]
                                    ${active
                                        ? 'text-violet-600 dark:text-violet-400'
                                        : 'text-slate-500 dark:text-slate-500'}
                                `}
                            >
                                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                                <span className="text-[10px] font-medium">{item.label}</span>
                                {active && (
                                    <div className="absolute bottom-0 w-8 h-0.5 bg-violet-600 dark:bg-violet-400 rounded-t-full" />
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* ============================================ */}
            {/* MAIN CONTENT AREA */}
            {/* ============================================ */}
            <main className={`
                flex-1 flex flex-col min-h-screen transition-all duration-300
                md:ml-20 ${isSidebarExpanded && 'md:ml-64'} 
                pt-14 md:pt-0 pb-16 md:pb-0 
                bg-slate-50 dark:bg-slate-950
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
