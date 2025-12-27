import React, { useState, useEffect } from 'react';
import { Shield, X, Lock, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { securityService } from '../services/securityService';

interface SecurityPinModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    title?: string;
    description?: string;
    message?: string; // Mensagem de orientação secundária
    actionType?: 'REFUND' | 'DISCOUNT' | 'DELETE' | 'BUDGET_OVERRIDE' | 'CUSTOM';
    entityType?: string;
    entityId?: string;
    entityName?: string;
}

const SecurityPinModal: React.FC<SecurityPinModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    title = '🔐 Autenticação de Segurança',
    description = 'Esta ação requer confirmação do PIN de segurança',
    message,
    actionType = 'CUSTOM',
    entityType,
    entityId,
    entityName
}) => {
    // Cleaned up duplicates

    const { profile } = useAuth();
    const [pin, setPin] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState('');
    const [isLocked, setIsLocked] = useState(false);
    const [lockedUntil, setLockedUntil] = useState<Date | null>(null);
    const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setPin('');
            setError('');
            setShowSuccess(false);
            checkLockStatus();
        }
    }, [isOpen]);

    // Check if PIN is locked
    const checkLockStatus = async () => {
        if (!profile?.id) return;

        const lockStatus = await securityService.isPinLocked(profile.id);
        setIsLocked(lockStatus.isLocked);
        if (lockStatus.lockedUntil) {
            setLockedUntil(lockStatus.lockedUntil);
        }
    };

    // Handle number button click
    const handleNumberClick = (num: string) => {
        if (pin.length < 6 && !isLocked) {
            setPin(prev => prev + num);
            setError('');
        }
    };

    // Handle backspace
    const handleBackspace = () => {
        setPin(prev => prev.slice(0, -1));
        setError('');
    };

    // Handle clear
    const handleClear = () => {
        setPin('');
        setError('');
    };

    // Handle submit
    const handleSubmit = async () => {
        if (!profile?.id) {
            setError('Usuário não autenticado');
            return;
        }

        if (pin.length < 4) {
            setError('Digite pelo menos 4 dígitos');
            return;
        }

        setIsValidating(true);
        setError('');

        try {
            const result = await securityService.validatePin(profile.id, pin);

            if (result.success) {
                // Log da ação autorizada
                await securityService.logAction({
                    action_type: actionType,
                    entity_type: entityType || 'UNKNOWN',
                    entity_id: entityId,
                    entity_name: entityName,
                    changes_summary: `Ação autorizada via PIN: ${title}`
                });

                setShowSuccess(true);
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 1000);
            } else {
                setError(result.message);
                setIsLocked(result.isLocked);
                if (result.lockedUntil) {
                    setLockedUntil(result.lockedUntil);
                }
                if (result.attemptsRemaining !== undefined) {
                    setAttemptsRemaining(result.attemptsRemaining);
                }
                setPin('');
            }
        } catch (err) {
            setError('Erro ao validar PIN');
            setPin('');
        } finally {
            setIsValidating(false);
        }
    };

    // Handle Enter key
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'Enter' && pin.length >= 4) {
                handleSubmit();
            } else if (e.key === 'Backspace') {
                handleBackspace();
            } else if (e.key === 'Escape') {
                onClose();
            } else if (/^[0-9]$/.test(e.key)) {
                handleNumberClick(e.key);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isOpen, pin]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="border-b border-slate-200 dark:border-slate-700 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-xl ${showSuccess
                                ? 'bg-green-100 dark:bg-green-900/40'
                                : isLocked
                                    ? 'bg-red-100 dark:bg-red-900/40'
                                    : 'bg-violet-100 dark:bg-violet-900/40'
                                }`}>
                                {showSuccess ? (
                                    <CheckCircle className="text-green-600 dark:text-green-400" size={28} />
                                ) : isLocked ? (
                                    <Lock className="text-red-600 dark:text-red-400" size={28} />
                                ) : (
                                    <Shield className="text-violet-600 dark:text-violet-400" size={28} />
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                                    {showSuccess ? '✓ Autorizado' : title}
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                    {showSuccess ? 'PIN validado com sucesso' : description}
                                </p>
                                {message && !showSuccess && (
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 flex items-start gap-2">
                                        <AlertCircle size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                        {message}
                                    </p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            disabled={isValidating}
                        >
                            <X className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" size={24} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Locked Warning */}
                    {isLocked && lockedUntil && (
                        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <Lock className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
                                <div className="text-sm">
                                    <p className="font-bold text-red-900 dark:text-red-100 mb-1">
                                        🔒 PIN Bloqueado
                                    </p>
                                    <p className="text-red-700 dark:text-red-300">
                                        Muitas tentativas falhas. Tente novamente às{' '}
                                        <strong>{lockedUntil.toLocaleTimeString('pt-BR')}</strong>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PIN Display */}
                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 text-center">
                            Digite seu PIN de Segurança
                        </label>
                        <div className="flex justify-center gap-3">
                            {[0, 1, 2, 3, 4, 5].map((index) => (
                                <div
                                    key={index}
                                    className={`w-12 h-14 rounded-lg border-2 flex items-center justify-center text-2xl font-bold transition-all ${pin.length > index
                                        ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
                                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600'
                                        }`}
                                >
                                    {pin.length > index ? '●' : ''}
                                </div>
                            ))}
                        </div>
                        {attemptsRemaining !== null && attemptsRemaining > 0 && (
                            <p className="text-center text-sm text-amber-600 dark:text-amber-400 font-medium">
                                ⚠️ {attemptsRemaining} tentativa{attemptsRemaining > 1 ? 's' : ''} restante{attemptsRemaining > 1 ? 's' : ''}
                            </p>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && !isLocked && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700 dark:text-red-300 animate-in shake duration-200">
                            <AlertCircle size={16} className="flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Success Message */}
                    {showSuccess && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center gap-2 text-sm text-green-700 dark:text-green-300 animate-in zoom-in duration-200">
                            <CheckCircle size={16} className="flex-shrink-0" />
                            <span>PIN validado! Autorizando ação...</span>
                        </div>
                    )}

                    {/* Numeric Keypad */}
                    {!isLocked && !showSuccess && (
                        <div className="grid grid-cols-3 gap-3">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => handleNumberClick(num.toString())}
                                    disabled={isValidating}
                                    className="h-14 bg-slate-100 dark:bg-slate-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 border border-slate-200 dark:border-slate-700 hover:border-violet-500 dark:hover:border-violet-500 rounded-xl text-xl font-bold text-slate-700 dark:text-slate-300 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {num}
                                </button>
                            ))}
                            <button
                                onClick={handleClear}
                                disabled={isValidating || pin.length === 0}
                                className="h-14 bg-slate-100 dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-900/30 border border-slate-200 dark:border-slate-700 hover:border-red-500 dark:hover:border-red-500 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Limpar
                            </button>
                            <button
                                onClick={() => handleNumberClick('0')}
                                disabled={isValidating}
                                className="h-14 bg-slate-100 dark:bg-slate-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 border border-slate-200 dark:border-slate-700 hover:border-violet-500 dark:hover:border-violet-500 rounded-xl text-xl font-bold text-slate-700 dark:text-slate-300 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                0
                            </button>
                            <button
                                onClick={handleBackspace}
                                disabled={isValidating || pin.length === 0}
                                className="h-14 bg-slate-100 dark:bg-slate-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 border border-slate-200 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                ← Apagar
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!isLocked && !showSuccess && (
                    <div className="border-t border-slate-200 dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl">
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={isValidating}
                                className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isValidating || pin.length < 4}
                                className="flex-1 px-4 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isValidating ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        Validando...
                                    </>
                                ) : (
                                    <>
                                        <Shield size={18} />
                                        Confirmar
                                    </>
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-3">
                            💡 Dica: Use o teclado numérico ou clique nos botões
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SecurityPinModal;
