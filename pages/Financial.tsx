import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';
import {
    ArrowUpCircle, ArrowDownCircle, DollarSign, Download, Filter,
    Wallet, FileText, TrendingUp, AlertTriangle, Lock, Unlock,
    Plus, Calendar, CreditCard, CheckCircle, Clock, Search, X
} from 'lucide-react';
import CashClosingWizard from '../components/CashClosingWizard';
import SangriaSuprimentoModal from '../components/SangriaSuprimentoModal';

const Financial: React.FC = () => {
    const {
        currentRegister, cashRegisters, expenses, globalFinancials, patients,
        openRegister, closeRegister, payExpense, financialSettings
    } = useData();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState<'dashboard' | 'caixa' | 'pagar' | 'receber'>('dashboard');
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

    const DashboardView = () => {
        const today = new Date().toLocaleDateString('pt-BR');
        const todayRecords = globalFinancials.filter(r => r.date === today);
        const todayIncome = todayRecords.filter(r => r.type === 'income').reduce((acc, r) => acc + r.amount, 0);
        const todayExpense = todayRecords.filter(r => r.type === 'expense').reduce((acc, r) => acc + r.amount, 0);
        const totalRevenue = globalFinancials.filter(r => r.type === 'income').reduce((acc, r) => acc + r.amount, 0);
        const totalCosts = globalFinancials.filter(r => r.type === 'expense').reduce((acc, r) => acc + r.amount, 0);
        const result = totalRevenue - totalCosts;

        return (
            <div className="space-y-4 md:space-y-6 animate-in fade-in">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Entradas Hoje</p>
                        <h3 className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">R$ {todayIncome.toLocaleString('pt-BR')}</h3>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Saídas Hoje</p>
                        <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">R$ {todayExpense.toLocaleString('pt-BR')}</h3>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Resultado Operacional (DRE)</p>
                        <h3 className={`text-2xl font-bold mt-1 ${result >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500 dark:text-red-400'}`}>
                            R$ {result.toLocaleString('pt-BR')}
                        </h3>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ticket Médio</p>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">R$ 450,00</h3>
                    </div>
                </div>
            </div>
        );
    };

    const CaixaView = () => {
        const [openAmount, setOpenAmount] = useState('');

        const handleOpen = () => {
            openRegister(parseFloat(openAmount) || 0, 'Dr. Marcelo Vilas Boas');
            setOpenAmount('');
        };

        return (
            <div className="space-y-4 md:space-y-6 animate-in fade-in">
                <div className={`p-4 md:p-6 rounded-xl border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 
            ${currentRegister ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'}`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-3 md:p-4 rounded-full ${currentRegister ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400' : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                            {currentRegister ? <Unlock size={24} className="md:w-8 md:h-8" /> : <Lock size={24} className="md:w-8 md:h-8" />}
                        </div>
                        <div>
                            <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{currentRegister ? 'Caixa Aberto' : 'Caixa Fechado'}</h2>
                            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                                {currentRegister ? `Iniciado às ${new Date(currentRegister.openedAt).toLocaleTimeString()} por ${currentRegister.responsibleName}` : 'Abra o caixa para iniciar as operações do dia.'}
                            </p>
                        </div>
                    </div>

                    {!currentRegister ? (
                        <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto mt-2 md:mt-0">
                            <input
                                type="number"
                                placeholder="Saldo Inicial R$"
                                className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 md:py-2 w-full md:w-40 bg-white dark:bg-gray-700 dark:text-white"
                                value={openAmount}
                                onChange={e => setOpenAmount(e.target.value)}
                            />
                            <button onClick={handleOpen} className="bg-green-600 text-white px-6 py-3 md:py-2 rounded-lg font-bold hover:bg-green-700 w-full md:w-auto shadow-sm active:scale-95 transition-transform">
                                Abrir Caixa
                            </button>
                        </div>
                    ) : (
                        <div className="w-full md:w-auto bg-white dark:bg-slate-700/50 p-3 rounded-lg border border-green-100 dark:border-green-900/30 md:border-0 md:bg-transparent">
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Saldo Atual</p>
                            <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">R$ {currentRegister.calculatedBalance.toLocaleString('pt-BR')}</p>
                        </div>
                    )}
                </div>

                {currentRegister && (
                    <div className="flex flex-col gap-6">
                        {/* Quick Actions Bar */}
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            <button
                                onClick={() => setShowSangriaModal({ open: true, type: 'suprimento' })}
                                className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg font-bold hover:bg-green-200 transition-colors shadow-sm text-sm"
                            >
                                <ArrowUpCircle size={18} /> Suprimento
                            </button>
                            <button
                                onClick={() => setShowSangriaModal({ open: true, type: 'sangria' })}
                                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg font-bold hover:bg-red-200 transition-colors shadow-sm text-sm"
                            >
                                <ArrowDownCircle size={18} /> Sangria
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
                                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-800 dark:text-white">Movimentações</h3>
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 border dark:border-gray-600 px-2 py-1 rounded">ID: {currentRegister.id}</span>
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[400px] overflow-y-auto">
                                    {currentRegister.transactions.length > 0 ? (
                                        currentRegister.transactions.map(t => (
                                            <div key={t.id} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-full shrink-0 ${t.type === 'income' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                        {t.type === 'income' ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{t.description}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{t.paymentMethod} • {t.category}</p>
                                                    </div>
                                                </div>
                                                <span className={`font-bold text-sm ml-2 ${t.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                    {t.type === 'income' ? '+' : '-'} {t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </span>
                                            </div>
                                        ))
                                    ) : <div className="p-8 text-center text-gray-400">Nenhuma movimentação registrada hoje.</div>}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 h-fit">
                                <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2"><Lock size={18} /> Fechamento</h3>
                                <div className="space-y-4">
                                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                        <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                                            Ao fechar o caixa, você precisará conferir os comprovantes de cartão e contar o dinheiro em espécie.
                                        </p>
                                        {financialSettings?.blind_closing && (
                                            <div className="flex items-center gap-2 text-xs font-bold text-yellow-700 dark:text-yellow-300 mt-2">
                                                <Lock size={12} /> MODO CEGO ATIVO
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setShowClosingWizard(true)}
                                        className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors shadow-sm active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={18} /> Iniciar Fechamento
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showSangriaModal.open && (
                    <SangriaSuprimentoModal
                        onClose={() => setShowSangriaModal({ ...showSangriaModal, open: false })}
                        type={showSangriaModal.type}
                    />
                )}

                {showClosingWizard && currentRegister && (
                    <CashClosingWizard
                        registerId={currentRegister.id}
                        onClose={() => setShowClosingWizard(false)}
                    />
                )}
            </div>
        );
    };

    const PayablesView = () => {
        return (
            <div className="space-y-4 md:space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 dark:text-gray-200 text-lg">Contas a Pagar</h3>
                    <button onClick={() => navigate('/financial/expenses/new')} className="bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-2 shadow-sm">
                        <Plus size={18} /> <span className="hidden md:inline">Nova Despesa</span><span className="md:hidden">Nova</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Vencimento (De)</label>
                        <input
                            type="date"
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-sm dark:text-white"
                            value={payableFilters.startDate}
                            onChange={e => setPayableFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Vencimento (Até)</label>
                        <input
                            type="date"
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-sm dark:text-white"
                            value={payableFilters.endDate}
                            onChange={e => setPayableFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Descrição</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                                type="text"
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm dark:text-white"
                                placeholder="Filtrar descrição..."
                                value={payableFilters.description}
                                onChange={e => setPayableFilters(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Fornecedor</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                                type="text"
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm dark:text-white"
                                placeholder="Filtrar fornecedor..."
                                value={payableFilters.provider}
                                onChange={e => setPayableFilters(prev => ({ ...prev, provider: e.target.value }))}
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {/* Desktop Table */}
                    <div className="hidden md:block">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-3">Vencimento</th>
                                    <th className="px-6 py-3">Descrição</th>
                                    <th className="px-6 py-3">Categoria</th>
                                    <th className="px-6 py-3">Fornecedor</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Valor</th>
                                    <th className="px-6 py-3 text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {expenses.filter(expense => {
                                    const matchesDate = checkDateRange(expense.dueDate, payableFilters.startDate, payableFilters.endDate);
                                    const matchesDesc = expense.description.toLowerCase().includes(payableFilters.description.toLowerCase());
                                    const matchesProv = expense.provider.toLowerCase().includes(payableFilters.provider.toLowerCase());
                                    return matchesDate && matchesDesc && matchesProv;
                                }).map(expense => (
                                    <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-400">{expense.dueDate}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{expense.description}</td>
                                        <td className="px-6 py-4"><span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs text-gray-700 dark:text-gray-300">{expense.category}</span></td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{expense.provider}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border 
                                    ${expense.status === 'Pago' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' :
                                                    expense.status === 'Pago Parcial' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' :
                                                        expense.status === 'Atrasado' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800' :
                                                            'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'}`}>{expense.status}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">R$ {expense.amount.toLocaleString('pt-BR')}</td>
                                        <td className="px-6 py-4 text-right">
                                            {expense.status !== 'Pago' && (
                                                <button onClick={() => navigate(`/financial/pay/${expense.id}`)} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700">Pagar</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card List */}
                    <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
                        {expenses.filter(expense => {
                            const matchesDate = checkDateRange(expense.dueDate, payableFilters.startDate, payableFilters.endDate);
                            const matchesDesc = expense.description.toLowerCase().includes(payableFilters.description.toLowerCase());
                            const matchesProv = expense.provider.toLowerCase().includes(payableFilters.provider.toLowerCase());
                            return matchesDate && matchesDesc && matchesProv;
                        }).map(expense => (
                            <div key={expense.id} className="p-4 flex flex-col gap-3 relative border-l-4 border-transparent hover:border-red-500 transition-all">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0 pr-2">
                                        <p className="font-bold text-gray-900 dark:text-white truncate">{expense.description}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{expense.provider} • {expense.category}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-bold text-gray-900 dark:text-white">R$ {expense.amount.toLocaleString('pt-BR')}</p>
                                        <p className="text-xs text-gray-500 font-mono mt-0.5">{expense.dueDate}</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border 
                                ${expense.status === 'Pago' ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' :
                                            'bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800'}`}>
                                        {expense.status}
                                    </span>
                                    {expense.status !== 'Pago' && (
                                        <button
                                            onClick={() => navigate(`/financial/pay/${expense.id}`)}
                                            className="bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm active:scale-95 transition-transform"
                                        >
                                            Pagar
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {expenses.length === 0 && <div className="p-8 text-center text-gray-400">Nenhuma despesa registrada.</div>}
                </div>
            </div >
        );
    };

    const ReceivablesView = () => {
        const allReceivables = patients.flatMap(p =>
            (p.financials || []).map(f => ({ ...f, patientName: p.name, patientId: p.id }))
        ).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

        return (
            <div className="space-y-4 md:space-y-6 animate-in fade-in">
                <h3 className="font-bold text-gray-700 dark:text-gray-200 text-lg">Contas a Receber</h3>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Vencimento (De)</label>
                        <input
                            type="date"
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-sm dark:text-white"
                            value={receivableFilters.startDate}
                            onChange={e => setReceivableFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Vencimento (Até)</label>
                        <input
                            type="date"
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-sm dark:text-white"
                            value={receivableFilters.endDate}
                            onChange={e => setReceivableFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Descrição</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                                type="text"
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm dark:text-white"
                                placeholder="Filtrar descrição..."
                                value={receivableFilters.description}
                                onChange={e => setReceivableFilters(prev => ({ ...prev, description: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Paciente</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                                type="text"
                                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm dark:text-white"
                                placeholder="Filtrar paciente..."
                                value={receivableFilters.patient}
                                onChange={e => setReceivableFilters(prev => ({ ...prev, patient: e.target.value }))}
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">

                    {/* Desktop Table */}
                    <div className="hidden md:block">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-b dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-3">Vencimento</th>
                                    <th className="px-6 py-3">Paciente</th>
                                    <th className="px-6 py-3">Descrição</th>
                                    <th className="px-6 py-3">Forma</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3 text-right">Valor</th>
                                    <th className="px-6 py-3 text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {allReceivables.filter(item => {
                                    const matchesDate = checkDateRange(item.dueDate, receivableFilters.startDate, receivableFilters.endDate);
                                    const matchesDesc = item.description.toLowerCase().includes(receivableFilters.description.toLowerCase());
                                    const matchesPatient = item.patientName.toLowerCase().includes(receivableFilters.patient.toLowerCase());
                                    return matchesDate && matchesDesc && matchesPatient;
                                }).map((item, idx) => (
                                    <tr key={`${item.id}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-400">{item.dueDate}</td>
                                        <td className="px-6 py-4 font-medium text-blue-600 dark:text-blue-400">{item.patientName}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{item.description}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{item.paymentMethod}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border 
                                    ${item.status === 'Pago' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' :
                                                    'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'}`}>{item.status}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">R$ {item.amount.toLocaleString('pt-BR')}</td>
                                        <td className="px-6 py-4 text-right">
                                            {item.status !== 'Pago' && (
                                                <button onClick={() => navigate(`/financial/receive/${item.id}`)} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700">Receber</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card List */}
                    <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
                        {allReceivables.filter(item => {
                            const matchesDate = checkDateRange(item.dueDate, receivableFilters.startDate, receivableFilters.endDate);
                            const matchesDesc = item.description.toLowerCase().includes(receivableFilters.description.toLowerCase());
                            const matchesPatient = item.patientName.toLowerCase().includes(receivableFilters.patient.toLowerCase());
                            return matchesDate && matchesDesc && matchesPatient;
                        }).map((item, idx) => (
                            <div key={`${item.id}-${idx}`} className="p-4 flex flex-col gap-3 relative border-l-4 border-transparent hover:border-green-500 transition-all">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0 pr-2">
                                        <p className="font-bold text-gray-900 dark:text-white truncate">{item.patientName}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.description}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="font-bold text-gray-900 dark:text-white">R$ {item.amount.toLocaleString('pt-BR')}</p>
                                        <p className="text-xs text-gray-500 font-mono mt-0.5">{item.dueDate}</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex gap-2 items-center">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border 
                                    ${item.status === 'Pago' ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' :
                                                'bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800'}`}>
                                            {item.status}
                                        </span>
                                        <span className="text-[10px] text-gray-400 uppercase">{item.paymentMethod}</span>
                                    </div>

                                    {item.status !== 'Pago' && (
                                        <button
                                            onClick={() => navigate(`/financial/receive/${item.id}`)}
                                            className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm active:scale-95 transition-transform"
                                        >
                                            Receber
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6 pb-24 md:pb-0 flex flex-col h-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gestão Financeira</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Controle de caixa, contas e resultados</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                    {[
                        { id: 'dashboard', label: 'Visão Geral', icon: TrendingUp },
                        { id: 'caixa', label: 'Caixa Diário', icon: Wallet },
                        { id: 'pagar', label: 'A Pagar', icon: ArrowDownCircle },
                        { id: 'receber', label: 'A Receber', icon: ArrowUpCircle },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap transition-colors flex-shrink-0
                        ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                        >
                            <tab.icon size={16} /> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-visible">
                {activeTab === 'dashboard' && <DashboardView />}
                {activeTab === 'caixa' && <CaixaView />}
                {activeTab === 'pagar' && <PayablesView />}
                {activeTab === 'receber' && <ReceivablesView />}
            </div>
        </div>
    );
};

export default Financial;
