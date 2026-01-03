import React, { useState } from 'react';
import { CreditCard, DollarSign, Smartphone, Wallet, Lock, CheckCircle2 } from 'lucide-react';
import { cn } from '../../src/lib/utils'; // Assuming cn utility exists

interface CheckoutPanelProps {
    subtotal: number;
    discount: number;
    total: number;
    onProcessPayment: (method: string, installments: number) => void;
    loading?: boolean;
}

export const CheckoutPanel: React.FC<CheckoutPanelProps> = ({ subtotal, discount, total, onProcessPayment, loading = false }) => {
    const [selectedMethod, setSelectedMethod] = useState<'credit' | 'debit' | 'pix' | 'cash'>('credit');
    const [installments, setInstallments] = useState<number>(1);

    const installmentValue = total / installments;

    const handleFinish = () => {
        onProcessPayment(selectedMethod, installments);
    };

    return (
        <div className="w-[380px] bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col overflow-hidden h-fit sticky top-6">
            <div className="bg-slate-900 p-6 text-white text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                <h3 className="font-bold text-lg mb-1 flex justify-center items-center gap-2">
                    <Wallet size={18} className="text-blue-400" />
                    Finalizar Venda
                </h3>
                <p className="text-slate-400 text-xs">Selecione a forma de pagamento</p>
            </div>

            <div className="p-6 space-y-6">
                {/* Method Selector */}
                <div className="grid grid-cols-2 gap-3">
                    <PaymentButton
                        active={selectedMethod === 'credit'}
                        onClick={() => { setSelectedMethod('credit'); setInstallments(1); }}
                        icon={CreditCard}
                        label="Crédito"
                    />
                    <PaymentButton
                        active={selectedMethod === 'debit'}
                        onClick={() => { setSelectedMethod('debit'); setInstallments(1); }}
                        icon={CreditCard}
                        label="Débito"
                    />
                    <PaymentButton
                        active={selectedMethod === 'pix'}
                        onClick={() => { setSelectedMethod('pix'); setInstallments(1); }}
                        icon={Smartphone}
                        label="Pix"
                    />
                    <PaymentButton
                        active={selectedMethod === 'cash'}
                        onClick={() => { setSelectedMethod('cash'); setInstallments(1); }}
                        icon={DollarSign}
                        label="Dinheiro"
                    />
                </div>

                {/* Amount Summary */}
                <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100">
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>Valor Original</span>
                        <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                        <div className="flex justify-between text-xs text-green-600 font-bold">
                            <span>Desconto Aplicado</span>
                            <span>- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(discount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                        <span className="font-bold text-slate-700">Total Final</span>
                        <span className="font-black text-xl text-slate-900">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                        </span>
                    </div>
                </div>

                {/* Installments Logic - Only for Credit */}
                {selectedMethod === 'credit' && (
                    <div className="space-y-2 animation-fade-in">
                        <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                            Parcelamento
                            <span className="text-blue-600">{installments}x de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(installmentValue)}</span>
                        </label>
                        <select
                            value={installments}
                            onChange={(e) => setInstallments(Number(e.target.value))}
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                        >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                                <option key={num} value={num}>
                                    {num}x de {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total / num)} {num === 1 ? '(Sem juros)' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Action Button */}
            <div className="p-6 mt-auto bg-slate-50 border-t border-slate-100">
                <button
                    onClick={handleFinish}
                    disabled={loading || total <= 0}
                    className={cn(
                        "w-full py-4 rounded-xl font-black text-lg shadow-lg transition-all flex items-center justify-center gap-2",
                        loading || total <= 0
                            ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700 text-white shadow-green-200 hover:shadow-green-300 hover:scale-[1.02]"
                    )}
                >
                    {loading ? (
                        <>Processando...</>
                    ) : (
                        <>
                            <CheckCircle2 size={24} />
                            RECEBER {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total)}
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

const PaymentButton = ({ active, onClick, icon: Icon, label }: any) => (
    <button
        onClick={onClick}
        className={cn(
            "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all group relative overflow-hidden",
            active
                ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-200"
                : "border-slate-100 bg-white hover:border-blue-300 hover:bg-slate-50 text-slate-500"
        )}
    >
        <Icon className={cn("mb-1 transition-colors", active ? "text-blue-600" : "text-slate-400 group-hover:text-blue-500")} size={24} />
        <span className="text-xs font-bold">{label}</span>
        {active && <div className="absolute right-2 top-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>}
    </button>
);
