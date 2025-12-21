import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    LayoutDashboard,
    Users,
    Calendar,
    DollarSign,
    Settings,
    TrendingUp,
    Stethoscope,
    MessageSquare,
    Target,
    Building2,
    ChevronLeft,
    Menu,
    X,
    LogOut,
    User
} from 'lucide-react';

interface MenuItem {
    id: string;
    label: string;
    icon: React.ElementType;
    path: string;
    roles: string[];
    badge?: number;
}

const MENU_ITEMS: MenuItem[] = [
    {
        id: 'dashboard',
        label: 'Central de Metas',
        icon: Target,
        path: '/dashboard',
        roles: ['MASTER', 'ADMIN']
    },
    {
        id: 'global',
        label: 'Visão Global',
        icon: Building2,
        path: '/dashboard/master',
        roles: ['MASTER']
    },
    {
        id: 'agenda',
        label: 'Agenda',
        icon: Calendar,
        path: '/dashboard/schedule',
        roles: ['MASTER', 'ADMIN', 'PROFESSIONAL', 'RECEPTIONIST']
    },
    {
        id: 'patients',
        label: 'Pacientes',
        icon: Users,
        path: '/dashboard/patients',
        roles: ['MASTER', 'ADMIN', 'PROFESSIONAL', 'CRC', 'RECEPTIONIST']
    },
    {
        id: 'pipeline',
        label: 'Pipeline de Vendas',
        icon: TrendingUp,
        path: '/dashboard/high-ticket',
        roles: ['MASTER', 'ADMIN', 'CRC']
    },
    {
        id: 'clinical',
        label: 'Minha Produção',
        icon: Stethoscope,
        path: '/dashboard/my-production',
        roles: ['PROFESSIONAL']
    },
    {
        id: 'financial',
        label: 'Financeiro',
        icon: DollarSign,
        path: '/dashboard/financial',
        roles: ['MASTER', 'ADMIN']
    },
    {
        id: 'chatbos',
        label: 'ChatBOS',
        icon: MessageSquare,
        path: '/dashboard/chatbos',
        roles: ['MASTER', 'ADMIN', 'CRC']
    },
    {
        id: 'settings',
        label: 'Configurações',
        icon: Settings,
        path: '/dashboard/settings',
        roles: ['MASTER', 'ADMIN']
    }
];

