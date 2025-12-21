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
    Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Navigation Configuration
const MENU_ITEMS = [
    {
        path: '/intelligence',
        label: 'Intelligence',
        icon: Brain,
        roles: ['MASTER', 'ADMIN', 'DENTIST'],
        color: 'text-purple-500'
    },
    {
        path: '/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        roles: ['MASTER', 'ADMIN', 'DENTIST', 'RECEPTIONIST', 'CRC'],
        color: 'text-blue-500'
    },
    {
        path: '/pipeline',
        label: 'Pipeline',
        icon: Sparkles,
        roles: ['MASTER', 'ADMIN', 'CRC'],
        color: 'text-amber-500'
    },
    {
        path: '/agenda',
        label: 'Agenda',
        icon: Calendar,
        roles: ['MASTER', 'ADMIN', 'DENTIST', 'RECEPTIONIST'],
        color: 'text-violet-500'
    },
    {
        path: '/patients',
        label: 'Pacientes',
        icon: Users,
        roles: ['MASTER', 'ADMIN', 'DENTIST', 'RECEPTIONIST'],
        color: 'text-teal-500'
    },
    {
        path: '/financial',
        label: 'Financeiro',
        icon: DollarSign,
        roles: ['MASTER', 'ADMIN'],
        color: 'text-green-500'
    },
    {
        path: '/chat-bos',
        label: 'ChatBOS',
        icon: MessageSquare,
        roles: ['MASTER', 'ADMIN', 'DENTIST'],
        color: 'text-indigo-500'
    }
];

export const AppLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const { profile, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Filter menu items based on access level
    // Fallback to minimal access if no role defined
    const userRole = profile?.role || 'GUEST';
    // const allowedMenuItems = MENU_ITEMS.filter(item => item.roles.includes(userRole));
    // Showing all for dev/demo purposes if role check fails or simply allow all for this step as requested "Implementar..."
    // Ideally:
    const allowedMenuItems = MENU_ITEMS; // Temporarily allow all for visualization

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const isActive = (path: string) => {
        if (path === '/dashboard' && location.pathname === '/dashboard') return true;
        if (path !== '/dashboard' && location.pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col md:flex-row transition-colors duration-300">

            {/* --- DESKTOP SIDEBAR (Polymorphic) --- */}
            <aside
                className={`
                    hidden md:flex flex-col fixed left-0 top-0 h-screen bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-50 transition-all duration-300 ease-in-out shadow-sm
                    ${isSidebarExpanded ? 'w-64' : 'w-20'}
                `}
                onMouseEnter={() => setIsSidebarExpanded(true)}
                onMouseLeave={() => setIsSidebarExpanded(false)}
            >
                {/* Logo Area */}
                <div className="h-20 flex items-center justify-center border-b border-slate-100 dark:border-slate-700 relative overflow-hidden shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200 dark:shadow-none min-w-[40px]">
                            <span className="text-white font-bold text-xl">C</span>
                        </div>
                        <span className={`font-bold text-slate-800 dark:text-white text-lg whitespace-nowrap transition-opacity duration-300 ${isSidebarExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>
                            ClinicPro
                        </span>
                    </div>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto scrollbar-hide">
                    {allowedMenuItems.map((item) => {
                        const active = isActive(item.path);
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`
                                    w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative
                                    ${active
                                        ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-300 shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-slate-200'
                                    }
                                `}
                            >
                                <Icon size={24} strokeWidth={active ? 2.5 : 2} className={`min-w-[24px] transition-colors ${active ? '' : item.color} opacity-80 group-hover:opacity-100`} />
                                <span className={`font-medium whitespace-nowrap transition-all duration-300 origin-left ${isSidebarExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 absolute left-14 pointer-events-none'}`}>
                                    {item.label}
                                </span>

                                {/* Tooltip for collapsed state */}
                                {!isSidebarExpanded && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                                        {item.label}
                                    </div>
                                )}

                                {/* Active Indicator */}
                                {active && (
                                    <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-violet-600 dark:bg-violet-400" />
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Footer / User Profile */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-700 shrink-0">
                    <button
                        className={`w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${!isSidebarExpanded && 'justify-center'}`}
                    >
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center overflow-hidden min-w-[32px]">
                            {(profile as any)?.avatar_url ? (
                                <img src={(profile as any).avatar_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="font-bold text-slate-500 dark:text-slate-300 text-xs">{profile?.name?.substring(0, 2).toUpperCase() || 'US'}</span>
                            )}
                        </div>
                        <div className={`overflow-hidden transition-all duration-300 ${isSidebarExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{profile?.name || 'Usuário'}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{profile?.role || 'Visitante'}</p>
                        </div>
                    </button>
                    <button
                        onClick={handleSignOut}
                        className={`mt-2 w-full flex items-center gap-3 p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors ${!isSidebarExpanded && 'justify-center'}`}
                        title="Sair"
                    >
                        <LogOut size={20} className="min-w-[20px]" />
                        <span className={`whitespace-nowrap transition-all duration-300 ${isSidebarExpanded ? 'opacity-100' : 'opacity-0 w-0'}`}>Sair</span>
                    </button>
                </div>
            </aside>


            {/* --- MOBILE HEADER & BOTTOM NAV --- */}
            <div className="md:hidden">
                {/* Mobile Header */}
                <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 z-40 flex items-center justify-between px-4 shadow-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold">C</span>
                        </div>
                        <span className="font-bold text-slate-800 dark:text-white">ClinicPro</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => navigate('/chat-bos')} className="p-2 text-slate-600 dark:text-slate-300">
                            <MessageSquare size={20} />
                        </button>
                        <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-600 dark:text-slate-300">
                            <Menu size={24} />
                        </button>
                    </div>
                </header>

                {/* Mobile Overlay Menu (Full Access) */}
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col animate-in slide-in-from-right">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                            <h2 className="font-bold text-lg text-slate-800 dark:text-white">Menu Completo</h2>
                            <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {allowedMenuItems.map((item) => (
                                <button
                                    key={item.path}
                                    onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }}
                                    className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800"
                                >
                                    <div className={`p-3 rounded-full ${item.color.replace('text-', 'bg-').replace('500', '100')}`}>
                                        <item.icon size={20} className={item.color} />
                                    </div>
                                    <span className="font-medium text-slate-800 dark:text-white text-lg">{item.label}</span>
                                    <ChevronRight className="ml-auto text-slate-300" size={20} />
                                </button>
                            ))}
                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center gap-4 p-4 rounded-xl text-rose-600 mt-4 border border-rose-100 bg-rose-50"
                            >
                                <LogOut size={20} />
                                <span className="font-bold">Sair do Sistema</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Bottom Navigation (Quick Access) */}
                <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 z-40 flex justify-around items-center px-2 pb-safe">
                    {allowedMenuItems.slice(0, 5).map((item) => { // Show first 5 items only on bottom bar
                        const active = isActive(item.path);
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${active ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 dark:text-slate-500'}`}
                            >
                                <Icon size={active ? 24 : 20} strokeWidth={active ? 2.5 : 2} className="transition-all" />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </button>
                        )
                    })}
                </nav>
            </div>

            {/* --- MAIN CONTENT AREA --- */}
            <main className={`
                flex-1 flex flex-col min-h-screen transition-all duration-300
                md:ml-20 ${isSidebarExpanded && 'md:ml-64'} 
                pt-16 md:pt-0 pb-20 md:pb-0
            `}>
                <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
                    {/* Breadcrumbs or Screen Title could go here */}

                    {/* Page Content */}
                    {children || <Outlet />}
                </div>
            </main>

        </div>
    );
};

export default AppLayout;
