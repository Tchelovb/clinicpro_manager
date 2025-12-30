import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import {
    ArrowUpCircle, ArrowDownCircle, DollarSign, Download, Filter,
    Wallet, FileText, TrendingUp, AlertTriangle, Lock, Unlock,
    Plus, Calendar, CreditCard, CheckCircle, Clock, Search, X, Calculator,
    ArrowUpFromLine, ArrowDownFromLine
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "../components/ui/drawer";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table";
import { ExpenseSheet } from '../components/financial/ExpenseSheet';
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
    const [showExpenseSheet, setShowExpenseSheet] = useState(false);
    const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

    // Derived from Context
    const { expenses: allExpenses, addExpense } = useData();

    // Compute unique categories and suppliers from existing expenses + defaults
    const categories = useMemo(() => {
        const unique = new Set(['Aluguel', 'Energia', 'Água', 'Internet', 'Salários', 'Materiais', 'Manutenção', 'Impostos', 'Marketing']);
        allExpenses.forEach(e => { if (e.category) unique.add(e.category) });
        return Array.from(unique).map(c => ({ id: c, name: c }));
    }, [allExpenses]);

    const suppliers = useMemo(() => {
        const unique = new Set(['Dental Cremer', 'Surya Dental', 'Laboratório A', 'Laboratório B']);
        allExpenses.forEach(e => { if (e.provider) unique.add(e.provider) });
        return Array.from(unique).map(s => ({ id: s, name: s }));
    }, [allExpenses]);

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
        <div className="h-full flex flex-col bg-background overflow-hidden transition-colors duration-300">
            {/* HEADER FIXO */}
            <header className="flex-none bg-card border-b border-slate-200 dark:border-slate-800 p-4 md:p-6">
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
                            className="hidden md:flex items-center gap-2 px-3 md:px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium shadow-sm transition-colors text-sm"
                        >
                            <Calculator size={18} />
                            <span>Fechamento</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* TABS */}
            <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="flex-none bg-card/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 px-3 md:px-6 overflow-x-auto">
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
                        {/* Summary Cards (Enterprise) - Mobile Carousel */}
                        <div className="flex overflow-x-auto pb-4 snap-x snap-mandatory gap-4 -mx-4 px-4 scroll-pl-4 md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible md:pb-0 md:px-0 scrollbar-hide">
                            <SummaryCard
                                className="min-w-[90vw] sm:min-w-[300px] snap-start"
                                title="Entradas Hoje"
                                value={`R$ ${(todayIncome / 1000).toFixed(1)}k`}
                                icon={ArrowUpCircle}
                                color="emerald"
                                subtitle={`${todayRecords.filter(r => r.type === 'income').length} transações`}
                            />
                            <SummaryCard
                                className="min-w-[90vw] sm:min-w-[300px] snap-start"
                                title="Saídas Hoje"
                                value={`R$ ${(todayExpense / 1000).toFixed(1)}k`}
                                icon={ArrowDownCircle}
                                color="rose"
                                subtitle={`${todayRecords.filter(r => r.type === 'expense').length} transações`}
                            />
                            <SummaryCard
                                className="min-w-[90vw] sm:min-w-[300px] snap-start"
                                title="Resultado Operacional"
                                value={`R$ ${(result / 1000).toFixed(1)}k`}
                                icon={TrendingUp}
                                color={result >= 0 ? 'blue' : 'rose'}
                                subtitle={result >= 0 ? 'Positivo' : 'Negativo'}
                            />
                            <SummaryCard
                                className="min-w-[90vw] sm:min-w-[300px] snap-start"
                                title="Ticket Médio"
                                value="R$ 450"
                                icon={DollarSign}
                                color="violet"
                                subtitle="Média por paciente"
                            />
                        </div>

                        {/* Fintech Shortcuts */}
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Acesso Rápido Fintech</h3>
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
                                    className="bg-card p-6 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-colors group"
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
                                    className="bg-card p-6 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-green-500 dark:hover:border-green-500 transition-colors group"
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
                        <div className="bg-card rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800/50 flex justify-between items-center">
                                <h3 className="font-bold text-slate-800 dark:text-slate-100">Últimas Movimentações</h3>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
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
                    {/* MOVIMENTAÇÕES (All Transactions) */}
                    <TabsContent value="transactions" className="p-3 md:p-6 m-0 space-y-4">
                        <div className="bg-card rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                            {/* Desktop Table */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Data</TableHead>
                                            <TableHead>Descrição</TableHead>
                                            <TableHead>Categoria</TableHead>
                                            <TableHead className="text-right">Valor</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {globalFinancials.length > 0 ? globalFinancials.map((t) => (
                                            <TableRow key={t.id}>
                                                <TableCell>{t.date}</TableCell>
                                                <TableCell>{t.description}</TableCell>
                                                <TableCell>{t.category}</TableCell>
                                                <TableCell className={`text-right font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {t.type === 'income' ? '+' : '-'} {t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </TableCell>
                                                <TableCell><StatusBadge status={t.status} /></TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                                    Nenhuma movimentação encontrada.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Cards (Vertical List) */}
                            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                                {globalFinancials.length > 0 ? globalFinancials.map((t) => (
                                    <div key={t.id} className="p-4 flex justify-between items-center">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium text-slate-900 dark:text-white line-clamp-1">{t.description}</span>
                                            <span className="text-xs text-slate-500">{t.date} • {t.category}</span>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
                                            <span className={`font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                {t.type === 'income' ? '+' : '-'} {t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                            <StatusBadge status={t.status} />
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-8 text-center text-slate-500">Nenhuma movimentação.</div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* A RECEBER - Placeholder */}
                    {/* A RECEBER */}
                    <TabsContent value="receivables" className="p-3 md:p-6 m-0 space-y-4">
                        <div className="bg-card rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                            {/* Desktop Table */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Vencimento</TableHead>
                                            <TableHead>Paciente</TableHead>
                                            <TableHead>Descrição</TableHead>
                                            <TableHead className="text-right">Valor</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {allReceivables.length > 0 ? allReceivables.map((r, idx) => (
                                            <TableRow key={`${r.id}-${idx}`}>
                                                <TableCell>{r.dueDate}</TableCell>
                                                <TableCell>{r.patientName}</TableCell>
                                                <TableCell>{r.description || 'Parcela'}</TableCell>
                                                <TableCell className="text-right font-medium text-slate-900 dark:text-white">
                                                    {r.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </TableCell>
                                                <TableCell><StatusBadge status={r.status} /></TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                                    Nenhuma conta a receber.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                                {allReceivables.length > 0 ? allReceivables.map((r, idx) => (
                                    <div key={`${r.id}-${idx}`} className="p-4 flex justify-between items-center">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium text-slate-900 dark:text-white line-clamp-1">{r.patientName}</span>
                                            <span className="text-xs text-slate-500">Vence: {r.dueDate}</span>
                                            <span className="text-xs text-slate-400">{r.description}</span>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
                                            <span className="font-bold text-slate-900 dark:text-white">
                                                {r.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                            <StatusBadge status={r.status} />
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-8 text-center text-slate-500">Nenhuma conta a receber.</div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* A PAGAR - Placeholder */}
                    {/* A PAGAR */}
                    <TabsContent value="payables" className="p-3 md:p-6 m-0 space-y-4">
                        <div className="bg-card rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                            {/* Desktop Table */}
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Vencimento</TableHead>
                                            <TableHead>Descriçao</TableHead>
                                            <TableHead>Categoria</TableHead>
                                            <TableHead className="text-right">Valor</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {expenses.length > 0 ? expenses.map((e) => (
                                            <TableRow key={e.id}>
                                                <TableCell>{e.dueDate}</TableCell>
                                                <TableCell>{e.description}</TableCell>
                                                <TableCell>{e.category}</TableCell>
                                                <TableCell className="text-right font-medium text-slate-900 dark:text-white">
                                                    {e.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </TableCell>
                                                <TableCell><StatusBadge status={e.status} /></TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                                    Nenhuma despesa ou conta a pagar.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Mobile Cards */}
                            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                                {expenses.length > 0 ? expenses.map((e) => (
                                    <div key={e.id} className="p-4 flex justify-between items-center">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-medium text-slate-900 dark:text-white line-clamp-1">{e.description}</span>
                                            <span className="text-xs text-slate-500">Vence: {e.dueDate}</span>
                                            <span className="text-xs text-slate-400">{e.category}</span>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
                                            <span className="font-bold text-slate-900 dark:text-white">
                                                {e.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                            <StatusBadge status={e.status} />
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-8 text-center text-slate-500">Nenhuma despesa cadastrada.</div>
                                )}
                            </div>
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

            {/* Expense Sheet (Drawer on Mobile via BaseSheet) */}
            <ExpenseSheet
                open={showExpenseSheet}
                onOpenChange={setShowExpenseSheet}
                expense={null}
                categories={categories}
                suppliers={suppliers}
                onSave={async (data) => {
                    await addExpense({
                        description: data.description,
                        amount: data.amount,
                        category: data.category_id, // category_id holds the name string
                        provider: data.supplier_id, // supplier_id holds the name string
                        dueDate: data.due_date.toISOString(),
                        status: data.status,
                        notes: data.notes
                    });
                    setShowExpenseSheet(false);
                }}
            />

            {/* Mobile Action Sheet FAB */}
            <button
                onClick={() => setIsActionSheetOpen(true)}
                className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 text-white rounded-full 
                          shadow-xl shadow-emerald-600/30 flex items-center justify-center 
                          hover:scale-105 active:scale-95 transition-all z-50 animate-in zoom-in"
            >
                <Plus size={28} />
            </button>

            {/* Action Sheet Drawer */}
            <Drawer open={isActionSheetOpen} onOpenChange={setIsActionSheetOpen}>
                <DrawerContent className="pb-[max(20px,env(safe-area-inset-bottom))] rounded-t-[10px]">
                    <DrawerHeader>
                        <DrawerTitle className="text-center text-sm font-bold text-slate-500 uppercase tracking-wider">
                            Ações Financeiras
                        </DrawerTitle>
                    </DrawerHeader>
                    <div className="p-4 pt-0">
                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    setShowExpenseSheet(true);
                                    setIsActionSheetOpen(false);
                                }}
                                className="w-full bg-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 active:bg-slate-50 dark:active:bg-slate-800"
                            >
                                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                                    <ArrowDownFromLine size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-slate-900 dark:text-white">NOVA DESPESA</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Pagar conta ou fornecedor</p>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    // Placeholder for Revenue
                                    toast('Receita em Breve!', { icon: '💰' });
                                    setIsActionSheetOpen(false);
                                }}
                                className="w-full bg-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 active:bg-slate-50 dark:active:bg-slate-800"
                            >
                                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                                    <ArrowUpFromLine size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-slate-900 dark:text-white">NOVA RECEITA</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Lançar ganho avulso</p>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    navigate('/financial/closing');
                                    setIsActionSheetOpen(false);
                                }}
                                className="w-full bg-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 active:bg-slate-50 dark:active:bg-slate-800"
                            >
                                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                    <Calculator size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="font-bold text-slate-900 dark:text-white">FECHAMENTO</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Conferir e fechar caixa</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    );
};

export default Financial;
