import React from 'react';
import { Lock, CheckCircle, Circle, AlertCircle } from 'lucide-react';

interface BudgetItem {
    id: string;
    procedure_name: string;
    region?: string;
    final_value: number; // Valor já com desconto
    is_sold: boolean;
}

interface CheckoutItemsListProps {
    items: BudgetItem[];
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
}

export const CheckoutItemsList: React.FC<CheckoutItemsListProps> = ({
    items,
    selectedIds,
    onSelectionChange
}) => {

    // Separa o joio do trigo
    const availableItems = items.filter(i => !i.is_sold);
    const soldItems = items.filter(i => i.is_sold);

    const handleToggle = (id: string) => {
        if (selectedIds.includes(id)) {
            onSelectionChange(selectedIds.filter(itemId => itemId !== id));
        } else {
            onSelectionChange([...selectedIds, id]);
        }
    };

    const formatMoney = (val: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="space-y-6">

            {/* SEÇÃO ATIVA: O QUE VAMOS COBRAR? */}
            <div className="bg-white rounded-xl border border-blue-200 overflow-hidden shadow-sm">
                <div className="bg-blue-50/50 p-4 border-b border-blue-100 flex justify-between items-center">
                    <div>
                        <h4 className="font-bold text-blue-900 text-sm uppercase tracking-wide">Itens Disponíveis</h4>
                        <p className="text-xs text-blue-600">Selecione os procedimentos a realizar hoje</p>
                    </div>
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                        {availableItems.length} itens
                    </span>
                </div>

                <div className="divide-y divide-slate-100">
                    {availableItems.length === 0 && (
                        <div className="p-6 text-center text-slate-400 text-sm">
                            Todos os itens deste orçamento já foram quitados.
                        </div>
                    )}

                    {availableItems.map(item => {
                        const isSelected = selectedIds.includes(item.id);
                        return (
                            <div
                                key={item.id}
                                onClick={() => handleToggle(item.id)}
                                className={`p-4 flex items-center cursor-pointer transition-colors
                  ${isSelected ? 'bg-blue-50/30' : 'hover:bg-slate-50'}
                `}
                            >
                                <div className={`
                   w-5 h-5 rounded border flex items-center justify-center mr-4 transition-all
                   ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}
                `}>
                                    {isSelected && <CheckCircle size={14} className="text-white" />}
                                </div>

                                <div className="flex-1">
                                    <p className={`font-bold text-sm ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
                                        {item.procedure_name}
                                    </p>
                                    {item.region && <p className="text-xs text-slate-500">{item.region}</p>}
                                </div>

                                <span className={`font-bold text-sm ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>
                                    {formatMoney(item.final_value)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* SEÇÃO PASSIVA: O QUE JÁ FOI PAGO (Histórico Bloqueado) */}
            {soldItems.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden opacity-80">
                    <div className="bg-slate-100 p-3 border-b border-slate-200 flex items-center gap-2">
                        <Lock size={14} className="text-slate-400" />
                        <span className="font-bold text-slate-500 text-xs uppercase">Histórico de Pagamentos</span>
                    </div>
                    <div className="divide-y divide-slate-200">
                        {soldItems.map(item => (
                            <div key={item.id} className="p-3 flex justify-between items-center px-4">
                                <div className="flex items-center gap-2">
                                    <CheckCircle size={14} className="text-green-500" />
                                    <span className="text-sm text-slate-500 line-through decoration-slate-300">
                                        {item.procedure_name}
                                    </span>
                                </div>
                                <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                    PAGO
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
