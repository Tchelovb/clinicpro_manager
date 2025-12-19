import React, { useState, useEffect } from 'react';
import { Lock, Clock, Shield, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface SessionSettings {
    auto_logout_minutes: number;
    require_password_on_unlock: boolean;
    enable_audit_log: boolean;
    max_failed_login_attempts: number;
    lockout_duration_minutes: number;
}

const SessionSettings: React.FC = () => {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [settings, setSettings] = useState<SessionSettings>({
        auto_logout_minutes: 30,
        require_password_on_unlock: true,
        enable_audit_log: true,
        max_failed_login_attempts: 5,
        lockout_duration_minutes: 15
    });

    useEffect(() => {
        loadSettings();
    }, [profile]);

    const loadSettings = async () => {
        if (!profile?.clinic_id) return;

        try {
            const { data, error } = await supabase
                .from('clinics')
                .select('auto_logout_minutes, require_password_on_unlock, enable_audit_log, max_failed_login_attempts, lockout_duration_minutes')
                .eq('id', profile.clinic_id)
                .single();

            if (error) throw error;

            if (data) {
                setSettings({
                    auto_logout_minutes: data.auto_logout_minutes || 30,
                    require_password_on_unlock: data.require_password_on_unlock ?? true,
                    enable_audit_log: data.enable_audit_log ?? true,
                    max_failed_login_attempts: data.max_failed_login_attempts || 5,
                    lockout_duration_minutes: data.lockout_duration_minutes || 15
                });
            }
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
            showMessage('error', 'Erro ao carregar configurações');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!profile?.clinic_id) return;

        setSaving(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('clinics')
                .update({
                    auto_logout_minutes: settings.auto_logout_minutes,
                    require_password_on_unlock: settings.require_password_on_unlock,
                    enable_audit_log: settings.enable_audit_log,
                    max_failed_login_attempts: settings.max_failed_login_attempts,
                    lockout_duration_minutes: settings.lockout_duration_minutes
                })
                .eq('id', profile.clinic_id);

            if (error) throw error;

            showMessage('success', 'Configurações salvas com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            showMessage('error', 'Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Lock className="text-blue-600" size={28} />
                    Segurança e Sessão
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Configure o comportamento de segurança e sessões do sistema
                </p>
            </div>

            {/* Message Alert */}
            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <span>{message.text}</span>
                </div>
            )}

            {/* Auto-Logout Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
                <div className="flex items-center gap-3">
                    <Clock className="text-blue-600" size={24} />
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Logout Automático
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Sistema faz logout automaticamente após período de inatividade
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tempo de Inatividade (minutos)
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="5"
                                max="120"
                                step="5"
                                value={settings.auto_logout_minutes}
                                onChange={(e) => setSettings({ ...settings, auto_logout_minutes: Number(e.target.value) })}
                                className="flex-1"
                            />
                            <div className="w-20 text-center">
                                <span className="text-2xl font-bold text-blue-600">{settings.auto_logout_minutes}</span>
                                <span className="text-sm text-gray-500 ml-1">min</span>
                            </div>
                        </div>
                        <div className="mt-2 flex justify-between text-xs text-gray-500">
                            <span>5 min</span>
                            <span>30 min</span>
                            <span>60 min</span>
                            <span>120 min</span>
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                            💡 <strong>Recomendação:</strong> Para ambientes com alta movimentação de pessoas, use 15-30 minutos.
                            Para consultórios privados, pode usar até 60 minutos.
                        </p>
                    </div>
                </div>
            </div>

            {/* Screen Lock Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
                <div className="flex items-center gap-3">
                    <Shield className="text-blue-600" size={24} />
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Bloqueio Rápido de Tela
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Permite bloquear a tela rapidamente quando necessário
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                                Exigir senha ao desbloquear
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Usuário precisa digitar a senha para desbloquear a tela
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.require_password_on_unlock}
                                onChange={(e) => setSettings({ ...settings, require_password_on_unlock: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <p className="text-sm text-yellow-800 dark:text-yellow-300">
                            ⚡ <strong>Atalho:</strong> Pressione <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono">Ctrl + L</kbd> para bloquear a tela rapidamente
                        </p>
                    </div>
                </div>
            </div>

            {/* Audit Log Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
                <div className="flex items-center gap-3">
                    <Shield className="text-blue-600" size={24} />
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Registro de Auditoria
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Registra todas as ações realizadas no sistema
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                                Habilitar Audit Log
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Registra criações, atualizações e exclusões de dados
                            </p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.enable_audit_log}
                                onChange={(e) => setSettings({ ...settings, enable_audit_log: e.target.checked })}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <p className="text-sm text-green-800 dark:text-green-300">
                            ✅ <strong>Recomendado:</strong> Manter sempre ativado para rastreabilidade e conformidade com LGPD
                        </p>
                    </div>
                </div>
            </div>

            {/* Login Security Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
                <div className="flex items-center gap-3">
                    <Lock className="text-blue-600" size={24} />
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Proteção contra Força Bruta
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Bloqueia tentativas excessivas de login
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Máximo de Tentativas Falhadas
                        </label>
                        <input
                            type="number"
                            min="3"
                            max="10"
                            value={settings.max_failed_login_attempts}
                            onChange={(e) => setSettings({ ...settings, max_failed_login_attempts: Number(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Após {settings.max_failed_login_attempts} tentativas incorretas, a conta será bloqueada
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Duração do Bloqueio (minutos)
                        </label>
                        <input
                            type="number"
                            min="5"
                            max="60"
                            step="5"
                            value={settings.lockout_duration_minutes}
                            onChange={(e) => setSettings({ ...settings, lockout_duration_minutes: Number(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Conta ficará bloqueada por {settings.lockout_duration_minutes} minutos
                        </p>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {saving ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Salvando...
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            Salvar Configurações
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default SessionSettings;
