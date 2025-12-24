import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Lock, ShieldAlert, Delete, CheckCircle } from 'lucide-react';
import { securityService } from '../../services/securityService';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

interface SecurityPinModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    title?: string;
    description?: string;
    requiredRole?: string; // Future use
}

export function SecurityPinModal({
    isOpen,
    onClose,
    onSuccess,
    title = "Verificação de Segurança",
    description = "Digite seu PIN de 4 dígitos para autorizar esta ação."
}: SecurityPinModalProps) {
    const [pin, setPin] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);
    const [shake, setShake] = useState(false);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setPin('');
            setError(false);
            setShake(false);
        }
    }, [isOpen]);

    const handleNumberClick = (num: number) => {
        if (pin.length < 4 && !isLoading) {
            setPin(prev => prev + num);
        }
    };

    const handleBackspace = () => {
        if (!isLoading) {
            setPin(prev => prev.slice(0, -1));
        }
    };

    const handleSubmit = async () => {
        if (pin.length !== 4) return;

        setIsLoading(true);
        setError(false);

        try {
            const isValid = await securityService.verifyPin(pin);

            if (isValid) {
                toast.success('Autorizado com sucesso!');
                onSuccess();
                onClose();
            } else {
                triggerError();
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Erro na verificação');
            triggerError();
        } finally {
            setIsLoading(false);
        }
    };

    const triggerError = () => {
        setError(true);
        setShake(true);
        setPin('');
        setTimeout(() => setShake(false), 500);
    };

    // Auto-submit when 4 digits entered
    useEffect(() => {
        if (pin.length === 4) {
            handleSubmit();
        }
    }, [pin]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !isLoading && !open && onClose()}>
            <DialogContent className={cn("sm:max-w-md", shake && "animate-shake")}>
                <DialogHeader className="items-center">
                    <div className={cn("p-3 rounded-full mb-2 transition-colors", error ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600")}>
                        {error ? <ShieldAlert size={32} /> : <Lock size={32} />}
                    </div>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription className="text-center">
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center space-y-6 py-4">
                    {/* PIN Display */}
                    <div className="flex gap-4">
                        {[0, 1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className={cn(
                                    "w-4 h-4 rounded-full border-2 transition-all duration-200",
                                    pin.length > i
                                        ? (error ? "bg-red-500 border-red-500" : "bg-blue-600 border-blue-600")
                                        : "border-gray-300 bg-transparent"
                                )}
                            />
                        ))}
                    </div>

                    {/* Keypad */}
                    <div className="grid grid-cols-3 gap-4 w-full max-w-[240px]">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <button
                                key={num}
                                onClick={() => handleNumberClick(num)}
                                disabled={isLoading}
                                className="h-16 w-16 rounded-full text-2xl font-semibold bg-gray-50 hover:bg-gray-100 active:bg-gray-200 border border-gray-100 transition-colors disabled:opacity-50"
                            >
                                {num}
                            </button>
                        ))}
                        <div className="h-16 w-16" /> {/* Spacer */}
                        <button
                            onClick={() => handleNumberClick(0)}
                            disabled={isLoading}
                            className="h-16 w-16 rounded-full text-2xl font-semibold bg-gray-50 hover:bg-gray-100 active:bg-gray-200 border border-gray-100 transition-colors disabled:opacity-50"
                        >
                            0
                        </button>
                        <button
                            onClick={handleBackspace}
                            disabled={isLoading || pin.length === 0}
                            className="h-16 w-16 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-30"
                        >
                            <Delete size={24} />
                        </button>
                    </div>
                </div>

                {error && (
                    <p className="text-center text-sm text-red-500 font-medium animate-pulse">
                        PIN Incorreto. Tente novamente.
                    </p>
                )}
            </DialogContent>
        </Dialog>
    );
}
