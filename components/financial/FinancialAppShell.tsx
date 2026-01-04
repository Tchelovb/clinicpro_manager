import React, { useState } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useOpenCashRegisters } from '../../hooks/useCashRegister';
import { useAuth } from '../../contexts/AuthContext';
import {
    TrendingUp, Wallet, ArrowUpCircle, ArrowDownCircle,
    FileText, Shield, Lock, Unlock, Plus, ChevronRight,
    ArrowDownFromLine, Calculator
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { OpenCashRegisterSheet } from './OpenCashRegisterSheet';
import { BlindClosingSheet } from './BlindClosingSheet';
import { useHaptic } from '../../utils/haptics';
import { DashboardBI } from './DashboardBI';
import { CashFlowView } from './CashFlowView';
import { ReceivablesView } from './ReceivablesView';
import { PayablesView } from './PayablesView';
import { DREView } from './DREView';
import { AuditView } from './AuditView';
import { GlassCard } from '../ui/GlassCard';

interface FinancialAppShellProps {
    defaultTab?: 'dashboard' | 'cashflow' | 'receivables' | 'payables' | 'dre' | 'audit';
}

// Categorias para navegação mobile
const financialCategories = [
    {
        id: 'dashboard',
        icon: TrendingUp,
        title: 'Dashboard BI',
        subtitle: 'Visão geral e KPIs',
        color: 'bg-purple-500',
        component: () => <DashboardBI />
    },
    {
        id: 'cashflow',
        icon: Wallet,
        title: 'Fluxo de Caixa',
        subtitle: 'Lançamentos e movimentações',
        color: 'bg-blue-500',
        component: () => <CashFlowView />
    },
    {
        id: 'receivables',
        icon: ArrowUpCircle,
        title: 'Contas a Receber',
        subtitle: 'Parcelas e inadimplência',
        color: 'bg-green-500',
        component: () => <ReceivablesView />
    },
    {
        id: 'payables',
        icon: ArrowDownCircle,
        title: 'Contas a Pagar',
        subtitle: 'Despesas e fornecedores',
        color: 'bg-red-500',
        component: () => <PayablesView />
    },
    {
        id: 'dre',
        icon: FileText,
        title: 'DRE Operacional',
        subtitle: 'Resultado e margens',
        color: 'bg-amber-500',
        component: () => <DREView />
    },
    {
        id: 'audit',
        icon: Shield,
        title: 'Auditoria',
        subtitle: 'Logs e rastreamento',
        color: 'bg-gray-500',
        component: () => <AuditView />
    }
];

/**
 * FinancialAppShell
 * 
 * Estrutura base do módulo financeiro
 * - Desktop: Navegação por Tabs (estilo SAP/Jira)
 * - Mobile: Lista vertical com Drill-down (estilo Apple)
 * - Controle de estado do caixa (Gatekeeper)
 * - Feedback háptico em navegação
 */
export const FinancialAppShell: React.FC<FinancialAppShellProps> = ({
    defaultTab = 'dashboard'
}) => {
    const isMobile = useMediaQuery('(max-width: 768px)');
    const { registers, loading: loadingRegisters } = useOpenCashRegisters();
    const { profile } = useAuth();
    const haptic = useHaptic();

    const [showOpenCash, setShowOpenCash] = useState(false);
    const [showCloseCash, setShowCloseCash] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const isCashOpen = registers.length > 0;
    const currentRegister = registers[0];

    // Handler de navegação com haptic
    const handleNavigation = (categoryId: string) => {
        haptic.light(); // Toque leve ao navegar
        if (isMobile) {
            setSelectedCategory(categoryId);
        }
    };

    // Mobile: Drill-down Navigation
    if (isMobile) {
        return (
            <div className="h-screen flex flex-col bg-background">
                {/* Header Mobile */}
                <FinancialHeader
                    isCashOpen={isCashOpen}
                    currentRegister={currentRegister}
                    onOpenCash={() => setShowOpenCash(true)}
                    onCloseCash={() => setShowCloseCash(true)}
                    isMobile={true}
                />

                {/* Lista Macro ou Detalhe */}
                {!selectedCategory ? (
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {financialCategories.map((cat) => (
                            <GlassCard
                                key={cat.id}
                                onClick={() => handleNavigation(cat.id)}
                                hover
                                className="p-4 flex items-center gap-4"
                            >
                                <div className={`p-3 rounded-xl ${cat.color} bg-opacity-10`}>
                                    <cat.icon className={`${cat.color.replace('bg-', 'text-')}`} size={24} />
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-bold text-gray-900 dark:text-white">{cat.title}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{cat.subtitle}</p>
                                </div>
                                <ChevronRight className="text-gray-400" size={20} />
                            </GlassCard>
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto">
                        <button
                            onClick={() => {
                                haptic.light();
                                setSelectedCategory(null);
                            }}
                            className="p-4 flex items-center gap-2 text-blue-600 dark:text-blue-400"
                        >
                            <ChevronRight size={20} className="rotate-180" />
                            Voltar
                        </button>
                        {financialCategories.find(c => c.id === selectedCategory)?.component()}
                    </div>
                )}

                {/* Modais */}
                <OpenCashRegisterSheet
                    open={showOpenCash}
                    onOpenChange={setShowOpenCash}
                    onSuccess={() => { }}
                />
                {currentRegister && (
                    <BlindClosingSheet
                        open={showCloseCash}
                        onOpenChange={setShowCloseCash}
                        cashRegisterId={currentRegister.id}
                        onSuccess={() => { }}
                    />
                )}
            </div>
        );
    }

    // Desktop: Tabs Navigation
    return (
        <div className="h-screen flex flex-col bg-background">
            {/* Header Desktop */}
            <FinancialHeader
                isCashOpen={isCashOpen}
                currentRegister={currentRegister}
                onOpenCash={() => setShowOpenCash(true)}
                onCloseCash={() => setShowCloseCash(true)}
                isMobile={false}
            />

            {/* Tabs */}
            <Tabs defaultValue={defaultTab} className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="flex-none bg-card/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 px-6">
                    {financialCategories.map((cat) => (
                        <TabsTrigger
                            key={cat.id}
                            value={cat.id}
                            className="flex items-center gap-2"
                            onClick={() => haptic.light()}
                        >
                            <cat.icon size={16} />
                            <span className="hidden lg:inline">{cat.title}</span>
                            <span className="lg:hidden">{cat.title.split(' ')[0]}</span>
                        </TabsTrigger>
                    ))}
                </TabsList>

                <div className="flex-1 overflow-y-auto">
                    {financialCategories.map((cat) => (
                        <TabsContent key={cat.id} value={cat.id} className="m-0 h-full">
                            {cat.component()}
                        </TabsContent>
                    ))}
                </div>
            </Tabs>

            {/* Modais */}
            <OpenCashRegisterSheet
                open={showOpenCash}
                onOpenChange={setShowOpenCash}
                onSuccess={() => { }}
            />
            {currentRegister && (
                <BlindClosingSheet
                    open={showCloseCash}
                    onOpenChange={setShowCloseCash}
                    cashRegisterId={currentRegister.id}
                    onSuccess={() => { }}
                />
            )}
        </div>
    );
};

/**
 * FinancialHeader
 * 
 * Header com status do caixa e ações
 */
interface FinancialHeaderProps {
    isCashOpen: boolean;
    currentRegister: any;
    onOpenCash: () => void;
    onCloseCash: () => void;
    isMobile: boolean;
}

const FinancialHeader: React.FC<FinancialHeaderProps> = ({
    isCashOpen,
    currentRegister,
    onOpenCash,
    onCloseCash,
    isMobile
}) => {
    const { profile } = useAuth();

    return (
        <header className="flex-none bg-card border-b border-gray-200 dark:border-gray-800 p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Left: Título + Status */}
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                        Gestão Financeira
                    </h1>

                    {/* Badge de Status */}
                    <div className="flex items-center gap-3 mt-2">
                        {isCashOpen ? (
                            <>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-lg">
                                    <Unlock className="text-emerald-600 dark:text-emerald-400" size={16} />
                                    <span className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                                        Caixa Aberto
                                    </span>
                                </div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Operador: <strong>{currentRegister?.responsible_name || profile?.name}</strong>
                                </span>
                                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                    R$ {currentRegister?.calculated_balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                                </span>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
                                <Lock className="text-red-600 dark:text-red-400" size={16} />
                                <span className="text-sm font-bold text-red-900 dark:text-red-100">
                                    Caixa Fechado
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Ações */}
                <div className="flex items-center gap-3">
                    {!isCashOpen ? (
                        <button
                            onClick={onOpenCash}
                            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-colors"
                        >
                            <Unlock size={18} />
                            <span>{isMobile ? 'Abrir' : 'Abrir Caixa'}</span>
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={onCloseCash}
                                className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium shadow-sm transition-colors"
                            >
                                <Calculator size={18} />
                                <span>{isMobile ? 'Fechar' : 'Fechar Caixa'}</span>
                            </button>
                            <button
                                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors"
                            >
                                <ArrowDownFromLine size={18} />
                                <span className="hidden md:inline">Sangria</span>
                            </button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default FinancialAppShell;
