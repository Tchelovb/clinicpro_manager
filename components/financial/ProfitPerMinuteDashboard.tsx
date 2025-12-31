import React from 'react';
import { useProfitPerMinute } from '../../hooks/useFinancialData';
import { Clock, TrendingUp, Zap, DollarSign } from 'lucide-react';

/**
 * ProfitPerMinuteDashboard
 * 
 * Dashboard de Lucro por Minuto (High Ticket Analysis)
 * Mostra os procedimentos mais rentáveis por minuto de execução
 * 
 * Visual: Gradiente roxo/índigo (Nubank style)
 */
export const ProfitPerMinuteDashboard: React.FC = () => {
    const { data: procedures, loading } = useProfitPerMinute(6);

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl p-6 text-white animate-pulse">
                <div className="h-8 bg-white/20 rounded w-1/3 mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 h-24"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (!procedures || procedures.length === 0) {
        return (
            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">💎 Lucro por Minuto (High Ticket)</h3>
                    <Zap className="text-yellow-300" size={24} />
                </div>
                <p className="text-white/80 text-sm">
                    Configure os custos dos procedimentos para visualizar a análise de lucratividade.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl p-6 text-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg md:text-xl font-bold flex items-center gap-2">
                        💎 Lucro por Minuto
                        <span className="text-xs font-normal bg-white/20 px-2 py-1 rounded">High Ticket</span>
                    </h3>
                    <p className="text-white/80 text-sm mt-1">
                        Procedimentos mais rentáveis por tempo de execução
                    </p>
                </div>
                <Zap className="text-yellow-300 animate-pulse" size={32} />
            </div>

            {/* Grid de Procedimentos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {procedures.map((proc, index) => (
                    <div
                        key={proc.procedure_id}
                        className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-all hover:scale-105 cursor-pointer border border-white/10"
                    >
                        {/* Ranking Badge */}
                        <div className="flex items-start justify-between mb-3">
                            <div className={`
                w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                ${index === 0 ? 'bg-yellow-400 text-yellow-900' : ''}
                ${index === 1 ? 'bg-gray-300 text-gray-700' : ''}
                ${index === 2 ? 'bg-amber-600 text-white' : ''}
                ${index > 2 ? 'bg-white/20 text-white' : ''}
              `}>
                                {index + 1}º
                            </div>
                            {proc.is_high_ticket && (
                                <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold">
                                    HIGH
                                </span>
                            )}
                        </div>

                        {/* Nome do Procedimento */}
                        <h4 className="font-bold text-white mb-1 line-clamp-2 min-h-[2.5rem]">
                            {proc.procedure_name}
                        </h4>

                        {/* Lucro por Minuto (Destaque) */}
                        <div className="my-3">
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-white">
                                    R$ {proc.profit_per_minute.toFixed(2)}
                                </span>
                                <span className="text-sm text-white/70">/min</span>
                            </div>
                        </div>

                        {/* Métricas Secundárias */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            {/* Tempo */}
                            <div className="flex items-center gap-1 text-white/80">
                                <Clock size={12} />
                                <span>{proc.estimated_time_minutes}min</span>
                            </div>

                            {/* Margem */}
                            <div className="flex items-center gap-1 text-white/80">
                                <TrendingUp size={12} />
                                <span>{proc.margin_percent.toFixed(1)}%</span>
                            </div>

                            {/* Preço */}
                            <div className="flex items-center gap-1 text-white/80">
                                <DollarSign size={12} />
                                <span>R$ {proc.base_price.toLocaleString('pt-BR')}</span>
                            </div>

                            {/* Lucro Total */}
                            <div className="flex items-center gap-1 text-emerald-300 font-bold">
                                <span className="text-[10px]">💰</span>
                                <span>R$ {proc.net_profit.toFixed(0)}</span>
                            </div>
                        </div>

                        {/* Categoria */}
                        <div className="mt-3 pt-3 border-t border-white/10">
                            <span className="text-xs text-white/60 uppercase tracking-wide">
                                {proc.category}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer com Insights */}
            <div className="mt-6 pt-4 border-t border-white/20">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-white/80">
                        <div className="w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
                        <span>
                            Otimize sua agenda priorizando os procedimentos do topo
                        </span>
                    </div>
                    <button className="text-white/80 hover:text-white underline text-xs">
                        Ver todos →
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfitPerMinuteDashboard;
