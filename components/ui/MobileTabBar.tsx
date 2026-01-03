import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Menu, Search, Plus,
    Calendar, CheckSquare, Activity,
    DollarSign, PieChart, FileText,
    Users, Filter, FileBadge,
    MessageCircle
} from 'lucide-react';
import { cn } from '../../src/lib/utils';
import { useSearchStore } from '../../stores/useSearchStore';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface MobileTabBarProps {
    isLayoutMode?: boolean;
}

// ✅ INTEGRATION WITH GLOBAL VAULT
import { useGlobalSheets } from '../../stores/useGlobalSheets';

export const MobileTabBar: React.FC<MobileTabBarProps> = ({
    isLayoutMode = false
}) => {
    const { pathname } = useLocation();
    const navigate = useNavigate();

    // Usar Store Global para abrir Sheets do Cofre
    const { openSheet } = useGlobalSheets();

    // If this is the Global Layout Bar, hide it on pages that have their own custom bar
    if (isLayoutMode && (
        pathname.includes('/agenda') ||
        pathname.includes('/pipeline') ||
        pathname.includes('/crm') ||
        pathname.includes('/financial') ||
        pathname.includes('/cfo')
    )) {
        return null;
    }

    // Configuration based on active module
    const getConfig = () => {
        // AGENDA
        if (pathname.includes('/agenda')) {
            return {
                main: { icon: Plus, label: 'Agendar', action: () => openSheet('new-appointment') },
                slot4: { icon: Activity, label: 'Fluxo', action: () => openSheet('professionals') }, // Reusing Prof for Flow context or creates new
                slot5: { icon: CheckSquare, label: 'Tarefas', action: () => openSheet('tasks') }
            };
        }
        // FINANCEIRO (CFO)
        if (pathname.includes('/financial') || pathname.includes('/cfo')) {
            return {
                main: { icon: DollarSign, label: 'Lançar', action: () => toast('Lançamento Rápido (Em breve)') },
                slot4: { icon: FileText, label: 'DRE', action: () => navigate('/financial/dre') },
                slot5: { icon: PieChart, label: 'Extrato', action: () => navigate('/financial/extract') }
            };
        }
        // CRM (Pipeline)
        if (pathname.includes('/pipeline') || pathname.includes('/crm')) {
            return {
                main: { icon: Plus, label: 'Novo Lead', action: () => toast('Novo Lead (Em breve)') },
                slot4: { icon: Filter, label: 'Funis', action: () => toast('Filtros') },
                slot5: { icon: MessageCircle, label: 'WhatsApp', action: () => toast('WhatsApp') }
            };
        }
        // PACIENTES
        if (pathname.includes('/patients')) {
            return {
                main: { icon: Plus, label: 'Cadastrar', action: () => navigate('/patients/new') },
                slot4: { icon: Filter, label: 'Filtros', action: () => toast('Filtros') },
                slot5: { icon: FileBadge, label: 'Docs', action: () => toast('Documentos') }
            };
        }

        // DEFAULT (HOME)
        return {
            main: { icon: Plus, label: 'Ação Rápida', action: () => openSheet('new-appointment') }, // Default to appointment
            slot4: { icon: Calendar, label: 'Agenda', action: () => navigate('/agenda') },
            slot5: { icon: CheckSquare, label: 'Tarefas', action: () => openSheet('tasks') }
        };
    };

    const config = getConfig();

    return (
        <div className="fixed bottom-0 left-0 right-0 h-[88px] z-50 md:hidden">
            {/* Glassmorphism Background */}
            <div className="absolute inset-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-3xl border-t border-white/20 dark:border-slate-800/50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]" />

            <div className="relative h-full flex items-center justify-around pb-6 px-2">

                {/* SLOT 1 (Left): DYNAMIC 1 */}
                <button
                    onClick={config.slot4.action}
                    className="flex flex-col items-center justify-center w-14 gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                    <config.slot4.icon size={24} strokeWidth={2} />
                    <span className="text-[10px] font-medium">{config.slot4.label}</span>
                </button>

                {/* SLOT 2 (Left): DYNAMIC 2 */}
                <button
                    onClick={config.slot5.action}
                    className="flex flex-col items-center justify-center w-14 gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                    <config.slot5.icon size={24} strokeWidth={2} />
                    <span className="text-[10px] font-medium">{config.slot5.label}</span>
                </button>

                {/* SLOT 3 (Center): MAIN ACTION (+) */}
                <div className="relative -top-6">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.05 }}
                        onClick={config.main.action}
                        className="w-16 h-16 bg-blue-600 hover:bg-blue-500 rounded-full shadow-[0_8px_30px_rgba(37,99,235,0.4)] flex items-center justify-center text-white border-4 border-[#F5F5F7] dark:border-slate-950 relative z-10"
                    >
                        <config.main.icon size={28} strokeWidth={3} />
                    </motion.button>
                    {/* Pulse Effect */}
                    <div className="absolute inset-0 rounded-full bg-blue-400/20 blur-xl -z-10 animate-pulse" />
                </div>

                {/* SLOT 4 (Right): SEARCH (Fixed) */}
                <button
                    onClick={() => openSheet('search')}
                    className="flex flex-col items-center justify-center w-14 gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                    <Search size={24} strokeWidth={2} />
                    <span className="text-[10px] font-medium">Busca</span>
                </button>

                {/* SLOT 5 (Far Right): MENU (Fixed) */}
                <button
                    onClick={() => {
                        navigate('/');
                        // TODO: Trigger actual sidebar menu or dedicated mobile menu
                    }}
                    className="flex flex-col items-center justify-center w-14 gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                    <Menu size={24} strokeWidth={2} />
                    <span className="text-[10px] font-medium">Menu</span>
                </button>

            </div>
        </div>
    );
};
