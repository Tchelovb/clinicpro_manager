import React, { useState, useEffect, useMemo } from 'react';
import { Check, Lock, Percent, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';

// Define Interface for Budget Items based on Supabase structure
interface BudgetItem {
    id: string;
    procedure_name: string;
    tooth_number?: number | null;
    face?: string | null;
    unit_value: number;
    total_value: number;
    quantity: number;
}

interface Budget {
    id: string;
    items: BudgetItem[];
}

interface SmartCartProps {
    budget: Budget | null;
    onCartUpdate: (selectedItems: BudgetItem[], discount: number, totalToPay: number) => void;
}

export const SmartCart: React.FC<SmartCartProps> = ({ budget, onCartUpdate }) => {
    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
    const [discount, setDiscount] = useState<number>(0);
    const [isDiscountAuthorized, setIsDiscountAuthorized] = useState(false);

    // Initialize selection when budget changes
    useEffect(() => {
        if (budget?.items) {
            const allIds = new Set(budget.items.map(i => i.id));
            setSelectedItemIds(allIds);
            setDiscount(0);
            setIsDiscountAuthorized(false);
        } else {
            setSelectedItemIds(new Set());
        }
    }, [budget]);

    // Calculate Totals
    const { subtotal, selectedItems, discountWarning } = useMemo(() => {
        if (!budget) return { subtotal: 0, selectedItems: [], discountWarning: false };

        const selected = budget.items.filter(item => selectedItemIds.has(item.id));
        const sub = selected.reduce((acc, item) => acc + (item.total_value || 0), 0);

        // Discount Validation (e.g. max 10% without auth)
        const maxAutoDiscount = sub * 0.10;
        const needsAuth = discount > maxAutoDiscount;

        return { subtotal: sub, selectedItems: selected, discountWarning: needsAuth };
    }, [budget, selectedItemIds, discount]);

    const finalTotal = Math.max(0, subtotal - discount);

    // Notify Parent
    useEffect(() => {
        onCartUpdate(selectedItems, discount, finalTotal);
    }, [selectedItems, discount, finalTotal, onCartUpdate]);

    const toggleItem = (id: string) => {
        const newSet = new Set(selectedItemIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedItemIds(newSet);
    };

    if (!budget) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Trash2 size={24} className="opacity-20" />
                </div>
                <p className="italic">Selecione um orçamento à esquerda para carregar os itens.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-2xl">
                <div>
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        Carrinho Inteligente
                    </h2>
                    <p className="text-sm text-slate-400">Marque os itens que serão pagos hoje.</p>
                </div>
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                    {selectedItems.length} itens selecionados
                </span>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-white">
                {budget.items.map((item) => {
                    const isSelected = selectedItemIds.has(item.id);
                    return (
                        <div
                            key={item.id}
                            className={cn(
                                "flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer select-none",
                                isSelected
                                    ? "bg-blue-50/30 border-blue-200 shadow-sm"
                                    : "bg-slate-50 border-slate-100 opacity-60"
                            )}
                            onClick={() => toggleItem(item.id)}
                        >
                            <div className={cn(
                                "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors",
                                isSelected ? "bg-blue-500 border-blue-500 text-white" : "border-slate-300 bg-white"
                            )}>
                                {isSelected && <Check size={14} strokeWidth={4} />}
                            </div>

                            <div className="flex-1">
                                <p className={cn("font-bold text-sm", isSelected ? "text-slate-800" : "text-slate-500")}>
                                    {item.procedure_name}
                                </p>
                                <p className="text-xs text-slate-400">
                                    {item.tooth_number ? `Dente ${item.tooth_number}` : 'Procedimento Geral'}
                                    {item.face && ` • Face ${item.face}`}
                                </p>
                            </div>

                            <div className="text-right">
                                <p className={cn("font-bold", isSelected ? "text-slate-700" : "text-slate-400")}>
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.total_value)}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer / Totals */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 rounded-b-2xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-10">
                <div className="space-y-3">
                    {/* Subtotal Row */}
                    <div className="flex justify-between items-center text-sm text-slate-500">
                        <span>Subtotal (Selecionados)</span>
                        <span className="font-medium">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}
                        </span>
                    </div>

                    {/* Discount Controls */}
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <p className="text-xs font-bold">R$</p>
                            </div>
                            <input
                                type="number"
                                value={discount > 0 ? discount : ''}
                                onChange={(e) => setDiscount(Number(e.target.value))}
                                placeholder="Desconto (Valor)"
                                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            />
                        </div>
                        {discountWarning && !isDiscountAuthorized && (
                            <button
                                onClick={() => {
                                    // In real app, open PIN modal logic here
                                    const pin = prompt("Digite a senha do gerente (1234):");
                                    if (pin === '1234') setIsDiscountAuthorized(true);
                                    else alert("Senha Incorreta");
                                }}
                                className="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-amber-200 transition-colors animate-pulse"
                            >
                                <Lock size={12} /> AUTORIZAR
                            </button>
                        )}
                        {isDiscountAuthorized && (
                            <span className="px-3 py-2 bg-green-100 text-green-700 rounded-lg text-xs font-bold flex items-center gap-1">
                                <Check size={12} /> AUTORIZADO
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex justify-between items-center pt-6 mt-4 border-t border-slate-200">
                    <span className="text-xl font-bold text-slate-800">Total a Pagar</span>
                    <span className="text-3xl font-black text-blue-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finalTotal)}
                    </span>
                </div>
            </div>
        </div>
    );
};
