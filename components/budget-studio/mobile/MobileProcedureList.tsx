import React, { useState, useMemo } from 'react';
import { Plus, Check } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import { cn } from '../../../lib/utils';
import { BudgetStudioItem } from '../../../hooks/useBudgetStudio';

interface MobileProcedureListProps {
    procedures: BudgetStudioItem[];
    itemsInCart: BudgetStudioItem[];
    onAdd: (procedure: BudgetStudioItem) => void;
}

export const MobileProcedureList: React.FC<MobileProcedureListProps> = ({ procedures, itemsInCart, onAdd }) => {
    const [activeCategory, setActiveCategory] = useState('Todos');

    // Extract unique categories, ensuring 'Todos' is first
    const categories = useMemo(() => {
        const cats = Array.from(new Set(procedures.map(p => p.category || 'Geral')));
        return ['Todos', ...cats.sort()];
    }, [procedures]);

    // Filter procedures
    const filteredProcedures = useMemo(() => {
        if (activeCategory === 'Todos') return procedures;
        return procedures.filter(p => (p.category || 'Geral') === activeCategory);
    }, [procedures, activeCategory]);

    // Check if item is already in cart (simple check by ID for visual feedback)
    const isItemInCart = (procId: string) => {
        // Logic might need adjustment depending on if we allow multiples of same ID.
        // Usually cart items have uniqueId, but refer to procId via `id` field.
        return itemsInCart.some(item => item.id === procId);
    };

    return (
        <div className="p-4 pb-32">
            {/* Filtros em Abas Táteis */}
            <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 scroll-smooth">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={cn(
                            "px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200",
                            activeCategory === cat
                                ? "bg-slate-900 text-white shadow-md transform scale-105"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Lista de Cards Estilo 'Showroom' */}
            <div className="space-y-6">
                {filteredProcedures.map(proc => {
                    const added = isItemInCart(proc.id);
                    return (
                        <div key={proc.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 group">
                            {/* Info e Ação */}
                            <div className="p-5 flex justify-between items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-black uppercase px-2 py-1 bg-slate-100 text-slate-500 rounded-full">
                                            {proc.category || 'Geral'}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-slate-800 text-base leading-tight mb-2">{proc.name}</h4>
                                    <p className="text-2xl font-black text-green-600">
                                        {formatCurrency(proc.base_price)}
                                    </p>
                                </div>
                                <button
                                    onClick={() => onAdd(proc)}
                                    disabled={added}
                                    className={cn(
                                        "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform shrink-0",
                                        added
                                            ? 'bg-green-500 text-white'
                                            : 'bg-slate-900 text-white'
                                    )}
                                >
                                    {added ? <Check size={24} /> : <Plus size={24} />}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
