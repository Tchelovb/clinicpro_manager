import React, { useState, useEffect } from 'react';
import { Sparkles, X, MessageCircle, Zap, TrendingUp, BrainCircuit } from 'lucide-react';

interface SalesBosFloatingProps {
    patientName: string;
    dealValue: number;
    installments: number;
    discountApplied: number;
}

export const SalesBosFloating: React.FC<SalesBosFloatingProps> = ({
    patientName,
    dealValue,
    installments,
    discountApplied
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [insight, setInsight] = useState<string>('');

    useEffect(() => {
        // Lógica de IA contextual
        if (dealValue > 10000 && installments > 10) {
            setInsight("Cuidado: Parcelamento longo em High Ticket. Tente aumentar a entrada para melhorar o fluxo de caixa.");
        } else if (discountApplied > 10) {
            setInsight("Alerta: Desconto alto. Use o argumento da 'Exclusividade da Técnica' para não baixar mais o preço.");
        } else {
            setInsight(`O orçamento está equilibrado. Foco em fechar agora com ${patientName}.`);
        }
    }, [dealValue, installments, discountApplied, patientName]);

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">

            {/* PAINEL DA IA (Expandido) */}
            {isOpen && (
                <div className="mb-4 w-80 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">

                    {/* Header do BOS */}
                    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-3 flex justify-between items-center">
                        <div className="flex items-center text-white font-bold text-sm">
                            <BrainCircuit size={16} className="mr-2" />
                            Sales BOS AI
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white">
                            <X size={16} />
                        </button>
                    </div>

                    {/* Conteúdo Tático */}
                    <div className="p-4 space-y-4">

                        {/* O Insight Principal */}
                        <div className="bg-white/5 rounded-lg p-3 border border-white/5">
                            <p className="text-indigo-200 text-xs font-bold mb-1 uppercase tracking-wider">Análise de Contexto</p>
                            <p className="text-slate-200 text-sm leading-relaxed">
                                {insight}
                            </p>
                        </div>

                        {/* Sugestões de Scripts */}
                        <div>
                            <p className="text-slate-400 text-xs mb-2 font-medium">Respostas Rápidas Sugeridas:</p>
                            <div className="flex flex-wrap gap-2">
                                <button className="flex items-center px-3 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-500/30 rounded-full text-xs text-indigo-300 transition-colors">
                                    <MessageCircle size={12} className="mr-1.5" />
                                    "Está caro..."
                                </button>
                                <button className="flex items-center px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/30 rounded-full text-xs text-emerald-300 transition-colors">
                                    <TrendingUp size={12} className="mr-1.5" />
                                    Upsell Botox
                                </button>
                                <button className="flex items-center px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/40 border border-orange-500/30 rounded-full text-xs text-orange-300 transition-colors">
                                    <Zap size={12} className="mr-1.5" />
                                    Fechamento Agora
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* Footer Interativo */}
                    <div className="bg-black/20 p-2 text-center border-t border-white/5">
                        <span className="text-[10px] text-slate-500">Pressione Espaço para ditar notas</span>
                    </div>
                </div>
            )}

            {/* O BOTÃO FLUTUANTE */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
            group relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:scale-110
            ${isOpen ? 'bg-slate-800 rotate-90 text-slate-400' : 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white'}
        `}
            >
                {/* Efeito de Pulso */}
                {!isOpen && (
                    <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-20 animate-ping"></span>
                )}

                {isOpen ? <X size={24} /> : <Sparkles size={24} className="animate-pulse" />}

                {/* Tooltip */}
                {!isOpen && (
                    <span className="absolute right-16 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        Pedir ajuda à IA
                    </span>
                )}
            </button>

        </div>
    );
};
