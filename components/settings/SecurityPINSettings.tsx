import React, { useState, useEffect } from 'react';
import { supabase, getCurrentClinicId } from '../../src/lib/supabase';
import { Shield, Eye, EyeOff, Lock, Check, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const SecurityPINSettings: React.FC = () => {
    const { profile } = useAuth();
    const [currentPIN, setCurrentPIN] = useState('');
    const [newPIN, setNewPIN] = useState('');
    const [confirmPIN, setConfirmPIN] = useState('');
    const [showCurrentPIN, setShowCurrentPIN] = useState(false);
    const [showNewPIN, setShowNewPIN] = useState(false);
    const [showConfirmPIN, setShowConfirmPIN] = useState(false);
    const [loading, setLoading] = useState(false);
    const [clinicId, setClinicId] = useState<string>('');
    const [storedPIN, setStoredPIN] = useState<string>('');

    useEffect(() => {
        loadPIN();
    }, []);

    const loadPIN = async () => {
        try {
            const currentClinicId = await getCurrentClinicId();
            if (!currentClinicId) {
                toast.error('Clínica não encontrada');
                return;
            }
            setClinicId(currentClinicId);

            // Buscar PIN da clínica
            const { data, error } = await supabase
                .from('clinics')
                .select('security_pin')
                .eq('id', currentClinicId)
                .single();

            if (error) throw error;

            setStoredPIN(data?.security_pin || '1234'); // Default PIN
        } catch (error) {
            console.error('Erro ao carregar PIN:', error);
        }
    };

    const handleUpdatePIN = async () => {
        // Validações
        if (!currentPIN) {
            toast.error('Digite o PIN atual');
            return;
        }

        if (currentPIN !== storedPIN) {
            toast.error('PIN atual incorreto');
            return;
        }

        if (!newPIN || newPIN.length !== 4) {
            toast.error('O novo PIN deve ter 4 dígitos');
            return;
        }

        if (newPIN !== confirmPIN) {
            toast.error('Os PINs não coincidem');
            return;
        }

        if (!/^\d{4}$/.test(newPIN)) {
            toast.error('O PIN deve conter apenas números');
            return;
        }

        try {
            setLoading(true);

            const { error } = await supabase
                .from('clinics')
                .update({ security_pin: newPIN })
                .eq('id', clinicId);

            if (error) throw error;

            setStoredPIN(newPIN);
            setCurrentPIN('');
            setNewPIN('');
            setConfirmPIN('');
            toast.success('PIN de segurança atualizado com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar PIN:', error);
            toast.error('Erro ao atualizar PIN de segurança');
        } finally {
            setLoading(false);
        }
    };

    // Verificar se é MASTER ou ADMIN
    const canManagePIN = profile?.role === 'MASTER' || profile?.role === 'ADMIN';

    if (!canManagePIN) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <Shield className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Acesso Restrito
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                    Apenas usuários MASTER ou ADMIN podem gerenciar o PIN de segurança.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Shield className="text-red-600" />
                    PIN de Segurança (S16 Protocol)
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Configure o PIN de 4 dígitos usado para autorizar ações críticas do sistema
                </p>
            </div>

            {/* Info Alert */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                            Quando o PIN é solicitado?
                        </h4>
                        <ul className="text-sm text-amber-800 dark:text-amber-300 mt-2 space-y-1 list-disc list-inside">
                            <li>Cadastro de pacientes duplicados (Duplicity Radar)</li>
                            <li>Exclusão de registros financeiros</li>
                            <li>Alterações em configurações críticas</li>
                            <li>Abertura de caixa em modo Fort Knox</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="space-y-4 max-w-md">
                    {/* Current PIN */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            PIN Atual *
                        </label>
                        <div className="relative">
                            <input
                                type={showCurrentPIN ? 'text' : 'password'}
                                value={currentPIN}
                                onChange={(e) => setCurrentPIN(e.target.value.slice(0, 4))}
                                maxLength={4}
                                placeholder="••••"
                                className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-center text-2xl tracking-widest"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPIN(!showCurrentPIN)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showCurrentPIN ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* New PIN */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Novo PIN (4 dígitos) *
                        </label>
                        <div className="relative">
                            <input
                                type={showNewPIN ? 'text' : 'password'}
                                value={newPIN}
                                onChange={(e) => setNewPIN(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                maxLength={4}
                                placeholder="••••"
                                className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-center text-2xl tracking-widest"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPIN(!showNewPIN)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showNewPIN ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm PIN */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Confirmar Novo PIN *
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPIN ? 'text' : 'password'}
                                value={confirmPIN}
                                onChange={(e) => setConfirmPIN(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                maxLength={4}
                                placeholder="••••"
                                className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-center text-2xl tracking-widest"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPIN(!showConfirmPIN)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showConfirmPIN ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {newPIN && confirmPIN && newPIN === confirmPIN && (
                            <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                                <Check size={12} />
                                PINs coincidem
                            </p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={handleUpdatePIN}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Lock size={18} />
                        {loading ? 'Atualizando...' : 'Atualizar PIN de Segurança'}
                    </button>
                </div>
            </div>

            {/* Security Tips */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200 mb-2">
                    🔐 Dicas de Segurança
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
                    <li>Escolha um PIN que você consiga lembrar, mas não seja óbvio (evite 1234, 0000)</li>
                    <li>Não compartilhe o PIN com pessoas não autorizadas</li>
                    <li>Altere o PIN periodicamente (recomendado: a cada 3 meses)</li>
                    <li>Anote o PIN em local seguro caso esqueça</li>
                </ul>
            </div>
        </div>
    );
};

export default SecurityPINSettings;
