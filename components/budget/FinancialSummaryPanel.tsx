import React from 'react';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    CheckCircle,
    Clock,
    Zap,
    Calendar
} from 'lucide-react';

interface FinancialSummaryProps {
    totalValue: number;
    downPayment: number;
    installments: number;
    installmentValue: number;
    totalFees: number;
    netReceive: number;
    cashIn24h: number;
    anticipationCost: number;
    daysToReceive: number;
    recommendation: string;
    estimatedProfit: number;
    estimatedMarginPercent: number;
    isAnticipationViable: boolean;
    paymentMethod: string;
}

export const FinancialSummaryPanel: React.FC<FinancialSummaryProps> = ({
    totalValue,
    downPayment,
    installments,
    installmentValue,
    totalFees,
    netReceive,
    cashIn24h,
    anticipationCost,
    daysToReceive,
    recommendation,
    estimatedProfit,
    estimatedMarginPercent,
    isAnticipationViable,
    paymentMethod
}) => {
    const formatCurrency = (value: number) => {
        if (value === undefined || value === null || isNaN(value)) {
            return 'R$ 0,00';
        }
        return value.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    };

    const getMarginColor = (percent: number) => {
        if (percent >= 30) return 'text-emerald-400';
        if (percent >= 20) return 'text-green-400';
        if (percent >= 10) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getMarginStatus = (percent: number) => {
        if (percent >= 30) return 'EXCELENTE';
        if (percent >= 20) return 'BOM';
        if (percent >= 10) return 'ACEITÁVEL';
        return 'CRÍTICO';
    };

    // Lógica para mostrar custos extras (Boleto) ou Descontos (Cartão)
    const isCostAdded = paymentMethod === 'Boleto' && installments > 1;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                <div className="p-2 bg-blue-600/20 rounded-lg">
                    <DollarSign className="text-blue-400" size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Análise Financeira</h3>
                    <p className="text-xs text-slate-400">Cálculo em tempo real</p>
                </div>
            </div>

            {/* Valor Total */}
            <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                    <span className="text-sm text-slate-400">Valor Total</span>
                    <span className="text-2xl font-black text-white">{formatCurrency(totalValue)}</span>
                </div>

                {downPayment > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Entrada</span>
                        <span className="text-emerald-400 font-bold">{formatCurrency(downPayment)}</span>
                    </div>
                )}
            </div>

            {/* Parcelamento */}
            {installments > 1 && (
                <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">Parcelamento</span>
                        <span className="text-lg font-bold text-white">
                            {installments}x de {formatCurrency(installmentValue)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock size={14} />
                        <span>{daysToReceive} dias para receber tudo</span>
                    </div>
                </div>
            )}

            {/* Taxas ou Acréscimos */}
            <div className="space-y-3">
                <div className="flex justify-between text-sm">
                    {isCostAdded ? (
                        <>
                            <span className="text-slate-400">Acréscimo Boleto (30%)</span>
                            <span className="text-emerald-400 font-bold">+ {formatCurrency(totalFees)}</span>
                        </>
                    ) : (
                        <>
                            <span className="text-slate-400">Taxa de Cartão ({installments}x)</span>
                            <span className="text-red-400 font-bold">- {formatCurrency(totalFees)}</span>
                        </>
                    )}
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="text-blue-400" size={16} />
                        <span className="text-xs font-bold text-slate-300 uppercase">Recebimento Normal</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <span className="text-sm text-slate-400">Você recebe ao longo do tempo</span>
                        <span className="text-xl font-black text-emerald-400">{formatCurrency(netReceive)}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        {installments === 1 ? 'Cai em 1 dia útil' : `Parcelas caem mensalmente durante ${installments} meses`}
                    </p>
                </div>
            </div>

            {/* Antecipação (só mostra se tiver parcelas > 1 E for Cartão) */}
            {installments > 1 && paymentMethod === 'Cartão' && (
                <div className={`rounded-lg p-4 border ${isAnticipationViable
                    ? 'bg-blue-900/20 border-blue-700/50'
                    : 'bg-amber-900/20 border-amber-700/50'
                    }`}>
                    <div className="flex items-start gap-3 mb-3">
                        <Zap className={isAnticipationViable ? 'text-blue-400' : 'text-amber-400'} size={20} />
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-white mb-1">💰 Opção: Antecipar Recebíveis</h4>
                            <p className="text-xs text-slate-400">Receba TUDO em 24 horas</p>
                        </div>
                    </div>

                    <div className="space-y-2 mb-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">💵 Caixa em 24h</span>
                            <span className="text-white font-bold">{formatCurrency(cashIn24h)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">💸 Custo da antecipação</span>
                            <span className="text-red-400 font-bold">- {formatCurrency(anticipationCost)}</span>
                        </div>
                        <div className="flex justify-between text-sm pt-2 border-t border-slate-700">
                            <span className="text-slate-400">📊 Diferença</span>
                            <span className="text-amber-400 font-bold">
                                - {formatCurrency(netReceive - cashIn24h)}
                            </span>
                        </div>
                    </div>

                    <div className={`pt-3 border-t ${isAnticipationViable ? 'border-blue-700/30' : 'border-amber-700/30'
                        }`}>
                        <div className="flex items-start gap-2">
                            {isAnticipationViable ? (
                                <CheckCircle className="text-blue-400 flex-shrink-0" size={16} />
                            ) : (
                                <AlertCircle className="text-amber-400 flex-shrink-0" size={16} />
                            )}
                            <p className="text-xs text-slate-300 leading-relaxed">{recommendation}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Margem de Lucro */}
            <div className={`rounded-lg p-4 border ${estimatedMarginPercent >= 20
                ? 'bg-emerald-900/20 border-emerald-700/50'
                : 'bg-red-900/20 border-red-700/50'
                }`}>
                <div className="flex items-start gap-3 mb-3">
                    {estimatedMarginPercent >= 20 ? (
                        <TrendingUp className="text-emerald-400" size={20} />
                    ) : (
                        <TrendingDown className="text-red-400" size={20} />
                    )}
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-white mb-1">Margem Estimada</h4>
                        <p className="text-xs text-slate-400">Após custos e taxas</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                        <span className="text-sm text-slate-400">Lucro Líquido</span>
                        <span className={`text-lg font-black ${getMarginColor(estimatedMarginPercent)}`}>
                            {formatCurrency(estimatedProfit)}
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">Margem</span>
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${getMarginColor(estimatedMarginPercent)}`}>
                                {estimatedMarginPercent.toFixed(1)}%
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${estimatedMarginPercent >= 30 ? 'bg-emerald-900/50 text-emerald-300' :
                                estimatedMarginPercent >= 20 ? 'bg-green-900/50 text-green-300' :
                                    estimatedMarginPercent >= 10 ? 'bg-yellow-900/50 text-yellow-300' :
                                        'bg-red-900/50 text-red-300'
                                }`}>
                                {getMarginStatus(estimatedMarginPercent)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Barra de progresso */}
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                    <div className="w-full bg-slate-800 rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all ${estimatedMarginPercent >= 30 ? 'bg-emerald-500' :
                                estimatedMarginPercent >= 20 ? 'bg-green-500' :
                                    estimatedMarginPercent >= 10 ? 'bg-yellow-500' :
                                        'bg-red-500'
                                }`}
                            style={{ width: `${Math.min(100, Math.max(0, estimatedMarginPercent))}%` }}
                        />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        {estimatedMarginPercent >= 20
                            ? '✓ Margem saudável para o negócio'
                            : '⚠️ Margem abaixo do recomendado (mín. 20%)'}
                    </p>
                </div>
            </div>
        </div>
    );
};
