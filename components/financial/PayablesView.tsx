import React, { useState, useEffect } from 'react';
import {
    AlertTriangle, CheckCircle, Clock, Calendar,
    TrendingUp, DollarSign, Plus
} from 'lucide-react';
import { ExpensesTable } from './ExpensesTable';
import { SecureActionWrapper } from './SecureActionWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { useHaptic } from '../../utils/haptics';
import toast from 'react-hot-toast';

interface Expense {
    id: string;
    supplier_id?: string;
    supplier_name?: string;
    category: string;
    description: string;
    amount: number;
    due_date: string;
    paid_date?: string;
    status: 'PENDING' | 'PAID' | 'OVERDUE' | 'SCHEDULED';
    payment_method?: string;
    invoice_number?: string;
    notes?: string;
}

/**
 * PayablesView
 * 
 * View de Contas a Pagar
 * - Resumo de despesas (pendentes, vencidas, pagas)
 * - Tabela de despesas (ZERO inline editing)
 * - Filtros por categoria/período
 * - Agendamento de pagamentos
 */
export const PayablesView: React.FC = () => {
    const { profile } = useAuth();
    const haptic = useHaptic();

    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({
        totalPending: 0,
        totalOverdue: 0,
        totalPaid: 0,
        countPending: 0,
        countOverdue: 0,
        countPaid: 0
    });

    // Buscar despesas
    useEffect(() => {
        const fetchExpenses = async () => {
            if (!profile?.clinic_id) return;

            try {
                setLoading(true);

                const { data, error } = await supabase
                    .from('expenses')
                    .select('*')
                    .eq('clinic_id', profile.clinic_id)
                    .order('due_date', { ascending: true })
                    .limit(100);

                if (error) throw error;

                setExpenses(data || []);

                // Calcular resumo
                const today = new Date().toISOString().split('T')[0];

                const pending = data?.filter(e => e.status === 'PENDING' && e.due_date >= today) || [];
                const overdue = data?.filter(e => (e.status === 'PENDING' || e.status === 'OVERDUE') && e.due_date < today) || [];
                const paid = data?.filter(e => e.status === 'PAID') || [];

                setSummary({
                    totalPending: pending.reduce((sum, e) => sum + e.amount, 0),
                    totalOverdue: overdue.reduce((sum, e) => sum + e.amount, 0),
                    totalPaid: paid.reduce((sum, e) => sum + e.amount, 0),
                    countPending: pending.length,
                    countOverdue: overdue.length,
                    countPaid: paid.length
                });

            } catch (error: any) {
                console.error('Erro ao buscar despesas:', error);
                toast.error('Erro ao carregar despesas');
            } finally {
                setLoading(false);
            }
        };

        fetchExpenses();
    }, [profile?.clinic_id]);

    const handlePayExpense = (expense: Expense) => {
        haptic.medium();
        // TODO: Abrir PaymentSheet
        toast('Pagar Despesa (em desenvolvimento)');
    };

    const handleViewDetails = (expense: Expense) => {
        haptic.light();
        // TODO: Abrir modal de detalhes
        toast('Detalhes da despesa (em desenvolvimento)');
    };

    const handleNewExpense = () => {
        haptic.medium();
        // TODO: Abrir ExpenseSheet
        toast('Nova Despesa (em desenvolvimento)');
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
                        Contas a Pagar
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Despesas e fornecedores
                    </p>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <Calendar size={18} />
                        <span className="text-sm">Filtrar período</span>
                    </button>

                    <SecureActionWrapper action="Nova Despesa">
                        <button
                            onClick={handleNewExpense}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium shadow-sm transition-colors"
                        >
                            <Plus size={18} />
                            <span>Nova Despesa</span>
                        </button>
                    </SecureActionWrapper>
                </div>
            </div>

            {/* Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Pendentes */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
                            Pendentes
                        </span>
                        <Clock className="text-amber-600 dark:text-amber-400" size={20} />
                    </div>
                    <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mb-1">
                        R$ {summary.totalPending.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                        {summary.countPending} despesa(s)
                    </p>
                </div>

                {/* Vencidas */}
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-red-900 dark:text-red-100">
                            Vencidas
                        </span>
                        <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
                    </div>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">
                        R$ {summary.totalOverdue.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-300">
                        {summary.countOverdue} despesa(s) atrasada(s)
                    </p>
                </div>

                {/* Pagas */}
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                            Pagas
                        </span>
                        <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={20} />
                    </div>
                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                        R$ {summary.totalPaid.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}
                    </p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                        {summary.countPaid} despesa(s)
                    </p>
                </div>
            </div>

            {/* Alerta de Vencidas */}
            {summary.countOverdue > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
                        <div>
                            <p className="text-sm font-medium text-red-900 dark:text-red-100">
                                ⚠️ Atenção: {summary.countOverdue} despesa(s) vencida(s)
                            </p>
                            <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                                Total em atraso: R$ {summary.totalOverdue.toLocaleString('pt-BR', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}. Priorize o pagamento para evitar juros e multas.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Dica de Fluxo de Caixa */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <TrendingUp className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            💡 Dica: Planejamento de Fluxo de Caixa
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            Agende pagamentos com antecedência para manter o fluxo de caixa saudável e evitar surpresas.
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabela de Despesas */}
            <ExpensesTable
                expenses={expenses}
                onPayExpense={handlePayExpense}
                onViewDetails={handleViewDetails}
            />
        </div>
    );
};

export default PayablesView;
