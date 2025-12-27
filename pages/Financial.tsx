import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import {
    ArrowUpCircle, ArrowDownCircle, DollarSign, Download, Filter,
    Wallet, FileText, TrendingUp, AlertTriangle, Lock, Unlock,
    Plus, Calendar, CreditCard, CheckCircle, Clock, Search, X, Calculator
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import CashClosingWizard from '../components/CashClosingWizard';
import SangriaSuprimentoModal from '../components/SangriaSuprimentoModal';
import { SummaryCard } from '../components/ui/SummaryCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import FinancialDRE from '../components/finance/FinancialDRE';

const Financial: React.FC = () => {
    const {
        currentRegister, cashRegisters, expenses, globalFinancials, patients,
        openRegister, closeRegister, payExpense, financialSettings
    } = useData();
    const navigate = useNavigate();

    const [showClosingWizard, setShowClosingWizard] = useState(false);
    const [showSangriaModal, setShowSangriaModal] = useState<{ open: boolean; type: 'sangria' | 'suprimento' }>({ open: false, type: 'suprimento' });

    // Filter States
    const [receivableFilters, setReceivableFilters] = useState({
        startDate: '',
        endDate: '',
        description: '',
        patient: ''
    });

    const [payableFilters, setPayableFilters] = useState({
        startDate: '',
        endDate: '',
        description: '',
        provider: ''
    });

    // Helper functions for dates
    const parseDate = (dateStr: string) => {
        if (!dateStr) return null;
        const [day, month, year] = dateStr.split('/');
        return new Date(Number(year), Number(month) - 1, Number(day));
    };

    const checkDateRange = (itemDate: string, startDate: string, endDate: string) => {
        if (!startDate && !endDate) return true;

        const date = parseDate(itemDate);
        if (!date) return true;

        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        // Reset hours for fair comparison
        date.setHours(0, 0, 0, 0);
        if (start) start.setHours(0, 0, 0, 0);
        if (end) end.setHours(0, 0, 0, 0);

        if (start && date < start) return false;
        if (end && date > end) return false;

        return true;
    };

    // Calculate financial data
    const today = new Date().toLocaleDateString('pt-BR');
    const todayRecords = globalFinancials.filter(r => r.date === today);
    const todayIncome = todayRecords.filter(r => r.type === 'income').reduce((acc, r) => acc + r.amount, 0);
    const todayExpense = todayRecords.filter(r => r.type === 'expense').reduce((acc, r) => acc + r.amount, 0);
    const totalRevenue = globalFinancials.filter(r => r.type === 'income').reduce((acc, r) => acc + r.amount, 0);
    const totalCosts = globalFinancials.filter(r => r.type === 'expense').reduce((acc, r) => acc + r.amount, 0);
    const result = totalRevenue - totalCosts;

    // Receivables data
    const allReceivables = patients.flatMap(p =>
        (p.financials || []).map(f => ({ ...f, patientName: p.name, patientId: p.id }))
    ).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
            {/* HEADER FIXO */}
            <header className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Left: Título + Saldo */}
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                            Gestão Financeira
                        </h1>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                                Saldo em Caixa:
                            </span>
                            <span className="text-base md:text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                R$ {currentRegister?.calculatedBalance.toLocaleString('pt-BR') || '0,00'}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${currentRegister
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                }`}>
                                {currentRegister ? '🟢 Aberto' : '🔴 Fechado'}
                            </span>
                        </div>
                    </div>

                    {/* Right: Ações */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/financial/closing')}
                            className="flex items-center gap-2 px-3 md:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium shadow-sm transition-colors text-sm"
                        >
                            <Calculator size={18} />
                            <span className="hidden md:inline">Fechamento</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* TABS */}
            <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="flex-none bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 px-3 md:px-6 overflow-x-auto">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                        <TrendingUp size={16} />
                        <span className="hidden sm:inline">Visão Geral</span>
                        <span className="sm:hidden">Visão</span>
                    </TabsTrigger>
                    <TabsTrigger value="transactions" className="flex items-center gap-2">
                        <Wallet size={16} />
                        <span className="hidden sm:inline">Movimentações</span>
                        <span className="sm:hidden">Caixa</span>
                    </TabsTrigger>
                    <TabsTrigger value="receivables" className="flex items-center gap-2">
                        <ArrowUpCircle size={16} />
                        <span className="hidden sm:inline">A Receber</span>
                        <span className="sm:hidden">Receber</span>
                    </TabsTrigger>
                    <TabsTrigger value="payables" className="flex items-center gap-2">
                        <ArrowDownCircle size={16} />
                        <span className="hidden sm:inline">A Pagar</span>
                        <span className="sm:hidden">Pagar</span>
                    </TabsTrigger>
                    <TabsTrigger value="dre" className="flex items-center gap-2">
                        <FileText size={16} />
                        DRE
                    </TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto scroll-smooth">
                    {/* VISÃO GERAL */}
                    <TabsContent value="overview" className="p-3 md:p-6 space-y-6 m-0">
                        {/* Summary Cards (Enterprise) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <SummaryCard
                                title="Entradas Hoje"
                                value={`R$ ${(todayIncome / 1000).toFixed(1)}k`}
                                icon={ArrowUpCircle}
                                color="emerald"
                                subtitle={`${todayRecords.filter(r => r.type === 'income').length} transações`}
                            />
                            <SummaryCard
                                title="Saídas Hoje"
                                value={`R$ ${(todayExpense / 1000).toFixed(1)}k`}
                                icon={ArrowDownCircle}
                                color="rose"
                                subtitle={`${todayRecords.filter(r => r.type === 'expense').length} transações`}
                            />
                            <SummaryCard
                                title="Resultado Operacional"
                                value={`R$ ${(result / 1000).toFixed(1)}k`}
                                icon={TrendingUp}
                                color={result >= 0 ? 'blue' : 'rose'}
                                subtitle={result >= 0 ? 'Positivo' : 'Negativo'}
                            />
                            <SummaryCard
                                title="Ticket Médio"
                                value="R$ 450"
                                icon={DollarSign}
                                color="violet"
                                subtitle="Média por paciente"
                            />
                        </div>

                        {/* Fintech Shortcuts */}
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Acesso Rápido Fintech</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div
                                    onClick={() => navigate('/cfo')}
                                    className="bg-gradient-to-br from-purple-600 to-indigo-600 p-6 rounded-xl text-white cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <TrendingUp className="w-8 h-8 opacity-80" />
                                        <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded">NOVO</span>
                                    </div>
                                    <h4 className="text-xl font-bold mb-1">CFO Dashboard</h4>
                                    <p className="text-purple-100 text-sm">DRE, PDD, Fluxo de Caixa e Health Score.</p>
                                </div>

                                <div
                                    onClick={() => navigate('/receivables')}
                                    className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-colors group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 transition-colors">
                                            <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Contas a Receber</h4>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">Gerencie parcelas, régua de cobrança e inadimplência.</p>
                                </div>

                                <div
                                    onClick={() => navigate('/professional-financial')}
                                    className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-green-500 dark:hover:border-green-500 transition-colors group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg group-hover:bg-green-100 dark:group-hover:bg-green-900/40 transition-colors">
                                            <Calculator className="w-6 h-6 text-green-600 dark:text-green-400" />
                                        </div>
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Extrato Profissional</h4>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">Controle de comissões, adiantamentos e fechamentos.</p>
                                </div>
                            </div>
                        </div>

                        {/* Recent Transactions */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 dark:text-white">Últimas Movimentações</h3>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {globalFinancials.length > 0 ? (
                                    globalFinancials.slice(0, 5).map((t, idx) => (
                                        <div key={idx} className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full shrink-0 ${t.type === 'income' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                    {t.type === 'income' ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{t.description}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{t.date} • {t.category}</p>
                                                </div>
                                            </div>
                                            <span className={`font-bold text-sm ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR')}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-slate-400">
                                        Nenhuma movimentação registrada.
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* MOVIMENTAÇÕES - Placeholder por enquanto */}
                    <TabsContent value="transactions" className="p-3 md:p-6 m-0">
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-12 text-center">
                            <Wallet size={48} className="text-slate-400 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                Movimentações
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Conteúdo em migração...
                            </p>
                        </div>
                    </TabsContent>

                    {/* A RECEBER - Placeholder */}
                    <TabsContent value="receivables" className="p-3 md:p-6 m-0">
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-12 text-center">
                            <ArrowUpCircle size={48} className="text-slate-400 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                Contas a Receber
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Conteúdo em migração...
                            </p>
                        </div>
                    </TabsContent>

                    {/* A PAGAR - Placeholder */}
                    <TabsContent value="payables" className="p-3 md:p-6 m-0">
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-12 text-center">
                            <ArrowDownCircle size={48} className="text-slate-400 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                Contas a Pagar
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Conteúdo em migração...
                            </p>
                        </div>
                    </TabsContent>

                    {/* DRE GERENCIAL */}
                    <TabsContent value="dre" className="p-3 md:p-6 m-0">
                        <FinancialDRE />
                    </TabsContent>
                </div>
            </Tabs>

            {/* MODALS */}
            {showClosingWizard && currentRegister && (
                <CashClosingWizard
                    registerId={currentRegister.id}
                    onClose={() => setShowClosingWizard(false)}
                />
            )}

            {showSangriaModal.open && (
                <SangriaSuprimentoModal
                    onClose={() => setShowSangriaModal({ ...showSangriaModal, open: false })}
                    type={showSangriaModal.type}
                />
            )}
        </div>
    );
};

export default Financial;
