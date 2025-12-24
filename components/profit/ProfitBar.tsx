import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface ProfitBarProps {
    price: number;
    profit: number;
    marginPercent: number;
    status: 'excellent' | 'good' | 'warning' | 'danger';
    showDetails?: boolean;
}

/**
 * Barra visual de margem de lucro estilo "Health Bar"
 * 🟢 Verde: >= 30%
 * 🟡 Amarelo: 15-29%
 * 🔴 Vermelho: < 15%
 */
export const ProfitBar: React.FC<ProfitBarProps> = ({
    price,
    profit,
    marginPercent,
    status,
    showDetails = true
}) => {
    // Cores baseadas no status
    const getColors = () => {
        switch (status) {
            case 'excellent':
                return {
                    bg: 'bg-green-100',
                    bar: 'bg-gradient-to-r from-green-500 to-green-600',
                    text: 'text-green-700',
                    icon: TrendingUp,
                    label: 'Excelente'
                };
            case 'good':
                return {
                    bg: 'bg-green-50',
                    bar: 'bg-gradient-to-r from-green-400 to-green-500',
                    text: 'text-green-600',
                    icon: TrendingUp,
                    label: 'Boa'
                };
            case 'warning':
                return {
                    bg: 'bg-yellow-50',
                    bar: 'bg-gradient-to-r from-yellow-400 to-yellow-500',
                    text: 'text-yellow-700',
                    icon: AlertTriangle,
                    label: 'Atenção'
                };
            case 'danger':
                return {
                    bg: 'bg-red-50',
                    bar: 'bg-gradient-to-r from-red-500 to-red-600',
                    text: 'text-red-700',
                    icon: TrendingDown,
                    label: 'Risco'
                };
        }
    };

    const colors = getColors();
    const Icon = colors.icon;

    // Limitar margem visual a 100%
    const visualMargin = Math.min(Math.max(marginPercent, 0), 100);

    // Formatar valores
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <div className="space-y-2">
            {/* Header com ícone e status */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${colors.text}`} />
                    <span className={`text-sm font-medium ${colors.text}`}>
                        Margem: {colors.label}
                    </span>
                </div>
                <span className={`text-sm font-bold ${colors.text}`}>
                    {marginPercent.toFixed(1)}%
                </span>
            </div>

            {/* Barra de progresso */}
            <div className={`w-full h-3 ${colors.bg} rounded-full overflow-hidden shadow-inner`}>
                <div
                    className={`h-full ${colors.bar} transition-all duration-500 ease-out shadow-sm`}
                    style={{ width: `${visualMargin}%` }}
                />
            </div>

            {/* Detalhes financeiros */}
            {showDetails && (
                <div className="flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center gap-4">
                        <span>
                            Venda: <span className="font-semibold text-gray-900">{formatCurrency(price)}</span>
                        </span>
                        <span>
                            Lucro: <span className={`font-semibold ${colors.text}`}>{formatCurrency(profit)}</span>
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfitBar;
