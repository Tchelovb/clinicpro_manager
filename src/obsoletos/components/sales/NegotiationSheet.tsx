import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Square, DollarSign, Calendar } from 'lucide-react';
import { supabase } from '../../src/lib/supabase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../../utils/format';

interface NegotiationSheetProps {
    budget: any;
    items?: any[]; // For Studio mode
    isOpen: boolean;
    onClose: () => void;
    onProceedToCheckout?: (negotiatedData: any) => void; // Terminal mode
    onSaveBudget?: (negotiatedData: any) => void; // Studio mode
    mode: 'studio' | 'terminal';
}

// Assuming PaymentMethod is a defined type elsewhere, or we can define it here for clarity
type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'CASH' | 'BOLETO' | 'DEBIT_CARD';

export const NegotiationSheet: React.FC<NegotiationSheetProps> = ({
    budget,
    items,
    isOpen,
    onClose,
    onProceedToCheckout,
    onSaveBudget,
    mode
}) => {
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
    const [installments, setInstallments] = useState(1);
    const [discount, setDiscount] = useState(0);
    const [downPayment, setDownPayment] = useState(0);
    const [firstDueDate, setFirstDueDate] = useState('');
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const navigate = useNavigate();

    // Use items from props (Studio) or budget.items (Terminal)
    const displayItems = items || budget?.items || [];

    // Pre-fill with doctor's suggestion
    useEffect(() => {
        if (budget) {
            setPaymentMethod(budget.payment_method_preference || 'PIX');
            setInstallments(budget.suggested_installments || 1);
            setDiscount(budget.suggested_discount_percent || 0);
        }
    }, [budget]);

    // Auto-select all items on open
    useEffect(() => {
        if (isOpen && displayItems.length > 0) {
            const allIds = new Set<string>(displayItems.map((item: any) => item.id));
            setSelectedItems(allIds);
        }
    }, [isOpen, displayItems]);

    // Auto-apply PIX discount
    useEffect(() => {
        if (paymentMethod === 'PIX') {
            setDiscount(5);
            setInstallments(1);
        } else if (paymentMethod === 'CASH' || paymentMethod === 'DEBIT_CARD') {
            setInstallments(1);
        }
    }, [paymentMethod]);

    // Toggle item selection
    const toggleItem = (itemId: string) => {
        const newSet = new Set(selectedItems);
        if (newSet.has(itemId)) {
            newSet.delete(itemId);
        } else {
            newSet.add(itemId);
        }
        setSelectedItems(newSet);
    };

    // Calculate values based on selected items
    const selectedItemsFiltered = displayItems.filter((item: any) => selectedItems.has(item.id));
    const subtotal = selectedItemsFiltered.reduce((sum: number, item: any) => sum + (item.total_value || item.unit_value || 0), 0);
    const discountAmount = (subtotal * discount) / 100;
    const finalValue = subtotal - discountAmount;
    const valueToInstallment = Math.max(0, finalValue - downPayment);
    const installmentValue = installments > 0 ? valueToInstallment / installments : valueToInstallment;

    const handleAction = async () => {
        const negotiatedData = {
            paymentMethod,
            installments,
            discount,
            downPayment,
            firstDueDate,
            subtotal,
            discountAmount,
            finalValue,
            installmentValue,
            selectedItemIds: Array.from(selectedItems),
            budgetData: budget
        };

        if (mode === 'studio') {
            // Studio mode: Save budget with payment preferences
            if (onSaveBudget) {
                try {
                    // Only update directly if we have a budget ID
                    if (budget.id) {
                        // Update budget with financial fields
                        const { error } = await supabase
                            .from('budgets')
                            .update({
                                payment_method_preference: paymentMethod,
                                suggested_installments: installments,
                                suggested_discount_percent: discount,
                                down_payment_value: downPayment,
                                first_due_date: firstDueDate || null
                            })
                            .eq('id', budget.id);

                        if (error) throw error;
                        toast.success('Preferências de pagamento salvas!');
                    } else {
                        console.log('📝 [NegotiationSheet] Budget has no ID yet, skipping direct update. Parent will handle save.');
                    }

                    onSaveBudget(negotiatedData);
                } catch (err) {
                    console.error('Error saving payment preferences:', err);
                    toast.error('Erro ao salvar preferências');
                }
            }
        } else {
            // Terminal mode: Proceed to checkout
            if (onProceedToCheckout) {
                onProceedToCheckout(negotiatedData);
            }
        }

        onClose();
    };

    if (!isOpen) return null;

    const buttonText = mode === 'studio' ? 'Salvar Orçamento' : 'Aprovar e Lançar Venda';
    const buttonColor = mode === 'studio' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700';

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={onClose}
            />

            {/* Sheet */}
            <div className={`
                fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl
                transform transition-transform duration-300 ease-out
                md:right-0 md:left-auto md:top-0 md:bottom-0 md:w-[500px] md:rounded-none
                ${isOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0 md:translate-x-full'}
            `}>
                {/* Handle (Mobile) */}
                <div className="flex justify-center pt-3 pb-2 md:hidden">
                    <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Negociação</h2>
                        <div className="text-sm text-slate-600">
                            {selectedItems.size} {selectedItems.size === 1 ? 'procedimento' : 'procedimentos'}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ maxHeight: 'calc(100vh - 200px)' }}>

                    {/* Items Checklist */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-600 mb-3">
                            Procedimentos ({selectedItems.size}/{displayItems.length})
                        </h3>
                        <div className="space-y-2">
                            {displayItems.map((item: any) => {
                                const isSelected = selectedItems.has(item.id);
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => toggleItem(item.id)}
                                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-blue-50 border-2 border-blue-200' : 'bg-slate-50 border-2 border-transparent'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {isSelected ? (
                                                <CheckSquare className="text-blue-600" size={20} />
                                            ) : (
                                                <Square className="text-slate-300" size={20} />
                                            )}
                                            <span className={`text-sm ${isSelected ? 'text-slate-900 font-medium' : 'text-slate-400'}`}>
                                                {item.procedure_name}
                                            </span>
                                        </div>
                                        <span className={`text-sm font-bold ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>
                                            {formatCurrency(item.total_value || item.unit_value)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Down Payment */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <DollarSign size={16} />
                            Entrada/Sinal
                        </label>
                        <input
                            type="number"
                            value={downPayment}
                            onChange={(e) => setDownPayment(Number(e.target.value))}
                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                            placeholder="R$ 0,00"
                            min="0"
                            step="0.01"
                        />
                    </div>

                    {/* First Due Date - Only for non-immediate payment methods */}
                    {!['CREDIT_CARD', 'DEBIT_CARD', 'CASH'].includes(paymentMethod) && (
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Calendar size={16} />
                                Data do 1º Vencimento
                            </label>
                            <input
                                type="date"
                                value={firstDueDate}
                                onChange={(e) => setFirstDueDate(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none"
                            />
                        </div>
                    )}

                    {/* Payment Method Selector */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Forma de Pagamento</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('PIX')}
                                className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === 'PIX'
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-slate-200 hover:border-green-300'
                                    }`}
                            >
                                <div className="text-sm font-bold text-slate-900">PIX</div>
                                <div className="text-xs text-green-600 font-semibold">-5% automático</div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setPaymentMethod('CREDIT_CARD')}
                                className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === 'CREDIT_CARD'
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-slate-200 hover:border-blue-300'
                                    }`}
                            >
                                <div className="text-sm font-bold text-slate-900">Cartão</div>
                                <div className="text-xs text-slate-500">Até 18x</div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setPaymentMethod('CASH')}
                                className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === 'CASH'
                                    ? 'border-emerald-500 bg-emerald-50'
                                    : 'border-slate-200 hover:border-emerald-300'
                                    }`}
                            >
                                <div className="text-sm font-bold text-slate-900">Dinheiro</div>
                                <div className="text-xs text-slate-500">À vista</div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setPaymentMethod('BOLETO')}
                                className={`p-4 rounded-xl border-2 transition-all ${paymentMethod === 'BOLETO'
                                    ? 'border-orange-500 bg-orange-50'
                                    : 'border-slate-200 hover:border-orange-300'
                                    }`}
                            >
                                <div className="text-sm font-bold text-slate-900">Boleto</div>
                                <div className="text-xs text-slate-500">Até 18x</div>
                            </button>
                        </div>
                    </div>

                    {/* Installments Slider */}
                    {(paymentMethod === 'CREDIT_CARD' || paymentMethod === 'BOLETO') && (
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <h3 className="text-sm font-bold text-slate-600">Parcelamento</h3>
                                <span className="text-2xl font-bold text-blue-600">{installments}x</span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="18"
                                step="1"
                                value={installments}
                                onChange={(e) => setInstallments(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <div className="flex justify-between text-xs text-slate-400 mt-1">
                                <span>À vista</span>
                                <span>6x</span>
                                <span>12x</span>
                                <span>18x</span>
                            </div>
                        </div>
                    )}

                    {/* Summary */}
                    <div className="bg-slate-900 text-white p-6 rounded-xl space-y-3">
                        <div className="flex justify-between text-sm">
                            <span>Subtotal</span>
                            <span>{formatCurrency(subtotal)}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between text-sm text-green-400">
                                <span>Desconto ({discount}%)</span>
                                <span>-{formatCurrency(discountAmount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-lg font-bold border-t border-slate-700 pt-3">
                            <span>Total</span>
                            <span>{formatCurrency(finalValue)}</span>
                        </div>
                        {installments > 1 && (
                            <div className="text-center text-sm text-slate-400">
                                {installments}x de {formatCurrency(installmentValue)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer - Sticky */}
                <div className="p-6 border-t bg-white">
                    <button
                        onClick={handleAction}
                        disabled={selectedItems.size === 0}
                        className={`w-full py-4 ${buttonColor} disabled:bg-slate-300 text-white font-bold rounded-xl transition-colors`}
                    >
                        {buttonText}
                    </button>
                </div>
            </div>
        </>
    );
};
