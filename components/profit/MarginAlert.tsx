import React from 'react';
import { AlertTriangle, TrendingDown, Lightbulb } from 'lucide-react';

interface MarginAlertProps {
    status: 'warning' | 'danger';
    marginPercent: number;
    procedureName?: string;
    suggestedPrice?: number;
    currentPrice?: number;
}

/**
 * Alerta visual para margens baixas
 * Aparece apenas quando margem < 30%
 */
export const MarginAlert: React.FC<MarginAlertProps> = ({
    status,
    marginPercent,
    procedureName,
    suggestedPrice,
    currentPrice
}) => {
    const isDanger = status === 'danger';

    const config = isDanger
        ? {
            bg: 'bg-red-50',
            border: 'border-red-200',
            icon: TrendingDown,
            iconColor: 'text-red-600',
            title: 'Margem Crítica - Risco de Prejuízo',
            titleColor: 'text-red-800',
            message: 'Este item está com margem muito baixa. Considere revisar o preço ou os custos.',
            messageColor: 'text-red-700'
        }
        : {
            bg: 'bg-yellow-50',
            border: 'border-yellow-200',
            icon: AlertTriangle,
            iconColor: 'text-yellow-600',
            title: 'Margem de Atenção',
            titleColor: 'text-yellow-800',
            message: 'Este item está com margem abaixo do ideal. Recomendamos revisar.',
            messageColor: 'text-yellow-700'
        };

    const Icon = config.icon;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <div className={`${config.bg} ${config.border} border rounded-lg p-4 space-y-3`}>
            {/* Header */}
            <div className="flex items-start gap-3">
                <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
                <div className="flex-1">
                    <h4 className={`font-semibold ${config.titleColor} text-sm`}>
                        {config.title}
                    </h4>
                    {procedureName && (
                        <p className="text-xs text-gray-600 mt-1">
                            Procedimento: <span className="font-medium">{procedureName}</span>
                        </p>
                    )}
                </div>
                <div className={`text-right ${config.iconColor}`}>
                    <div className="text-2xl font-bold">{marginPercent.toFixed(1)}%</div>
                    <div className="text-xs">margem</div>
                </div>
            </div>

            {/* Mensagem */}
            <p className={`text-sm ${config.messageColor}`}>
                {config.message}
            </p>

            {/* Sugestão de preço */}
            {suggestedPrice && currentPrice && suggestedPrice > currentPrice && (
                <div className="flex items-start gap-2 bg-white bg-opacity-50 rounded p-3 border border-gray-200">
                    <Lightbulb className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 text-sm">
                        <p className="font-medium text-gray-900">Sugestão de Preço</p>
                        <p className="text-gray-600 mt-1">
                            Para atingir 30% de margem, considere ajustar o preço para{' '}
                            <span className="font-semibold text-blue-700">{formatCurrency(suggestedPrice)}</span>
                            {' '}(aumento de {formatCurrency(suggestedPrice - currentPrice)})
                        </p>
                    </div>
                </div>
            )}

            {/* Ações recomendadas */}
            <div className="text-xs text-gray-600 space-y-1 pt-2 border-t border-gray-200">
                <p className="font-medium text-gray-700">Ações recomendadas:</p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                    <li>Revisar custos de materiais e laboratório</li>
                    <li>Verificar comissão do profissional</li>
                    <li>Considerar ajuste de preço</li>
                    {isDanger && <li className="font-medium text-red-700">Avaliar viabilidade do procedimento</li>}
                </ul>
            </div>
        </div>
    );
};

export default MarginAlert;