export const AppLayout: React.FC = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarExpanded, setSidebarExpanded] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const userRole = profile?.role || 'RECEPTIONIST';
    const userName = profile?.name || 'Usuário';

    // Filter menu items based on user role
    const allowedMenuItems = MENU_ITEMS.filter(item =>
        item.roles.includes(userRole)
    );

    // Check if we're on a sub-page (not dashboard home)
    const isSubPage = location.pathname !== '/dashboard';
    const currentPage = allowedMenuItems.find(item => location.pathname.startsWith(item.path));

    const handleBack = () => {
        navigate(-1);
    };

    const handleLogout = () => {
        // Implement logout logic
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* DESKTOP SIDEBAR */}
            <aside
                className={`hidden md:flex fixed left-0 top-0 h-screen bg-white border-r border-slate-200 transition-all duration-300 z-40 ${sidebarExpanded ? 'w-64' : 'w-20'
                    }`}
                onMouseEnter={() => setSidebarExpanded(true)}
                onMouseLeave={() => setSidebarExpanded(false)}
            >
                <div className="flex flex-col w-full">
                    {/* Logo */}
                    <div className="h-16 flex items-center justify-center border-b border-slate-200">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-violet-700 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-lg">CP</span>
                        </div>
                        {sidebarExpanded && (
                            <span className="ml-3 font-bold text-slate-800 text-lg">ClinicPro</span>
                        )}
                    </div>

                    {/* Menu Items */}
                    <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
                        {allowedMenuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname.startsWith(item.path);

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => navigate(item.path)}
                                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative ${isActive
                                            ? 'bg-violet-50 text-violet-600'
                                            : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-violet-600' : 'text-slate-400'}`} />
                                    {sidebarExpanded && (
                                        <span className={`font-medium text-sm ${isActive ? 'text-violet-600' : 'text-slate-700'}`}>
                                            {item.label}
                                        </span>
                                    )}
                                    {item.badge && sidebarExpanded && (
                                        <span className="ml-auto bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                            {item.badge}
                                        </span>
                                    )}

                                    {/* Tooltip for collapsed state */}
                                    {!sidebarExpanded && (
                                        <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                                            {item.label}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </nav>

                    {/* User Profile */}
                    <div className="border-t border-slate-200 p-3">
                        <div className={`flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-all ${sidebarExpanded ? '' : 'justify-center'
                            }`}>
                            <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-white" />
                            </div>
                            {sidebarExpanded && (
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-800 truncate">{userName}</p>
                                    <p className="text-xs text-slate-500">{userRole}</p>
                                </div>
                            )}
                        </div>
                        {sidebarExpanded && (
                            <button
                                onClick={handleLogout}
                                className="w-full mt-2 flex items-center gap-3 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-all"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="text-sm font-medium">Sair</span>
                            </button>
                        )}
                    </div>
                </div>
            </aside>

            {/* MOBILE HEADER */}
            <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-30">
                <div className="h-full px-4 flex items-center justify-between">
                    {isSubPage ? (
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 text-slate-700 hover:text-violet-600 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            <span className="font-medium">Voltar</span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-violet-700 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-sm">CP</span>
                            </div>
                            <span className="font-bold text-slate-800">ClinicPro</span>
                        </div>
                    )}

                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        {mobileMenuOpen ? (
                            <X className="w-6 h-6 text-slate-600" />
                        ) : (
                            <Menu className="w-6 h-6 text-slate-600" />
                        )}
                    </button>
                </div>
            </header>

            {/* MOBILE MENU OVERLAY */}
            {mobileMenuOpen && (
                <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setMobileMenuOpen(false)}>
                    <div className="absolute top-16 right-0 w-64 bg-white h-[calc(100vh-4rem)] shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-medium text-slate-800">{userName}</p>
                                    <p className="text-xs text-slate-500">{userRole}</p>
                                </div>
                            </div>
                        </div>

                        <nav className="p-4 space-y-2">
                            {allowedMenuItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname.startsWith(item.path);

                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            navigate(item.path);
                                            setMobileMenuOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                                ? 'bg-violet-50 text-violet-600'
                                                : 'text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="font-medium">{item.label}</span>
                                    </button>
                                );
                            })}
                        </nav>

                        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-600 hover:bg-rose-50 transition-all"
                            >
                                <LogOut className="w-5 h-5" />
                                <span className="font-medium">Sair</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MAIN CONTENT */}
            <main className={`md:ml-20 pt-16 md:pt-0 pb-20 md:pb-0 min-h-screen`}>
                {/* Desktop Page Header */}
                <div className="hidden md:block bg-white border-b border-slate-200">
                    <div className="px-8 py-6">
                        {isSubPage && (
                            <button
                                onClick={handleBack}
                                className="flex items-center gap-2 text-slate-600 hover:text-violet-600 transition-colors mb-4"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                <span className="font-medium">Voltar</span>
                            </button>
                        )}
                        <h1 className="text-2xl font-bold text-slate-800">
                            {currentPage?.label || 'Dashboard'}
                        </h1>
                    </div>
                </div>

                {/* Page Content */}
                <div className="p-4 md:p-8">
                    <Outlet />
                </div>
            </main>

            {/* MOBILE BOTTOM BAR */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30">
                <div className="grid grid-cols-4 gap-1 p-2">
                    {allowedMenuItems.slice(0, 4).map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname.startsWith(item.path);

                        return (
                            <button
                                key={item.id}
                                onClick={() => navigate(item.path)}
                                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-all ${isActive ? 'text-violet-600' : 'text-slate-400'
                                    }`}
                            >
                                <Icon className="w-6 h-6" />
                                <span className="text-xs font-medium truncate w-full text-center">
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
};

export default AppLayout;
