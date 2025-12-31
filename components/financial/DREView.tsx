import React, { useState, useEffect } from 'react';
import {
    TrendingUp, TrendingDown, DollarSign, Percent,
    ArrowUpCircle, ArrowDownCircle, Calendar
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface DREData {
    // Receitas
    totalRevenue: number;
    serviceRevenue: number;
    productRevenue: number;

    // Custos Diretos
    totalDirectCosts: number;
    materialCosts: number;
    professionalCosts: number;
    labCosts: number;

    // Lucro Bruto
    grossProfit: number;
    grossMargin: number;

    // Despesas Operacionais
    totalOperationalExpenses: number;
    fixedExpenses: number;
    variableExpenses: number;
    administrativeExpenses: number;
    marketingExpenses: number;

    // Lucro Operacional
    operationalProfit: number;
    operationalMargin: number;

    // Lucro Líquido
    netProfit: number;
    netMargin: number;
}

/**
 * DREView
 * 
 * Demonstração do Resultado do Exercício (DRE)
 * - Receitas (serviços + produtos)
 * - Custos diretos (materiais + profissionais + lab)
 * - Lucro bruto e margem
 * - Despesas operacionais (fixas + variáveis)
 * - Lucro operacional e líquido
 * - Margens percentuais
 */
export const DREView: React.FC = () => {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
    const [dreData, setDreData] = useState<DREData>({
        totalRevenue: 0,
        serviceRevenue: 0,
        productRevenue: 0,
        totalDirectCosts: 0,
        materialCosts: 0,
        professionalCosts: 0,
        labCosts: 0,
        grossProfit: 0,
        grossMargin: 0,
        totalOperationalExpenses: 0,
        fixedExpenses: 0,
        variableExpenses: 0,
        administrativeExpenses: 0,
        marketingExpenses: 0,
        operationalProfit: 0,
        operationalMargin: 0,
        netProfit: 0,
        netMargin: 0
    });

    useEffect(() => {
        const fetchDREData = async () => {
            if (!profile?.clinic_id) return;

            try {
                setLoading(true);

                // Calcular período
                const now = new Date();
                const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

                // Buscar receitas
                const { data: transactions } = await supabase
                    .from('transactions')
                    .select('amount, type, category')
                    .eq('clinic_id', profile.clinic_id)
                    .gte('date', startDate)
                    .lte('date', endDate);

                // Buscar despesas
                const { data: expenses } = await supabase
                    .from('expenses')
                    .select('amount, category')
                    .eq('clinic_id', profile.clinic_id)
                    .gte('due_date', startDate)
                    .lte('due_date', endDate)
                    .eq('status', 'PAID');

                // Calcular receitas
                const totalRevenue = transactions
                    ?.filter(t => t.type === 'INCOME')
                    .reduce((sum, t) => sum + t.amount, 0) || 0;

                // Calcular custos diretos (simplificado)
                const materialCosts = expenses
                    ?.filter(e => e.category === 'Materiais' || e.category === 'Insumos')
                    .reduce((sum, e) => sum + e.amount, 0) || 0;

                const professionalCosts = expenses
                    ?.filter(e => e.category === 'Salários' || e.category === 'Comissões')
                    .reduce((sum, e) => sum + e.amount, 0) || 0;

                const labCosts = expenses
                    ?.filter(e => e.category === 'Laboratório')
                    .reduce((sum, e) => sum + e.amount, 0) || 0;

                const totalDirectCosts = materialCosts + professionalCosts + labCosts;

                // Calcular lucro bruto
                const grossProfit = totalRevenue - totalDirectCosts;
                const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

                // Calcular despesas operacionais
                const fixedExpenses = expenses
                    ?.filter(e => ['Aluguel', 'Energia', 'Água', 'Internet'].includes(e.category))
                    .reduce((sum, e) => sum + e.amount, 0) || 0;

                const administrativeExpenses = expenses
                    ?.filter(e => ['Administrativo', 'Contabilidade', 'Jurídico'].includes(e.category))
                    .reduce((sum, e) => sum + e.amount, 0) || 0;

                const marketingExpenses = expenses
                    ?.filter(e => e.category === 'Marketing')
                    .reduce((sum, e) => sum + e.amount, 0) || 0;

                const variableExpenses = expenses
                    ?.filter(e => !['Aluguel', 'Energia', 'Água', 'Internet', 'Materiais', 'Insumos', 'Salários', 'Comissões', 'Laboratório', 'Administrativo', 'Contabilidade', 'Jurídico', 'Marketing'].includes(e.category))
                    .reduce((sum, e) => sum + e.amount, 0) || 0;

                const totalOperationalExpenses = fixedExpenses + administrativeExpenses + marketingExpenses + variableExpenses;

                // Calcular lucro operacional
                const operationalProfit = grossProfit - totalOperationalExpenses;
                const operationalMargin = totalRevenue > 0 ? (operationalProfit / totalRevenue) * 100 : 0;

                // Lucro líquido (simplificado, sem impostos)
                const netProfit = operationalProfit;
                const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

                setDreData({
                    totalRevenue,
                    serviceRevenue: totalRevenue, // Simplificado
                    productRevenue: 0,
                    totalDirectCosts,
                    materialCosts,
                    professionalCosts,
                    labCosts,
                    grossProfit,
                    grossMargin,
                    totalOperationalExpenses,
                    fixedExpenses,
                    variableExpenses,
                    administrativeExpenses,
                    marketingExpenses,
                    operationalProfit,
                    operationalMargin,
                    netProfit,
                    netMargin
                });

            } catch (error: any) {
                console.error('Erro ao buscar DRE:', error);
                toast.error('Erro ao carregar DRE');
            } finally {
                setLoading(false);
            }
        };

        fetchDREData();
    }, [profile?.clinic_id, period]);

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        ))}
                    </div>
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
                        DRE Operacional
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Demonstração do Resultado do Exercício
                    </p>
                </div>

                {/* Filtro de Período */}
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <Calendar size={18} />
                        <span className="text-sm">Este mês</span>
                    </button>
                </div>
            </div>

            {/* DRE Structure */}
            <div className="space-y-4">
                {/* 1. RECEITAS */}
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <ArrowUpCircle className="text-emerald-600 dark:text-emerald-400" size={24} />
                            <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                                1. RECEITAS
                            </h3>
                        </div>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            R$ {dreData.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-emerald-700 dark:text-emerald-300">Serviços</span>
                            <p className="font-bold text-emerald-900 dark:text-emerald-100">
                                R$ {dreData.serviceRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div>
                            <span className="text-emerald-700 dark:text-emerald-300">Produtos</span>
                            <p className="font-bold text-emerald-900 dark:text-emerald-100">
                                R$ {dreData.productRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. CUSTOS DIRETOS */}
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <ArrowDownCircle className="text-red-600 dark:text-red-400" size={24} />
                            <h3 className="text-lg font-bold text-red-900 dark:text-red-100">
                                2. (-) CUSTOS DIRETOS
                            </h3>
                        </div>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                            R$ {dreData.totalDirectCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <span className="text-red-700 dark:text-red-300">Materiais</span>
                            <p className="font-bold text-red-900 dark:text-red-100">
                                R$ {dreData.materialCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div>
                            <span className="text-red-700 dark:text-red-300">Profissionais</span>
                            <p className="font-bold text-red-900 dark:text-red-100">
                                R$ {dreData.professionalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div>
                            <span className="text-red-700 dark:text-red-300">Laboratório</span>
                            <p className="font-bold text-red-900 dark:text-red-100">
                                R$ {dreData.labCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3. LUCRO BRUTO */}
                <div className={`${dreData.grossProfit >= 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'} border rounded-xl p-6`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <DollarSign className={dreData.grossProfit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'} size={24} />
                            <h3 className={`text-lg font-bold ${dreData.grossProfit >= 0 ? 'text-blue-900 dark:text-blue-100' : 'text-red-900 dark:text-red-100'}`}>
                                3. (=) LUCRO BRUTO
                            </h3>
                        </div>
                        <div className="text-right">
                            <p className={`text-2xl font-bold ${dreData.grossProfit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                                R$ {dreData.grossProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className={`text-sm ${dreData.grossProfit >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'}`}>
                                Margem: {dreData.grossMargin.toFixed(1)}%
                            </p>
                        </div>
                    </div>
                </div>

                {/* 4. DESPESAS OPERACIONAIS */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <TrendingDown className="text-amber-600 dark:text-amber-400" size={24} />
                            <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">
                                4. (-) DESPESAS OPERACIONAIS
                            </h3>
                        </div>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                            R$ {dreData.totalOperationalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-amber-700 dark:text-amber-300">Fixas</span>
                            <p className="font-bold text-amber-900 dark:text-amber-100">
                                R$ {dreData.fixedExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div>
                            <span className="text-amber-700 dark:text-amber-300">Variáveis</span>
                            <p className="font-bold text-amber-900 dark:text-amber-100">
                                R$ {dreData.variableExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div>
                            <span className="text-amber-700 dark:text-amber-300">Administrativas</span>
                            <p className="font-bold text-amber-900 dark:text-amber-100">
                                R$ {dreData.administrativeExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div>
                            <span className="text-amber-700 dark:text-amber-300">Marketing</span>
                            <p className="font-bold text-amber-900 dark:text-amber-100">
                                R$ {dreData.marketingExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 5. LUCRO LÍQUIDO */}
                <div className={`${dreData.netProfit >= 0 ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'} border rounded-xl p-6`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Percent className={dreData.netProfit >= 0 ? 'text-violet-600 dark:text-violet-400' : 'text-red-600 dark:text-red-400'} size={24} />
                            <h3 className={`text-lg font-bold ${dreData.netProfit >= 0 ? 'text-violet-900 dark:text-violet-100' : 'text-red-900 dark:text-red-100'}`}>
                                5. (=) LUCRO LÍQUIDO
                            </h3>
                        </div>
                        <div className="text-right">
                            <p className={`text-3xl font-black ${dreData.netProfit >= 0 ? 'text-violet-600 dark:text-violet-400' : 'text-red-600 dark:text-red-400'}`}>
                                R$ {dreData.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className={`text-sm ${dreData.netProfit >= 0 ? 'text-violet-700 dark:text-violet-300' : 'text-red-700 dark:text-red-300'}`}>
                                Margem Líquida: {dreData.netMargin.toFixed(1)}%
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Insights */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <TrendingUp className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            📊 Análise de Performance
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            {dreData.netMargin >= 20
                                ? '✅ Excelente! Margem líquida acima de 20%.'
                                : dreData.netMargin >= 10
                                    ? '⚠️ Margem saudável, mas há espaço para otimização.'
                                    : '🔴 Margem abaixo do ideal. Revise custos e despesas.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DREView;
