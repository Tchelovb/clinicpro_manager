import React, { useState, useEffect } from 'react';
import { Shield, Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { securityService } from '../services/securityService';

const SetupSecurityPin: React.FC = () => {
    const { profile } = useAuth();
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [showPin, setShowPin] = useState(false);
    const [hasExistingPin, setHasExistingPin] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        checkExistingPin();
    }, [profile?.id]);

    const checkExistingPin = async () => {
        if (!profile?.id) return;
        const hasPinConfigured = await securityService.hasPinConfigured(profile.id);
        setHasExistingPin(hasPinConfigured);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        // Validações
        if (!/^\d{4,6}$/.test(pin)) {
            setMessage({
                type: 'error',
                text: 'O PIN deve conter entre 4 e 6 dígitos numéricos'
            });
            return;
        }

        if (pin !== confirmPin) {
            setMessage({
                type: 'error',
                text: 'Os PINs não coincidem'
            });
            return;
        }

        if (!profile?.id) {
            setMessage({
                type: 'error',
                text: 'Usuário não autenticado'
            });
            return;
        }

        setIsLoading(true);

        try {
            const result = await securityService.setPin(profile.id, pin);

            if (result.success) {
                setMessage({
                    type: 'success',
                    text: hasExistingPin ? 'PIN alterado com sucesso!' : 'PIN configurado com sucesso!'
                });
                setPin('');
                setConfirmPin('');
                setHasExistingPin(true);
            } else {
                setMessage({
                    type: 'error',
                    text: result.message
                });
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: 'Erro ao configurar PIN'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-violet-100 dark:bg-violet-900/40 rounded-xl">
                    <Shield className="text-violet-600 dark:text-violet-400" size={28} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                        {hasExistingPin ? 'Alterar PIN de Segurança' : 'Configurar PIN de Segurança'}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {hasExistingPin
                            ? 'Defina um novo PIN para ações sensíveis'
                            : 'Proteja ações críticas com um PIN de 4 a 6 dígitos'
                        }
                    </p>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                    <Lock className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={20} />
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                        <p className="font-bold mb-2">O PIN de segurança será exigido para:</p>
                        <ul className="space-y-1 list-disc list-inside">
                            <li>Estornar pagamentos</li>
                            <li>Aplicar descontos maiores que 5%</li>
                            <li>Excluir pacientes ou registros importantes</li>
                            <li>Aprovar orçamentos com margem abaixo de 20%</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* PIN Input */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        {hasExistingPin ? 'Novo PIN' : 'PIN de Segurança'}
                    </label>
                    <div className="relative">
                        <input
                            type={showPin ? 'text' : 'password'}
                            value={pin}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                setPin(value);
                            }}
                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-center text-2xl tracking-widest font-mono"
                            placeholder="●●●●"
                            maxLength={6}
                            inputMode="numeric"
                            pattern="\d*"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPin(!showPin)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                            {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Digite entre 4 e 6 dígitos numéricos
                    </p>
                </div>

                {/* Confirm PIN Input */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                        Confirmar PIN
                    </label>
                    <input
                        type={showPin ? 'text' : 'password'}
                        value={confirmPin}
                        onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                            setConfirmPin(value);
                        }}
                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-center text-2xl tracking-widest font-mono"
                        placeholder="●●●●"
                        maxLength={6}
                        inputMode="numeric"
                        pattern="\d*"
                    />
                    {confirmPin && pin !== confirmPin && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} />
                            Os PINs não coincidem
                        </p>
                    )}
                    {confirmPin && pin === confirmPin && pin.length >= 4 && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                            <CheckCircle size={12} />
                            PINs coincidem
                        </p>
                    )}
                </div>

                {/* Message */}
                {message && (
                    <div className={`rounded-lg p-3 flex items-center gap-2 text-sm ${message.type === 'success'
                            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
                            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                        }`}>
                        {message.type === 'success' ? (
                            <CheckCircle size={16} className="flex-shrink-0" />
                        ) : (
                            <AlertCircle size={16} className="flex-shrink-0" />
                        )}
                        <span>{message.text}</span>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading || pin.length < 4 || pin !== confirmPin}
                    className="w-full px-4 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    <Shield size={18} />
                    {isLoading
                        ? 'Salvando...'
                        : hasExistingPin
                            ? 'Alterar PIN'
                            : 'Configurar PIN'
                    }
                </button>
            </form>

            {/* Security Note */}
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                    🔒 <strong>Importante:</strong> Guarde seu PIN em local seguro. Após 3 tentativas falhas,
                    o PIN será bloqueado por 15 minutos.
                </p>
            </div>
        </div>
    );
};

export default SetupSecurityPin;
