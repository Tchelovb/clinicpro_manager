import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Menu, Search, Plus, Calendar, DollarSign, CheckSquare,
    LayoutDashboard, FileText, PieChart, X,
    Brain, Sparkles, UserPlus, Settings, HelpCircle, LogOut, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobalSheets } from '../../stores/useGlobalSheets';
import { Drawer, DrawerContent, DrawerTitle } from './drawer';
import { useAuth } from '../../contexts/AuthContext';

export const MobileTabBar: React.FC = () => {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const { openSheet } = useGlobalSheets();
    const [isLocalMenuOpen, setIsLocalMenuOpen] = useState(false);
    const { signOut, profile } = useAuth(); // Acesso ao perfil para o menu

    // --- CONFIGURAÇÃO DE NAVEGAÇÃO ---
    // Rotas principais da barra (Ordem: Agenda, Tarefas, Novo, Busca, Menu)
    const navItems = {
        left1: { icon: Calendar, label: 'Agenda', action: () => navigate('/agenda'), active: pathname.includes('/agenda') },
        left2: { icon: CheckSquare, label: 'Tarefas', action: () => openSheet('tasks'), active: false }, // Tarefas geralmente abre modal
        center: { icon: Plus, label: 'Novo', action: () => openSheet('new-appointment') },
        right1: { icon: Search, label: 'Busca', action: () => openSheet('search'), active: false },
        right2: { icon: Menu, label: 'Menu', action: () => setIsLocalMenuOpen(true), active: isLocalMenuOpen }
    };

    // --- MENU LATERAL (DRAWER) ---
    // Itens do menu expandido (baseado no BottomNav original)
    const menuItems = [
        { to: '/dashboard/intelligence-gateway', icon: Brain, label: 'BOS Intelligence', desc: 'Portal Executivo', highlight: true },
        { to: '/crm', icon: UserPlus, label: 'CRM Comercial', desc: 'Gestão de Leads' },
        { to: '/documents', icon: FileText, label: 'Documentos', desc: 'Contratos e Atestados' },
        { to: '/reports', icon: PieChart, label: 'Relatórios', desc: 'Métricas e KPIs' },
        { to: '/settings', icon: Settings, label: 'Configurações', desc: 'Ajustes do Sistema' },
        { to: '/support', icon: HelpCircle, label: 'Ajuda', desc: 'Suporte Técnico' },
    ];

    return (
        <>
            {/* ================================================= */}
            {/* BARRA DE NAVEGAÇÃO (GLASSMORPHISM) */}
            {/* ================================================= */}
            <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-[env(safe-area-inset-bottom)] bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] transition-all duration-300">
                <div className="flex items-center justify-around h-16 px-2">

                    {/* ESQUERDA 1 - INÍCIO */}
                    <NavButton item={navItems.left1} />

                    {/* ESQUERDA 2 - AGENDA */}
                    <NavButton item={navItems.left2} />

                    {/* CENTRO - AÇÃO DOUTOR (+) */}
                    <div className="relative -top-6">
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={navItems.center.action}
                            className="w-14 h-14 bg-violet-600 rounded-full shadow-lg shadow-violet-600/30 flex items-center justify-center text-white border-4 border-[#F5F5F7] dark:border-slate-950"
                        >
                            <navItems.center.icon size={28} strokeWidth={2.5} />
                        </motion.button>
                        {/* Glow Effect */}
                        <div className="absolute inset-0 rounded-full bg-violet-500/20 blur-xl -z-10 animate-pulse" />
                    </div>

                    {/* DIREITA 1 - FINANCEIRO */}
                    <NavButton item={navItems.right1} />

                    {/* DIREITA 2 - MENU */}
                    <NavButton item={navItems.right2} />

                </div>
            </div>

            {/* ================================================= */}
            {/* DRAWER MENU (NATIVO IMBUTIDO) */}
            {/* ================================================= */}
            <Drawer open={isLocalMenuOpen} onOpenChange={setIsLocalMenuOpen}>
                <DrawerContent className="h-[92vh] rounded-t-[20px] outline-none bg-slate-50 dark:bg-slate-950">

                    {/* Header do Menu */}
                    <div className="px-6 py-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-[20px]">
                        <div>
                            <DrawerTitle className="text-xl font-bold text-slate-800 dark:text-white">Menu</DrawerTitle>
                            <p className="text-xs text-slate-500">Navegação Completa</p>
                        </div>
                        <button onClick={() => setIsLocalMenuOpen(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                            <X size={20} className="text-slate-500" />
                        </button>
                    </div>

                    {/* Conteúdo do Menu */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">

                        {/* Busca Rápida no Menu */}
                        <button
                            onClick={() => { setIsLocalMenuOpen(false); openSheet('search'); }}
                            className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-500 mb-4"
                        >
                            <Search size={20} />
                            <span className="text-sm">Pesquisar no sistema...</span>
                        </button>

                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 px-2">Aplicativos</h3>

                        {/* Lista de Apps */}
                        {menuItems.map((item) => (
                            <button
                                key={item.to}
                                onClick={() => { navigate(item.to); setIsLocalMenuOpen(false); }}
                                className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all shadow-sm border ${item.highlight
                                    ? 'bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-100 dark:from-violet-900/10 dark:to-indigo-900/10 dark:border-violet-800/30'
                                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                                    }`}
                            >
                                <div className={`p-2.5 rounded-lg ${item.highlight ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                                    <item.icon size={20} />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className={`text-sm font-bold ${item.highlight ? 'text-violet-700 dark:text-violet-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {item.label}
                                    </p>
                                    <p className="text-[10px] text-slate-500">{item.desc}</p>
                                </div>
                                <ChevronRight size={16} className="text-slate-300" />
                            </button>
                        ))}

                        {/* Logout Section */}
                        <div className="pt-6 pb-safe">
                            <button
                                onClick={signOut}
                                className="w-full flex items-center justify-center gap-2 p-4 text-rose-600 font-bold text-sm bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-100 dark:border-rose-900/30"
                            >
                                <LogOut size={18} /> Sair da Conta
                            </button>
                            <p className="text-center text-[10px] text-slate-400 mt-4">
                                ClinicPro Elite v2.0 • {profile?.name}
                            </p>
                        </div>

                    </div>
                </DrawerContent>
            </Drawer>
        </>
    );
};

// Sub-componente Botão (para limpeza)
const NavButton = ({ item }: { item: any }) => (
    <button
        onClick={item.action}
        className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-all active:scale-95 ${item.active ? 'text-violet-600 dark:text-violet-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
    >
        <item.icon size={24} strokeWidth={item.active ? 2.5 : 2} />
        <span className="text-[10px] font-medium">{item.label}</span>
        {item.active && <span className="w-1 h-1 bg-violet-600 rounded-full mt-0.5" />}
    </button>
);
