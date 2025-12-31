import React, { useState } from 'react';
import { TrendingUp, DollarSign, AlertTriangle, Lightbulb, CreditCard, MessageSquare } from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import { cn } from '../../lib/utils';

interface Props {
    totalValue: number;
    totalCost: number;
    itemsCount: number;
    onApplyScript?: (scriptType: string) => void;
}

export function SalesCopilot({ totalValue, totalCost, itemsCount, onApplyScript }: Props) {
    const [installments, setInstallments] = useState(12);
    const [showBreakdown, setShowBreakdown] = useState(false);

    const profit = totalValue - totalCost;
    const margin = totalValue > 0 ? (profit / totalValue) * 100 : 0;

    // Determinar status da margem
    let marginStatus: 'excellent' | 'good' | 'warning' | 'danger';
    let marginColor: string;
    let marginIcon: React.ReactNode;

    if (margin >= 30) {
        marginStatus = 'excellent';
        marginColor = 'text-emerald-600 bg-emerald-50';
        marginIcon = <TrendingUp className="text-emerald-600" size={20} />;
    } else if (margin >= 20) {
        marginStatus = 'good';
        marginColor = 'text-green-600 bg-green-50';
        marginIcon = <TrendingUp className="text-green-600" size={20} />;
    } else if (margin >= 15) {
        marginStatus = 'warning';
        marginColor = 'text-amber-600 bg-amber-50';
        marginIcon = <AlertTriangle className="text-amber-600" size={20} />;
    } else {
        marginStatus = 'danger';
        marginColor = 'text-red-600 bg-red-50';
        marginIcon = <AlertTriangle className="text-red-600" size={20} />;
    }

    // Scripts de objeção
    const objectionScripts = [
        {
            id: 'expensive',
            icon: '💰',
            label: 'Tá Caro',
            title: 'Objeção: Preço Alto',
            script:
                'Entendo sua preocupação. Mas veja: esse investimento dura 15+ anos. Dividindo, é menos que um café por dia. E a autoestima? Não tem preço.',
        },
        {
            id: 'think',
            icon: '🤔',
            label: 'Vou Pensar',
            title: 'Objeção: Indecisão',
            script:
                'Claro! Quanto tempo você precisa? Posso reservar essa condição especial por 48h. Depois disso, os valores podem mudar.',
        },
        {
            id: 'installments',
            icon: '💳',
            label: 'Parcela?',
            title: 'Facilitação de Pagamento',
            script:
                'Sim! Temos parcelamento em até 12x no cartão, ou entrada + boletos. Qual funciona melhor para você?',
        },
    ];

    const [activeScript, setActiveScript] = useState<string | null>(null);

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="p-4 border-b bg-white">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Lightbulb size={14} className="text-amber-500" />
                    Sales Copilot
                </h3>
            </div>

            {/* Margin Monitor (KPI Dashboard) */}
            <div className="p-4 border-b bg-white">
                <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-slate-500 font-medium">Receita Total</span>
                        <span className="text-sm font-bold text-slate-700">{formatCurrency(totalValue)}</span>
                    </div>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-slate-500 font-medium">Custos Estimados</span>
                        <span className="text-sm font-bold text-slate-700">{formatCurrency(totalCost)}</span>
                    </div>
                    <div className="h-px bg-slate-200 my-2"></div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-600">Lucro Líquido</span>
                        <span className="text-lg font-black text-slate-900">{formatCurrency(profit)}</span>
                    </div>
                </div>

                {/* Margin Badge */}
                <div className={cn('rounded-xl p-3 flex items-center gap-3', marginColor)}>
                    {marginIcon}
                    <div className="flex-1">
                        <p className="text-xs font-bold opacity-70">Margem de Lucro</p>
                        <p className="text-2xl font-black">{margin.toFixed(1)}%</p>
                    </div>
                </div>

                {/* Breakdown Button */}
                <button
                    onClick={() => setShowBreakdown(!showBreakdown)}
                    className="w-full mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                    {showBreakdown ? 'Ocultar' : 'Ver'} Detalhamento
                </button>

                {showBreakdown && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs space-y-1">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Itens no Plano:</span>
                            <span className="font-bold">{itemsCount}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Ticket Médio/Item:</span>
                            <span className="font-bold">
                                {itemsCount > 0 ? formatCurrency(totalValue / itemsCount) : 'R$ 0,00'}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Objection Handler */}
            <div className="p-4 border-b bg-white">
                <h4 className="text-xs font-bold text-slate-600 mb-3 flex items-center gap-2">
                    <MessageSquare size={14} />
                    Gestão de Objeções
                </h4>
                <div className="grid grid-cols-3 gap-2 mb-3">
                    {objectionScripts.map((obj) => (
                        <button
                            key={obj.id}
                            onClick={() => setActiveScript(activeScript === obj.id ? null : obj.id)}
                            className={cn(
                                'flex flex-col items-center justify-center p-2 rounded-lg border transition-all text-xs font-bold',
                                activeScript === obj.id
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                    : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                            )}
                        >
                            <span className="text-lg mb-1">{obj.icon}</span>
                            <span className="text-[10px]">{obj.label}</span>
                        </button>
                    ))}
                </div>

                {/* Active Script Display */}
                {activeScript && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 animate-in slide-in-from-top-2">
                        <p className="text-xs font-bold text-blue-900 mb-1">
                            {objectionScripts.find((s) => s.id === activeScript)?.title}
                        </p>
                        <p className="text-xs text-blue-700 leading-relaxed">
                            {objectionScripts.find((s) => s.id === activeScript)?.script}
                        </p>
                    </div>
                )}
            </div>

            {/* Installment Simulator */}
            <div className="p-4 bg-white flex-1">
                <h4 className="text-xs font-bold text-slate-600 mb-3 flex items-center gap-2">
                    <CreditCard size={14} />
                    Simulador de Parcelas
                </h4>

                <div className="mb-3">
                    <label className="text-xs text-slate-500 block mb-1">Número de Parcelas</label>
                    <input
                        type="range"
                        min="1"
                        max="24"
                        value={installments}
                        onChange={(e) => setInstallments(Number(e.target.value))}
                        className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>1x</span>
                        <span className="font-bold text-slate-600">{installments}x</span>
                        <span>24x</span>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-slate-500 mb-1">Valor da Parcela</p>
                    <p className="text-2xl font-black text-slate-900">
                        {formatCurrency(totalValue / installments)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                        {installments}x sem juros no cartão
                    </p>
                </div>
            </div>
        </div>
    );
}
