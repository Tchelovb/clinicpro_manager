import React from 'react';
import { DollarSign, TrendingUp, AlertCircle, Calculator } from 'lucide-react';

interface BudgetProfitSummaryProps {
    totalPrice: number;
    totalCosts: number;
    totalProfit: number;
    marginPercent: number;
    itemCount: number;
    lowMarginCount: number;
}

/**
 * Resumo de Lucratividade do Orçamento
 * Exibe no rodapé: Total Venda vs Total Custos vs Lucro Líquido
 */
export const BudgetProfitSummary: React.FC<BudgetProfitSummaryProps> = ({
    totalPrice,
    totalCosts,
    totalProfit,
    marginPercent,
    itemCount,
    lowMarginCount
}) => {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    // Determinar cor da margem
    const getMarginColor = () => {
        if (marginPercent >= 30) return 'text-green-600';
        if (marginPercent >= 15) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getMarginBg = () => {
        if (marginPercent >= 30) return 'bg-green-50';
        if (marginPercent >= 15) return 'bg-yellow-50';
        return 'bg-red-50';
    };

    return (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 border border-gray-200 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-blue-600" />
                    Análise de Lucratividade
                </h3>
                {lowMarginCount > 0 && (
                    <div className="flex items-center gap-1 text-sm text-yellow-700 bg-yellow-50 px-3 py-1 rounded-full">
                        <AlertCircle className="w-4 h-4" />
                        <span>{lowMarginCount} {lowMarginCount === 1 ? 'item' : 'itens'} com margem baixa</span>
                    </div>
                )}
            </div>

            {/* Grid de métricas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Total de Venda */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <DollarSign className="w-4 h-4" />
                        <span>Total de Venda</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(totalPrice)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {itemCount} {itemCount === 1 ? 'item' : 'itens'}
                    </div>
                </div>

                {/* Total de Custos */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>Total de Custos</span>
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(totalCosts)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        Tempo + Material + Lab + Comissão
                    </div>
                </div>

                {/* Lucro Líquido */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>Lucro Líquido</span>
                    </div>
                    <div className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(totalProfit)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        Venda - Custos
                    </div>
                </div>

                {/* Margem % */}
                <div className={`${getMarginBg()} rounded-lg p-4 border-2 ${marginPercent >= 30 ? 'border-green-300' : marginPercent >= 15 ? 'border-yellow-300' : 'border-red-300'}`}>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>Margem de Lucro</span>
                    </div>
                    <div className={`text-3xl font-bold ${getMarginColor()}`}>
                        {marginPercent.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                        {marginPercent >= 30 ? '✅ Excelente' : marginPercent >= 15 ? '⚠️ Atenção' : '🚨 Crítico'}
                    </div>
                </div>
            </div>

            {/* Breakdown de custos */}
            <div className="mt-4 pt-4 border-t border-gray-200">
                <details className="text-sm">
                    <summary className="cursor-pointer text-gray-600 hover:text-gray-900 font-medium">
                        Ver detalhamento de custos
                    </summary>
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-6 gap-3 text-xs">
                        <div className="bg-white p-2 rounded border border-gray-200">
                            <div className="text-gray-600">Custo Operacional</div>
                            <div className="font-semibold text-gray-900">Tempo × Custo/min</div>
                        </div>
                        <div className="bg-white p-2 rounded border border-gray-200">
                            <div className="text-gray-600">Materiais</div>
                            <div className="font-semibold text-gray-900">Kits e Insumos</div>
                        </div>
                        <div className="bg-white p-2 rounded border border-gray-200">
                            <div className="text-gray-600">Laboratório</div>
                            <div className="font-semibold text-gray-900">Próteses/Aparelhos</div>
                        </div>
                        <div className="bg-white p-2 rounded border border-gray-200">
                            <div className="text-gray-600">Comissão Profissional</div>
                            <div className="font-semibold text-gray-900">Dentista</div>
                        </div>
                        <div className="bg-white p-2 rounded border border-blue-200 bg-blue-50">
                            <div className="text-blue-700">Comissão de Venda</div>
                            <div className="font-semibold text-blue-900">CRC/Consultor</div>
                        </div>
                        <div className="bg-white p-2 rounded border border-gray-200">
                            <div className="text-gray-600">Taxas</div>
                            <div className="font-semibold text-gray-900">Impostos + Cartão</div>
                        </div>
                    </div>
                </details>
            </div>
        </div>
    );
};

export default BudgetProfitSummary;
