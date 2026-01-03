import React, { useMemo } from 'react';
import { TrendingUp, AlertTriangle, MessageCircle, DollarSign, PieChart, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { cn } from '../../src/lib/utils';
import { formatCurrency } from '../../utils/format';

interface SalesBOSAssistanceProps {
    totalValue: number;
    totalCost: number;
    itemsCount: number;
    onApplyScript: (scriptType: string) => void;
}

export function SalesBOSAssistance({ totalValue, totalCost, itemsCount, onApplyScript }: SalesBOSAssistanceProps) {

    // 1. Inteligência de Margem (O Semáforo do BOS)
    const margin = totalValue > 0 ? ((totalValue - totalCost) / totalValue) * 100 : 0;
    const profit = totalValue - totalCost;

    const marginStatus = useMemo(() => {
        if (totalValue === 0) return { color: 'text-slate-400', bg: 'bg-slate-100', label: 'Aguardando Dados', icon: PieChart };
        if (margin > 35) return { color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Margem BOS: Excelente', icon: CheckCircle2 };
        if (margin > 15) return { color: 'text-amber-600', bg: 'bg-amber-100', label: 'Margem BOS: Atenção', icon: AlertTriangle };
        return { color: 'text-red-600', bg: 'bg-red-100', label: 'Margem BOS: Crítica', icon: TrendingUp };
    }, [margin, totalValue]);

    return (
        <div className="h-full flex flex-col bg-slate-50 border-l border-slate-200 font-sans">

            {/* Header do BOS */}
            <div className="p-5 border-b bg-white flex items-center justify-between">
                <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <Zap size={14} className="text-amber-500 fill-amber-500" />
                        Sales BOS
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium ml-6">Assistance Module</p>
                </div>
                <div className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500">
                    AI Active
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* KPI: Lucratividade BOS */}
                <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-5">
                        <ShieldCheck size={60} />
                    </div>

                    <div className="flex items-center justify-between relative z-10">
                        <span className="text-xs font-bold text-slate-400 uppercase">Faturamento</span>
                        <span className="font-bold text-slate-800">{formatCurrency(totalValue)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400 relative z-10">
                        <span>Custos Operacionais</span>
                        <span>- {formatCurrency(totalCost)}</span>
                    </div>

                    <div className="h-px bg-slate-100 my-2"></div>

                    <div className={cn("p-3 rounded-lg flex items-center gap-3 transition-colors relative z-10", marginStatus.bg)}>
                        <marginStatus.icon className={cn("w-5 h-5", marginStatus.color)} />
                        <div>
                            <p className={cn("text-[10px] font-black uppercase tracking-wide", marginStatus.color)}>{marginStatus.label}</p>
                            <p className={cn("text-lg font-black leading-none mt-0.5", marginStatus.color)}>
                                {formatCurrency(profit)} <span className="text-xs opacity-70">({margin.toFixed(1)}%)</span>
                            </p>
                        </div>
                    </div>

                    {margin < 15 && totalValue > 0 && (
                        <div className="flex gap-2 items-start mt-2 p-2 bg-red-50 rounded text-xs text-red-600 font-medium">
                            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                            <p>O BOS detectou risco financeiro. Evite descontos.</p>
                        </div>
                    )}
                </div>

                {/* Scripts de Negociação Inteligente */}
                <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider pl-1">Estratégias de Resposta</h4>

                    <div className="grid grid-cols-1 gap-2">
                        <button
                            onClick={() => onApplyScript('expensive')}
                            className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all text-left group"
                        >
                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <DollarSign size={16} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-700">Objeção de Preço</p>
                                <p className="text-[10px] text-slate-400">"Achei caro..."</p>
                            </div>
                        </button>

                        <button
                            onClick={() => onApplyScript('think')}
                            className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-purple-400 hover:shadow-md transition-all text-left group"
                        >
                            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                <MessageCircle size={16} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-700">Objeção de Tempo</p>
                                <p className="text-[10px] text-slate-400">"Vou pensar / Falar com marido..."</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Simulador de Parcela - Argumento Final */}
                <div className="bg-slate-900 text-white p-5 rounded-xl shadow-xl relative overflow-hidden group cursor-default">
                    <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>

                    <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-4 flex justify-between">
                        <span>Simulação 12x</span>
                        <span className="text-emerald-400">Sem Juros</span>
                    </h4>

                    <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-3xl font-bold tracking-tight">{formatCurrency(totalValue / 12)}</span>
                        <span className="text-sm text-slate-400 font-medium">/mês</span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-800">
                        <p className="text-[11px] text-slate-300 italic text-center">
                            "Isso custa menos que um jantar por mês."
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
