import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, CreditCard, Banknote, QrCode, AlertCircle, Lock } from 'lucide-react';
import { cn } from '../../src/lib/utils';
import { formatCurrency } from '../../utils/format';
import toast from 'react-hot-toast';

interface PaymentModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    totalAmount: number;
    onConfirm: (paymentData: any) => Promise<void>;
    patientName: string;
}

export function PaymentModal({ open, onOpenChange, totalAmount, onConfirm, patientName }: PaymentModalProps) {
    const [method, setMethod] = useState<'credit' | 'debit' | 'pix' | 'cash'>('credit');
    const [installments, setInstallments] = useState(1);

    // Lógica de Pagamento Parcial
    const [payingAmount, setPayingAmount] = useState<string>(totalAmount.toString());
    const [remainderAction, setRemainderAction] = useState<'reschedule' | 'discount'>('reschedule');
    const [rescheduleDate, setRescheduleDate] = useState('');

    // Cálculos
    const numericPaying = parseFloat(payingAmount) || 0;
    const remainder = totalAmount - numericPaying;
    const isPartial = remainder > 0.01; // Tolerância de centavos

    useEffect(() => {
        if (open) {
            setPayingAmount(totalAmount.toString());
            setMethod('credit');
            setInstallments(1);
            setRescheduleDate('');
        }
    }, [open, totalAmount]);

    const handleConfirm = async () => {
        if (isPartial && remainderAction === 'reschedule' && !rescheduleDate) {
            toast.error('Defina a data para o saldo restante.');
            return;
        }

        const payload = {
            method,
            installments: method === 'credit' ? installments : 1,
            paidAmount: numericPaying,
            totalOriginal: totalAmount,
            isPartial,
            remainderAction, // 'reschedule' ou 'discount'
            remainderAmount: remainder,
            rescheduleDate: remainderAction === 'reschedule' ? rescheduleDate : null,
            timestamp: new Date().toISOString() // RASTREABILIDADE TEMPORAL
        };

        await onConfirm(payload);
        onOpenChange(false);
    };

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-all duration-200" />
                <Dialog.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-white p-6 shadow-2xl duration-200 sm:rounded-xl">

                    {/* Header */}
                    <div className="flex flex-col items-center justify-center border-b pb-4">
                        <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Recebendo de {patientName}</h2>
                        <div className="text-4xl font-bold text-emerald-600 mt-1">
                            {formatCurrency(totalAmount)}
                        </div>
                    </div>

                    {/* Body */}
                    <div className="space-y-6 py-2">

                        {/* 1. Quanto está pagando agora? */}
                        <div>
                            <label className="text-sm font-bold text-slate-700 mb-1 block">Valor a Receber Agora</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                                <input
                                    type="number"
                                    value={payingAmount}
                                    onChange={(e) => setPayingAmount(e.target.value)}
                                    className={cn(
                                        "w-full pl-10 pr-4 py-3 text-xl font-bold border rounded-lg focus:ring-2 outline-none transition-all",
                                        isPartial ? "border-amber-300 ring-amber-100 text-amber-700" : "border-slate-200 focus:ring-emerald-100 text-slate-800"
                                    )}
                                />
                            </div>
                        </div>

                        {/* LÓGICA INTELIGENTE DE SPLIT (SE PARCIAL) */}
                        {isPartial && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                                    <div className="flex-1">
                                        <h4 className="font-bold text-amber-800 text-sm">Pagamento Parcial Detectado</h4>
                                        <p className="text-amber-700 text-xs mt-1">
                                            Faltam <span className="font-bold">{formatCurrency(remainder)}</span> para quitar o total. O que fazer?
                                        </p>

                                        <div className="mt-3 space-y-2">
                                            <label className="flex items-center gap-2 p-2 rounded border border-amber-200 bg-white cursor-pointer hover:bg-amber-50/50">
                                                <input
                                                    type="radio"
                                                    name="remainder"
                                                    checked={remainderAction === 'reschedule'}
                                                    onChange={() => setRemainderAction('reschedule')}
                                                    className="text-amber-600 focus:ring-amber-500"
                                                />
                                                <span className="text-sm font-medium text-slate-700">Agendar Restante (Nova Parcela)</span>
                                            </label>

                                            {remainderAction === 'reschedule' && (
                                                <div className="pl-6 pt-1 pb-2">
                                                    <label className="text-xs font-bold text-slate-500 block mb-1">Para quando?</label>
                                                    <input
                                                        type="date"
                                                        className="w-full text-sm p-2 border rounded"
                                                        value={rescheduleDate}
                                                        onChange={(e) => setRescheduleDate(e.target.value)}
                                                    />
                                                </div>
                                            )}

                                            <label className="flex items-center gap-2 p-2 rounded border border-amber-200 bg-white cursor-pointer hover:bg-amber-50/50 opacity-70">
                                                <input
                                                    type="radio"
                                                    name="remainder"
                                                    checked={remainderAction === 'discount'}
                                                    onChange={() => setRemainderAction('discount')}
                                                    className="text-amber-600 focus:ring-amber-500"
                                                />
                                                <span className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                                    Conceder Desconto (Perdoar) <Lock size={12} />
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 2. Método de Pagamento */}
                        <div>
                            <label className="text-sm font-bold text-slate-700 mb-2 block">Forma de Pagamento</label>
                            <div className="grid grid-cols-4 gap-2">
                                {[
                                    { id: 'pix', label: 'Pix', icon: QrCode },
                                    { id: 'credit', label: 'Crédito', icon: CreditCard },
                                    { id: 'debit', label: 'Débito', icon: CreditCard },
                                    { id: 'cash', label: 'Dinheiro', icon: Banknote },
                                ].map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => setMethod(m.id as any)}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-3 rounded-lg border transition-all gap-1",
                                            method === m.id
                                                ? "bg-slate-900 text-white border-slate-900 shadow-md transform scale-105"
                                                : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                        )}
                                    >
                                        <m.icon size={20} />
                                        <span className="text-xs font-bold">{m.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Parcelamento (Se Crédito) */}
                        {method === 'credit' && (
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                <label className="text-xs font-bold text-slate-500 block mb-1">Parcelamento</label>
                                <select
                                    value={installments}
                                    onChange={(e) => setInstallments(Number(e.target.value))}
                                    className="w-full p-2 text-sm border rounded bg-white"
                                >
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(i => (
                                        <option key={i} value={i}>
                                            {i}x de {formatCurrency(numericPaying / i)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 mt-4 pt-4 border-t">
                        <button
                            onClick={() => onOpenChange(false)}
                            className="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <Banknote size={20} />
                            CONFIRMAR RECEBIMENTO
                        </button>
                    </div>

                    <Dialog.Close className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none">
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </Dialog.Close>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
