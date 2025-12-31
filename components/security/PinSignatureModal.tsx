import React, { useState } from 'react';
import { Lock, CheckCircle, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

interface PinSignatureModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    title?: string;
    description?: string;
}

export const PinSignatureModal: React.FC<PinSignatureModalProps> = ({
    open,
    onOpenChange,
    onSuccess,
    title = "Assinatura Eletrônica",
    description = "Digite seu PIN de 4 dígitos para confirmar esta ação."
}) => {
    const [pin, setPin] = useState(['', '', '', '']);
    const [loading, setLoading] = useState(false);

    const handlePinChange = (index: number, value: string) => {
        if (value.length > 1) return; // Only 1 digit
        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);

        // Auto move focus
        if (value && index < 3) {
            const nextInput = document.getElementById(`pin-${index + 1}`);
            nextInput?.focus();
        }

        // Auto submit if complete
        if (index === 3 && value) {
            verifyPin(newPin.join(''));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            const prevInput = document.getElementById(`pin-${index - 1}`);
            prevInput?.focus();
        }
    };

    const verifyPin = async (fullPin: string) => {
        setLoading(true);
        // Simulate API check lag
        await new Promise(resolve => setTimeout(resolve, 600));

        // TODO: Validate against user.attendance_pin_hash
        // For development, accepting '1234'
        if (fullPin === '1234') {
            toast.success('Assinatura Validada');
            setPin(['', '', '', '']); // Reset
            onSuccess();
            onOpenChange(false);
        } else {
            toast.error('PIN Incorreto');
            setPin(['', '', '', '']);
            document.getElementById('pin-0')?.focus();
        }
        setLoading(false);
    };

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in" />
                <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-sm translate-x-[-50%] translate-y-[-50%] outline-none animate-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <div className="flex flex-col items-center justify-center mb-6 text-center">
                            <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mb-4 text-violet-600 dark:text-violet-400">
                                <Lock size={32} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
                            <p className="text-sm text-slate-500 mt-1">{description}</p>
                        </div>

                        <div className="flex justify-center gap-3 mb-8">
                            {pin.map((digit, i) => (
                                <input
                                    key={i}
                                    id={`pin-${i}`}
                                    type="password"
                                    inputMode="numeric"
                                    value={digit}
                                    onChange={(e) => handlePinChange(i, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(i, e)}
                                    className="w-12 h-14 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-center text-2xl font-bold bg-slate-50 dark:bg-slate-800 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/20 outline-none transition-all"
                                    maxLength={1}
                                    disabled={loading}
                                    autoFocus={i === 0}
                                />
                            ))}
                        </div>

                        <div className="text-center text-xs text-slate-400">
                            <p>Ao digitar seu PIN, você assina digitalmente este procedimento.</p>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};
