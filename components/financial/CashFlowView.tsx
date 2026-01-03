import React, { useState, useEffect } from 'react';
import {
    ArrowUpCircle, ArrowDownCircle, ArrowRightLeft,
    Plus, Calendar, DollarSign
} from 'lucide-react';
import { SecureActionWrapper } from './SecureActionWrapper';
import { TransactionsTable } from './TransactionsTable';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { useHaptic } from '../../utils/haptics';
import toast from 'react-hot-toast';

interface Transaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    payment_method: string;
    payment_status: string;
}

/**
 * CashFlowView
 * 
 * View de Fluxo de Caixa
 * - Botões de ação (Receber, Pagar, Transferir)
 * - Tabela de transações (ZERO inline editing)
 * - Filtros por data/categoria
 * - Resumo de entradas/saídas
 */
export const CashFlowView: React.FC = () => {
    const { profile } = useAuth();
    const haptic = useHaptic();

    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({
        totalIncome: 0,
        totalExpense: 0,
        balance: 0
    });

    // Buscar transações
    useEffect(() => {
        const fetchTransactions = async () => {
            if (!profile?.clinic_id) return;

            try {
                setLoading(true);

                const { data, error } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('clinic_id', profile.clinic_id)
                    .order('date', { ascending: false })
                    .limit(50);

                if (error) throw error;

                setTransactions(data || []);

                // Calcular resumo
                const income = data?.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0) || 0;
                const expense = data?.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0) || 0;

                setSummary({
                    totalIncome: income,
                    totalExpense: expense,
                    balance: income - expense
                });

            } catch (error: any) {
                console.error('Erro ao buscar transações:', error);
                toast.error('Erro ao carregar transações');
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [profile?.clinic_id]);

    const handleViewDetails = (transaction: Transaction) => {
        haptic.light();
        // TODO: Abrir modal de detalhes
        toast('Detalhes da transação (em desenvolvimento)');
    };

    const handleRefund = (transaction: Transaction) => {
        haptic.warning();
        // TODO: Abrir RefundSheet com PIN
        toast('Estorno (em desenvolvimento)');
    };

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        ))}
                    </div>
                    <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Fluxo de Caixa
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Lançamentos e movimentações financeiras
                    </p>
                </div>

                {/* Filtros (Placeholder) */}
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <Calendar size={18} />
                        <span className="text-sm">Filtrar período</span>
                    </button>
                </div>
            </div>

            {/* Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Entradas */}
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                            Total Entradas
                        </span>
                        <ArrowUpCircle className="text-emerald-600 dark:text-emerald-400" size={20} />
                    </div>
                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                        R$ {summary.totalIncome.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}
                    </p>
                </div>

                {/* Total Saídas */}
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-red-900 dark:text-red-100">
                            Total Saídas
                        </span>
                        <ArrowDownCircle className="text-red-600 dark:text-red-400" size={20} />
                    </div>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                        R$ {summary.totalExpense.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}
                    </p>
                </div>

                {/* Saldo */}
                <div className={`
          ${summary.balance >= 0
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                        : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
                    } border rounded-xl p-6
        `}>
                    <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${summary.balance >= 0
                            ? 'text-blue-900 dark:text-blue-100'
                            : 'text-amber-900 dark:text-amber-100'
                            }`}>
                            Saldo
                        </span>
                        <DollarSign className={
                            summary.balance >= 0
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-amber-600 dark:text-amber-400'
                        } size={20} />
                    </div>
                    <p className={`text-3xl font-bold ${summary.balance >= 0
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-amber-600 dark:text-amber-400'
                        }`}>
                        R$ {Math.abs(summary.balance).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}
                    </p>
                </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex flex-wrap gap-3">
                <SecureActionWrapper action="Receber Pagamento">
                    <button
                        onClick={() => {
                            haptic.medium();
                            toast('Receber Pagamento (use AdvancedPaymentModal)');
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-sm transition-colors"
                    >
                        <ArrowUpCircle size={20} />
                        Receber
                    </button>
                </SecureActionWrapper>

                <SecureActionWrapper action="Pagar Despesa">
                    <button
                        onClick={() => {
                            haptic.medium();
                            toast('Pagar Despesa (em desenvolvimento)');
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-sm transition-colors"
                    >
                        <ArrowDownCircle size={20} />
                        Pagar
                    </button>
                </SecureActionWrapper>

                <SecureActionWrapper action="Transferir">
                    <button
                        onClick={() => {
                            haptic.medium();
                            toast('Transferência (em desenvolvimento)');
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-sm transition-colors"
                    >
                        <ArrowRightLeft size={20} />
                        Transferir
                    </button>
                </SecureActionWrapper>

                <SecureActionWrapper action="Novo Lançamento">
                    <button
                        onClick={() => {
                            haptic.medium();
                            toast('Novo Lançamento (em desenvolvimento)');
                        }}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium shadow-sm transition-colors"
                    >
                        <Plus size={20} />
                        Novo Lançamento
                    </button>
                </SecureActionWrapper>
            </div>

            {/* Tabela de Transações */}
            <TransactionsTable
                transactions={transactions}
                onViewDetails={handleViewDetails}
                onRefund={handleRefund}
            />
        </div>
    );
};

export default CashFlowView;
