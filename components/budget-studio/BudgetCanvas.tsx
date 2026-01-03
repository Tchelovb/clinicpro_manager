import React from 'react';
import { X, Minus, Plus, Image as ImageIcon } from 'lucide-react';
import { BudgetStudioItem } from '../../hooks/useBudgetStudio';
import { formatCurrency } from '../../utils/format';
import { cn } from '../../src/lib/utils';

interface Props {
    items: BudgetStudioItem[];
    onUpdate: (id: string, field: keyof BudgetStudioItem, value: any) => void;
    onRemove: (id: string) => void;
    isShowroom: boolean;
}

export function BudgetCanvas({ items, onUpdate, onRemove, isShowroom }: Props) {
    if (items.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-300 bg-slate-50/50">
                <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mb-4 animate-pulse">
                    <Plus size={48} className="opacity-20" />
                </div>
                <p className="text-lg font-medium">O plano de tratamento está vazio</p>
                <p className="text-sm">Selecione procedimentos no catálogo à esquerda.</p>
            </div>
        );
    }

    return (
        <div
            className={cn(
                'flex-1 overflow-y-auto p-6 transition-all',
                isShowroom ? 'bg-slate-900 text-white' : 'bg-white'
            )}
        >
            <div className="max-w-4xl mx-auto space-y-4">
                {items.map((item, idx) => (
                    <div
                        key={item.uniqueId}
                        className={cn(
                            'relative group rounded-2xl transition-all border',
                            isShowroom
                                ? 'bg-slate-800 border-slate-700 p-6 shadow-2xl flex flex-col md:flex-row gap-6 items-center'
                                : 'bg-white border-slate-200 p-4 hover:border-blue-300 hover:shadow-md flex items-center gap-4'
                        )}
                    >
                        {/* Showroom Image */}
                        {isShowroom && item.showroom_image_url && (
                            <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden shrink-0 bg-slate-700">
                                <img
                                    src={item.showroom_image_url}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}

                        {/* Placeholder Image if no URL */}
                        {isShowroom && !item.showroom_image_url && (
                            <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden shrink-0 bg-slate-700 flex items-center justify-center">
                                <ImageIcon size={32} className="text-slate-600" />
                            </div>
                        )}

                        {/* Conteúdo */}
                        <div className="flex-1 w-full">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div
                                        className={cn(
                                            'text-[10px] font-bold mb-1',
                                            isShowroom ? 'text-blue-400' : 'text-slate-400'
                                        )}
                                    >
                                        ITEM {String(idx + 1).padStart(2, '0')}
                                    </div>
                                    <h3
                                        className={cn(
                                            'font-bold leading-tight',
                                            isShowroom ? 'text-2xl' : 'text-sm text-slate-800'
                                        )}
                                    >
                                        {item.name}
                                    </h3>
                                    {isShowroom && item.benefits_description && (
                                        <p className="text-slate-400 mt-2 text-sm italic">
                                            {item.benefits_description}
                                        </p>
                                    )}
                                </div>

                                {/* Preço no Showroom */}
                                {isShowroom && (
                                    <div className="text-right ml-4">
                                        <p className="text-3xl font-bold text-emerald-400">
                                            {formatCurrency(item.unit_value * item.quantity)}
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            {item.quantity}x {formatCurrency(item.unit_value)}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Controles de Edição (Somente se NÃO for Showroom) */}
                            {!isShowroom && (
                                <div className="flex items-center gap-4 mt-3 flex-wrap">
                                    {/* Quantidade */}
                                    <div className="flex items-center border rounded-lg">
                                        <button
                                            onClick={() =>
                                                onUpdate(item.uniqueId, 'quantity', Math.max(1, item.quantity - 1))
                                            }
                                            className="p-1 hover:bg-slate-100 text-slate-500 transition-colors"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                                        <button
                                            onClick={() => onUpdate(item.uniqueId, 'quantity', item.quantity + 1)}
                                            className="p-1 hover:bg-slate-100 text-slate-500 transition-colors"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>

                                    {/* Região/Dente */}
                                    <input
                                        placeholder="Região/Dente"
                                        className="w-32 text-sm border rounded-lg px-2 py-1 outline-none focus:border-blue-500 transition-colors"
                                        value={item.region || item.tooth_number || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            // Se for número, salva como tooth_number, senão como region
                                            if (!isNaN(Number(val)) && val !== '') {
                                                onUpdate(item.uniqueId, 'tooth_number', Number(val));
                                                onUpdate(item.uniqueId, 'region', undefined);
                                            } else {
                                                onUpdate(item.uniqueId, 'region', val);
                                                onUpdate(item.uniqueId, 'tooth_number', undefined);
                                            }
                                        }}
                                    />

                                    {/* Valor Unitário */}
                                    <div className="relative flex-1 max-w-[120px]">
                                        <span className="absolute left-2 top-1.5 text-xs text-slate-400">R$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full pl-6 pr-2 py-1 text-sm font-bold border rounded-lg outline-none focus:border-blue-500 text-right transition-colors"
                                            value={item.unit_value}
                                            onChange={(e) => onUpdate(item.uniqueId, 'unit_value', Number(e.target.value))}
                                        />
                                    </div>

                                    {/* Total da Linha */}
                                    <div className="ml-auto font-bold text-slate-700">
                                        {formatCurrency(item.unit_value * item.quantity)}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Remove Button */}
                        {!isShowroom && (
                            <button
                                onClick={() => onRemove(item.uniqueId)}
                                className="absolute -top-2 -right-2 bg-white text-slate-400 hover:text-red-500 p-1 rounded-full shadow-sm border opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
