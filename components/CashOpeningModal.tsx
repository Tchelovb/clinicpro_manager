import React, { useState } from 'react';
import { X, DollarSign, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CashOpeningModalProps {
    onClose: () => void;
    onSuccess: () => void;
    defaultAmount?: number;
    isBlocking?: boolean; // Se true, não pode fechar sem abrir caixa
}

export default function CashOpeningModal({
    onClose,
    onSuccess,
    defaultAmount = 100,
    isBlocking = false
}: CashOpeningModalProps) {
    const [openingBalance, setOpeningBalance] = useState(defaultAmount);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleOpenCash = async () => {
        try {
            setLoading(true);
            setError(null);

            // Buscar usuário atual
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            // Buscar clinic_id do usuário
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('clinic_id')
                .eq('id', user.id)
                .single();

            if (userError) throw userError;

            // Criar sessão de caixa
            const { data, error: insertError } = await supabase
                .from('cash_registers')
                .insert({
                    clinic_id: userData.clinic_id,
                    user_id: user.id,
                    opening_balance: openingBalance,
                    calculated_balance: openingBalance,
                    status: 'OPEN'
                })
                .select()
                .single();

            if (insertError) throw insertError;

            console.log('✅ Caixa aberto com sucesso:', data);
            onSuccess();
        } catch (err: any) {
            console.error('❌ Erro ao abrir caixa:', err);
            setError(err.message || 'Erro ao abrir caixa');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                Abertura de Caixa
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {isBlocking ? 'Obrigatório para continuar' : 'Iniciar novo caixa'}
                            </p>
                        </div>
                    </div>
                    {!isBlocking && (
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {isBlocking && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-yellow-800 dark:text-yellow-200">
                                <p className="font-semibold">Atenção!</p>
                                <p>Você precisa abrir o caixa antes de realizar movimentações financeiras.</p>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Saldo Inicial / Fundo de Troco
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                                R$
                            </span>
                            <input
                                type="number"
                                value={openingBalance}
                                onChange={(e) => setOpeningBalance(Number(e.target.value))}
                                step="0.01"
                                min="0"
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-semibold"
                                placeholder="100.00"
                                autoFocus
                            />
                        </div>
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            Informe o valor em dinheiro que você tem no caixa para iniciar o dia
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-800 dark:text-red-200">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 justify-end p-6 border-t border-gray-200 dark:border-gray-700">
                    {!isBlocking && (
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                    )}
                    <button
                        onClick={handleOpenCash}
                        disabled={loading || openingBalance < 0}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Abrindo...
                            </>
                        ) : (
                            <>
                                <DollarSign className="w-4 h-4" />
                                Abrir Caixa
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
