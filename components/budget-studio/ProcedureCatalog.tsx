import React, { useState } from 'react';
import { Search, Star, Sparkles, Zap } from 'lucide-react';
import { BudgetStudioItem } from '../../hooks/useBudgetStudio';
import { formatCurrency } from '../../utils/format';
import { cn } from '../../src/lib/utils';

interface Props {
    procedures: BudgetStudioItem[];
    onAdd: (item: BudgetStudioItem) => void;
}

export function ProcedureCatalog({ procedures, onAdd }: Props) {
    const [term, setTerm] = useState('');
    const [filter, setFilter] = useState('TODOS');

    const filtered = procedures.filter((p) => {
        const matchText = p.name.toLowerCase().includes(term.toLowerCase());
        const matchCat = filter === 'TODOS' || p.category?.includes(filter);
        return matchText && matchCat;
    });

    const categories = [
        { id: 'TODOS', label: 'Todos', icon: null },
        { id: 'CLINICA_GERAL', label: 'Geral', icon: null },
        { id: 'HOF', label: 'HOF', icon: Sparkles },
        { id: 'ORTODONTIA', label: 'Orto', icon: null },
    ];

    return (
        <div className="flex flex-col h-full bg-slate-50 border-r border-slate-200">
            {/* Header */}
            <div className="p-4 border-b bg-white">
                <h3 className="text-xs font-bold text-slate-400 uppercase mb-3 tracking-wider">
                    Catálogo de Procedimentos
                </h3>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input
                        className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg bg-slate-50 focus:bg-white transition-all outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Buscar (ex: Botox, Lente)..."
                        value={term}
                        onChange={(e) => setTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 p-2 overflow-x-auto border-b bg-slate-50 scrollbar-hide">
                {categories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setFilter(cat.id)}
                            className={cn(
                                'px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all flex items-center gap-1',
                                filter === cat.id
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                            )}
                        >
                            {Icon && <Icon size={12} />}
                            {cat.label}
                        </button>
                    );
                })}
            </div>

            {/* Procedures List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-300">
                        <Search size={48} className="mb-2 opacity-20" />
                        <p className="text-sm">Nenhum procedimento encontrado</p>
                    </div>
                ) : (
                    filtered.map((proc) => (
                        <div
                            key={proc.id}
                            onClick={() => onAdd(proc)}
                            className="group p-3 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-blue-500 hover:shadow-md transition-all active:scale-95"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold text-slate-700 group-hover:text-blue-700 line-clamp-2 flex-1">
                                    {proc.name}
                                </span>
                                {proc.category === 'HOF' && (
                                    <Sparkles size={14} className="text-purple-500 shrink-0 ml-2" />
                                )}
                            </div>

                            <div className="flex justify-between items-end">
                                <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {proc.category?.replace('CLINICA_GERAL', 'Geral').replace('ORTODONTIA', 'Orto') || 'Geral'}
                                </span>
                                <span className="text-sm font-bold text-emerald-600">
                                    {formatCurrency(proc.base_price)}
                                </span>
                            </div>

                            {/* Tooltip com custo (apenas para médicos/admins) */}
                            {proc.estimated_cost > 0 && (
                                <div className="mt-2 pt-2 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-slate-400">Custo Est.:</span>
                                        <span className="text-slate-600 font-medium">
                                            {formatCurrency(proc.estimated_cost)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
