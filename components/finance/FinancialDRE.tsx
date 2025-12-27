import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Loader2,
    AlertCircle
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Transaction {
    id: string;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    amount: number;
    date: string;
}

interface DREData {
    receitaBruta: number;
    despesasVariaveis: number;
    margemContribuicao: number;
    despesasFixas: number;
    lucroLiquido: number;
    detalheDespesasVariaveis: { categoria: string; valor: number; percentual: number }[];
    detalheDespesasFixas: { categoria: string; valor: number; percentual: number }[];
}

const FinancialDRE: React.FC = () => {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [dreData, setDreData] = useState<DREData | null>(null);

    // Categorias variáveis (relacionadas ao volume de vendas)
    const categoriasVariaveis = ['Comissão', 'Laboratório', 'Material', 'Imposto', 'Comissões', 'Materiais', 'Impostos'];

    useEffect(() => {
        if (profile?.clinic_id) {
            loadDREData();
        }
    }, [profile?.clinic_id, selectedDate]);

    const loadDREData = async () => {
        if (!profile?.clinic_id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const startDate = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
            const endDate = format(endOfMonth(selectedDate), 'yyyy-MM-dd');

            const { data: transactions, error } = await supabase
                .from('transactions')
                .select('id, type, category, amount, date')
                .eq('clinic_id', profile.clinic_id)
                .gte('date', startDate)
                .lte('date', endDate);

            if (error) throw error;

            // Cálculos DRE
            const receitas = transactions?.filter(t => t.type === 'INCOME') || [];
            const despesas = transactions?.filter(t => t.type === 'EXPENSE') || [];

            const receitaBruta = receitas.reduce((sum, t) => sum + t.amount, 0);

            // Separar despesas variáveis e fixas
            const despesasVar = despesas.filter(d =>
                categoriasVariaveis.some(cat => d.category?.toLowerCase().includes(cat.toLowerCase()))
            );
            const despesasFix = despesas.filter(d =>
                !categoriasVariaveis.some(cat => d.category?.toLowerCase().includes(cat.toLowerCase()))
            );

            const despesasVariaveis = despesasVar.reduce((sum, t) => sum + t.amount, 0);
            const despesasFixas = despesasFix.reduce((sum, t) => sum + t.amount, 0);

            const margemContribuicao = receitaBruta - despesasVariaveis;
            const lucroLiquido = margemContribuicao - despesasFixas;

            // Agrupar despesas por categoria
            const agruparPorCategoria = (despesas: Transaction[]) => {
                const grupos: { [key: string]: number } = {};
                despesas.forEach(d => {
                    const cat = d.category || 'Sem Categoria';
                    grupos[cat] = (grupos[cat] || 0) + d.amount;
                });
                return Object.entries(grupos).map(([categoria, valor]) => ({
                    categoria,
                    valor,
                    percentual: receitaBruta > 0 ? (valor / receitaBruta) * 100 : 0
                })).sort((a, b) => b.valor - a.valor);
            };

            setDreData({
                receitaBruta,
                despesasVariaveis,
                margemContribuicao,
                despesasFixas,
                lucroLiquido,
                detalheDespesasVariaveis: agruparPorCategoria(despesasVar),
                detalheDespesasFixas: agruparPorCategoria(despesasFix)
            });
        } catch (error) {
            console.error('Erro ao carregar DRE:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePreviousMonth = () => {
        setSelectedDate(prev => subMonths(prev, 1));
    };

    const handleNextMonth = () => {
        setSelectedDate(prev => addMonths(prev, 1));
    };

    const handleToday = () => {
        setSelectedDate(new Date());
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-violet-600 animate-spin mb-4" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">Calculando DRE...</p>
            </div>
        );
    }

    if (!dreData) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
                <p className="text-slate-500 dark:text-slate-400">Nenhum dado disponível para este período</p>
            </div>
        );
    }

    const isProfit = dreData.lucroLiquido >= 0;
    const margemLucro = dreData.receitaBruta > 0 ? (dreData.lucroLiquido / dreData.receitaBruta) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* Header com Seletor de Mês */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">DRE Gerencial</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Demonstrativo de Resultados do Exercício</p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePreviousMonth}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <ChevronLeft size={20} className="text-slate-600 dark:text-slate-400" />
                    </button>
                    <button
                        onClick={handleToday}
                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        Mês Atual
                    </button>
                    <button
                        onClick={handleNextMonth}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <ChevronRight size={20} className="text-slate-600 dark:text-slate-400" />
                    </button>
                    <div className="ml-2 flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <Calendar size={16} className="text-slate-600 dark:text-slate-400" />
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR })}
                        </span>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Receita Total */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Receita Bruta</p>
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <TrendingUp className="text-green-600 dark:text-green-400" size={20} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(dreData.receitaBruta)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">100% da receita</p>
                </div>

                {/* Despesas Totais */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Despesas Totais</p>
                        <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                            <TrendingDown className="text-rose-600 dark:text-rose-400" size={20} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                        {formatCurrency(dreData.despesasVariaveis + dreData.despesasFixas)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {dreData.receitaBruta > 0 ? ((dreData.despesasVariaveis + dreData.despesasFixas) / dreData.receitaBruta * 100).toFixed(1) : 0}% da receita
                    </p>
                </div>

                {/* Lucro Líquido */}
                <div className={`rounded-xl border shadow-sm p-6 ${isProfit
                    ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
                    : 'bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20 border-rose-200 dark:border-rose-800'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                        <p className={`text-xs font-bold uppercase ${isProfit ? 'text-green-700 dark:text-green-300' : 'text-rose-700 dark:text-rose-300'}`}>
                            {isProfit ? 'Lucro Líquido' : 'Prejuízo'}
                        </p>
                        <div className={`p-2 rounded-lg ${isProfit ? 'bg-green-100 dark:bg-green-900/40' : 'bg-rose-100 dark:bg-rose-900/40'}`}>
                            <DollarSign className={isProfit ? 'text-green-600 dark:text-green-400' : 'text-rose-600 dark:text-rose-400'} size={20} />
                        </div>
                    </div>
                    <p className={`text-3xl font-bold ${isProfit ? 'text-green-600 dark:text-green-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {formatCurrency(Math.abs(dreData.lucroLiquido))}
                    </p>
                    <p className={`text-xs mt-1 ${isProfit ? 'text-green-600 dark:text-green-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        Margem: {margemLucro.toFixed(1)}%
                    </p>
                </div>
            </div>

            {/* Tabela Cascata DRE */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Demonstrativo Detalhado</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Análise cascata de receitas e despesas</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Descrição</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">Valor</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">% Receita</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {/* Receita Bruta */}
                            <tr className="bg-green-50/50 dark:bg-green-900/10">
                                <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">(+) Receita Bruta</td>
                                <td className="px-6 py-4 text-right font-bold text-green-600 dark:text-green-400">
                                    {formatCurrency(dreData.receitaBruta)}
                                </td>
                                <td className="px-6 py-4 text-right text-sm text-slate-600 dark:text-slate-400">100,0%</td>
                            </tr>

                            {/* Despesas Variáveis */}
                            <tr>
                                <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">(-) Despesas Variáveis</td>
                                <td className="px-6 py-4 text-right font-semibold text-rose-600 dark:text-rose-400">
                                    {formatCurrency(dreData.despesasVariaveis)}
                                </td>
                                <td className="px-6 py-4 text-right text-sm text-slate-600 dark:text-slate-400">
                                    {dreData.receitaBruta > 0 ? ((dreData.despesasVariaveis / dreData.receitaBruta) * 100).toFixed(1) : 0}%
                                </td>
                            </tr>

                            {/* Detalhes Despesas Variáveis */}
                            {dreData.detalheDespesasVariaveis.map((item, idx) => (
                                <tr key={`var-${idx}`} className="bg-slate-50/50 dark:bg-slate-900/50">
                                    <td className="px-6 py-2 pl-12 text-sm text-slate-600 dark:text-slate-400">• {item.categoria}</td>
                                    <td className="px-6 py-2 text-right text-sm text-slate-600 dark:text-slate-400">
                                        {formatCurrency(item.valor)}
                                    </td>
                                    <td className="px-6 py-2 text-right text-sm text-slate-500 dark:text-slate-500">
                                        {item.percentual.toFixed(1)}%
                                    </td>
                                </tr>
                            ))}

                            {/* Margem de Contribuição */}
                            <tr className="bg-blue-50/50 dark:bg-blue-900/10 border-t-2 border-blue-200 dark:border-blue-800">
                                <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">(=) Margem de Contribuição</td>
                                <td className="px-6 py-4 text-right font-bold text-blue-600 dark:text-blue-400">
                                    {formatCurrency(dreData.margemContribuicao)}
                                </td>
                                <td className="px-6 py-4 text-right text-sm font-semibold text-slate-600 dark:text-slate-400">
                                    {dreData.receitaBruta > 0 ? ((dreData.margemContribuicao / dreData.receitaBruta) * 100).toFixed(1) : 0}%
                                </td>
                            </tr>

                            {/* Despesas Fixas */}
                            <tr>
                                <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">(-) Despesas Fixas</td>
                                <td className="px-6 py-4 text-right font-semibold text-rose-600 dark:text-rose-400">
                                    {formatCurrency(dreData.despesasFixas)}
                                </td>
                                <td className="px-6 py-4 text-right text-sm text-slate-600 dark:text-slate-400">
                                    {dreData.receitaBruta > 0 ? ((dreData.despesasFixas / dreData.receitaBruta) * 100).toFixed(1) : 0}%
                                </td>
                            </tr>

                            {/* Detalhes Despesas Fixas */}
                            {dreData.detalheDespesasFixas.map((item, idx) => (
                                <tr key={`fix-${idx}`} className="bg-slate-50/50 dark:bg-slate-900/50">
                                    <td className="px-6 py-2 pl-12 text-sm text-slate-600 dark:text-slate-400">• {item.categoria}</td>
                                    <td className="px-6 py-2 text-right text-sm text-slate-600 dark:text-slate-400">
                                        {formatCurrency(item.valor)}
                                    </td>
                                    <td className="px-6 py-2 text-right text-sm text-slate-500 dark:text-slate-500">
                                        {item.percentual.toFixed(1)}%
                                    </td>
                                </tr>
                            ))}

                            {/* Lucro Líquido */}
                            <tr className={`border-t-2 ${isProfit
                                ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                                : 'bg-rose-50 dark:bg-rose-900/10 border-rose-200 dark:border-rose-800'
                                }`}>
                                <td className={`px-6 py-4 font-bold ${isProfit ? 'text-green-900 dark:text-green-100' : 'text-rose-900 dark:text-rose-100'}`}>
                                    (=) {isProfit ? 'Lucro Líquido' : 'Prejuízo'}
                                </td>
                                <td className={`px-6 py-4 text-right font-bold text-xl ${isProfit ? 'text-green-600 dark:text-green-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {formatCurrency(dreData.lucroLiquido)}
                                </td>
                                <td className={`px-6 py-4 text-right font-bold ${isProfit ? 'text-green-600 dark:text-green-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {margemLucro.toFixed(1)}%
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-2">💡 Margem de Contribuição</h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        Representa quanto sobra após cobrir os custos variáveis. Ideal: acima de 60%.
                    </p>
                </div>

                <div className={`border rounded-lg p-4 ${isProfit
                    ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                    : 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800'
                    }`}>
                    <h4 className={`text-sm font-bold mb-2 ${isProfit ? 'text-green-900 dark:text-green-100' : 'text-amber-900 dark:text-amber-100'}`}>
                        {isProfit ? '✅ Resultado Positivo' : '⚠️ Atenção Necessária'}
                    </h4>
                    <p className={`text-sm ${isProfit ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'}`}>
                        {isProfit
                            ? `Parabéns! Sua clínica teve lucro de ${margemLucro.toFixed(1)}% sobre a receita.`
                            : 'Revise suas despesas fixas e busque aumentar a receita ou reduzir custos.'
                        }
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FinancialDRE;
