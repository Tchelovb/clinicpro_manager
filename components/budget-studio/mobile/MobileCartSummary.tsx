import React, { useState, useMemo } from 'react';
import { ArrowRight, ChevronUp, ChevronDown, Trash2, X, Zap, CreditCard, Banknote, FileText } from 'lucide-react';
import { formatCurrency } from '../../../utils/format';
import { BudgetStudioItem } from '../../../hooks/useBudgetStudio';
import { cn } from '../../../lib/utils';

interface MobileCartSummaryProps {
    items: BudgetStudioItem[];
    onProceed: (paymentData: PaymentData) => void;
    onRemoveItem: (uniqueId: string) => void;
}

export interface PaymentData {
    paymentMethod: string;
    installments: number;
    finalValue: number;
    discountApplied: number;
}

const PAYMENT_OPTIONS = [
    { id: 'PIX', label: 'PIX', icon: Zap, color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-600' },
    { id: 'CREDIT_CARD', label: 'Cartão', icon: CreditCard, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-600' },
    { id: 'CASH', label: 'Dinheiro', icon: Banknote, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-600' },
    { id: 'BOLETO', label: 'Boleto', icon: FileText, color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-600' },
];

const CASH_DISCOUNT_PERCENT = 5; // Default 5% discount for PIX/Cash

export const MobileCartSummary: React.FC<MobileCartSummaryProps> = ({ items, onProceed, onRemoveItem }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('PIX');
    const [installments, setInstallments] = useState(1);

    // Calculate subtotal
    const subtotal = items.reduce((acc, i) => acc + (i.unit_value * i.quantity), 0);
    const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);

    // Calculate discount (5% for PIX/Cash)
    const discountAmount = useMemo(() => {
        if (paymentMethod === 'PIX' || paymentMethod === 'CASH') {
            return subtotal * (CASH_DISCOUNT_PERCENT / 100);
        }
        return 0;
    }, [paymentMethod, subtotal]);

    // Final total after discount
    const total = subtotal - discountAmount;

    // Installment value for credit card
    const installmentValue = useMemo(() => {
        if (paymentMethod === 'CREDIT_CARD' && installments > 1) {
            return total / installments;
        }
        return total;
    }, [paymentMethod, installments, total]);

    const handleProceed = () => {
        const paymentData: PaymentData = {
            paymentMethod,
            installments: paymentMethod === 'CREDIT_CARD' ? installments : 1,
            finalValue: total,
            discountApplied: discountAmount,
        };
        onProceed(paymentData);
    };

    if (items.length === 0) return null;

    return (
        <>
            {/* Backdrop for expanded state */}
            {isExpanded && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 animate-in fade-in duration-300"
                    onClick={() => setIsExpanded(false)}
                />
            )}

            <div className={cn(
                "fixed bottom-0 left-0 right-0 bg-white shadow-[0_-10px_40px_rgba(0,0,0,0.15)] rounded-t-[32px] transition-all duration-500 z-[60] border-t border-slate-100",
                isExpanded ? 'h-[85vh]' : 'h-[100px] pb-5'
            )}>
                {/* Alça de Arrastar */}
                <div
                    className="flex justify-center p-3 cursor-pointer hit-area-expand"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
                </div>

                <div className="px-6 flex justify-between items-center h-14">
                    <div
                        className="flex flex-col cursor-pointer"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider flex items-center gap-1">
                            {itemCount} {itemCount === 1 ? 'Item' : 'Itens'}
                            {isExpanded ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                        </span>
                        <span className="text-2xl font-black text-slate-800 tracking-tight">
                            {formatCurrency(total)}
                        </span>
                    </div>
                    <button
                        onClick={handleProceed}
                        className="bg-blue-600 text-white pl-6 pr-4 py-3 rounded-2xl font-bold shadow-lg shadow-blue-200 flex items-center gap-2 active:scale-95 transition-transform"
                    >
                        Checkout <ArrowRight size={18} strokeWidth={3} />
                    </button>
                </div>

                {isExpanded && (
                    <div className="p-6 mt-2 overflow-y-auto h-[calc(85vh-120px)] animate-in slide-in-from-bottom-5 fade-in duration-300">
                        <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center justify-between">
                            Resumo da Proposta
                            <button onClick={() => setIsExpanded(false)} className="p-2 bg-slate-100 rounded-full text-slate-500">
                                <X size={16} />
                            </button>
                        </h3>

                        {/* Items List */}
                        <div className="space-y-3 pb-6">
                            {items.map((item, idx) => (
                                <div key={item.uniqueId || idx} className="flex gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 items-center">
                                    <div className="flex-1 min-w-0">
                                        <h5 className="font-bold text-slate-800 text-sm leading-tight mb-1">{item.name}</h5>
                                        <p className="text-xs text-slate-500 mb-2">{item.category}</p>
                                        <span className="font-bold text-slate-700 text-sm">
                                            {item.quantity}x {formatCurrency(item.unit_value)}
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onRemoveItem(item.uniqueId);
                                        }}
                                        className="p-2 text-red-500 bg-white rounded-lg border border-red-50 hover:bg-red-50 shrink-0"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Payment Method Selector */}
                        <div className="border-t border-slate-200 pt-6 pb-6">
                            <h4 className="text-sm font-black text-slate-400 uppercase mb-4 tracking-wider">Forma de Pagamento</h4>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                {PAYMENT_OPTIONS.map((opt) => {
                                    const Icon = opt.icon;
                                    const isSelected = paymentMethod === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => {
                                                setPaymentMethod(opt.id);
                                                if (opt.id !== 'CREDIT_CARD') setInstallments(1);
                                            }}
                                            className={cn(
                                                "flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200",
                                                isSelected
                                                    ? `${opt.borderColor} ${opt.bgColor} shadow-md transform scale-105`
                                                    : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                                            )}
                                        >
                                            <span className={cn("font-bold text-sm", isSelected && opt.color)}>{opt.label}</span>
                                            <Icon size={20} className={isSelected ? opt.color : 'text-slate-400'} />
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Installment Selector (Credit Card Only) */}
                            {paymentMethod === 'CREDIT_CARD' && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                                        Parcelamento
                                    </label>
                                    <select
                                        value={installments}
                                        onChange={(e) => setInstallments(Number(e.target.value))}
                                        className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:border-blue-600 transition-colors"
                                    >
                                        {[1, 2, 3, 4, 5, 6, 10, 12].map(n => (
                                            <option key={n} value={n}>
                                                {n}x de {formatCurrency(total / n)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Cash Discount Badge */}
                            {(paymentMethod === 'PIX' || paymentMethod === 'CASH') && discountAmount > 0 && (
                                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-2xl animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-center gap-2">
                                        <Zap size={16} className="text-green-600" />
                                        <span className="text-sm font-bold text-green-700">
                                            Desconto à vista: {CASH_DISCOUNT_PERCENT}% aplicado!
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Financial Summary */}
                        <div className="border-t border-slate-200 pt-6 space-y-3 pb-20">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Subtotal</span>
                                <span className="font-bold text-slate-800">{formatCurrency(subtotal)}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-green-600">Desconto ({CASH_DISCOUNT_PERCENT}%)</span>
                                    <span className="font-bold text-green-600">- {formatCurrency(discountAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-xl font-black mt-4 pt-4 border-t border-slate-200">
                                <span className="text-slate-800">Total</span>
                                <span className="text-blue-600">{formatCurrency(total)}</span>
                            </div>
                            {paymentMethod === 'CREDIT_CARD' && installments > 1 && (
                                <p className="text-xs text-slate-500 text-center mt-2">
                                    ou {installments}x de {formatCurrency(installmentValue)} sem juros
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};
