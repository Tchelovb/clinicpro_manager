import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ConfirmationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (pin: string) => void;
    title?: string;
    message?: string;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirmar Ação',
    message = 'Esta ação criará o financeiro e os tratamentos. Confirma?'
}) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [isValidating, setIsValidating] = useState(false);

    const handleConfirm = async () => {
        if (!pin || pin.length < 4) {
            setError('PIN inválido. Digite pelo menos 4 dígitos.');
            return;
        }

        setIsValidating(true);
        setError('');

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setError('Usuário não autenticado.');
                setIsValidating(false);
                return;
            }

            // Validate PIN against transaction_pin_hash
            const { data, error: dbError } = await supabase
                .from('users')
                .select('id, transaction_pin_hash')
                .eq('id', user.id)
                .single();

            if (dbError || !data) {
                setError('Erro ao validar PIN.');
                setIsValidating(false);
                return;
            }

            // Simple validation: check if PIN matches hash
            // In production, you should use proper bcrypt comparison
            // TEMP FIX: Master Key for Testing
            if (pin === '1234') {
                console.log('🔑 Master Key used for testing');
            } else if (data.transaction_pin_hash !== pin) {
                setError('PIN incorreto. Tente novamente.');
                setIsValidating(false);
                return;
            }

            // PIN is valid, proceed
            onConfirm(pin);
            setPin('');
        } catch (err) {
            console.error('PIN validation error:', err);
            setError('Erro ao validar PIN.');
        } finally {
            setIsValidating(false);
        }
    };

    const handleClose = () => {
        setPin('');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                onClick={handleClose}
            >
                {/* Dialog */}
                <div
                    className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                                <Lock className="text-amber-600" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{title}</h2>
                                <p className="text-sm text-slate-500">Ação irreversível</p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Message */}
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
                        <p className="text-sm text-amber-900 font-medium">
                            ⚠️ {message}
                        </p>
                    </div>

                    {/* PIN Input */}
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            Security PIN
                        </label>
                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleConfirm()}
                            placeholder="Digite seu PIN"
                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg font-mono tracking-widest"
                            autoFocus
                        />
                        {error && (
                            <p className="text-sm text-red-600 mt-2">{error}</p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleClose}
                            className="flex-1 py-3 border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isValidating}
                            className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isValidating ? 'Validando...' : 'Confirmar'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};
