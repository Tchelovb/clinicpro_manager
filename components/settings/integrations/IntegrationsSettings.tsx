import React, { useState, useEffect } from 'react';
import {
    Network,
    Webhook,
    Key,
    Database,
    Plus,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Copy,
    Eye,
    EyeOff
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface WebhookConfig {
    id: string;
    name: string;
    url: string;
    event: string;
    is_active: boolean;
    failure_count: number;
}

interface ApiKey {
    id: string;
    name: string;
    prefix: string;
    created_at: string;
    is_active: boolean;
}

const IntegrationsSettings: React.FC = () => {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'webhooks' | 'api' | 'backup'>('webhooks');

    const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [backupConfig, setBackupConfig] = useState({
        frequency: 'WEEKLY',
        email: '',
        last_backup: null as string | null
    });

    useEffect(() => {
        loadData();
    }, [profile]);

    const loadData = async () => {
        if (!profile?.clinic_id) return;

        try {
            // Carregar Webhooks
            const { data: hooks } = await supabase
                .from('webhooks')
                .select('*')
                .eq('clinic_id', profile.clinic_id);
            setWebhooks(hooks || []);

            // Carregar API Keys
            const { data: keys } = await supabase
                .from('api_keys')
                .select('*')
                .eq('clinic_id', profile.clinic_id);
            setApiKeys(keys || []);

            // Carregar Backup Config
            const { data: clinic } = await supabase
                .from('clinics')
                .select('backup_frequency, backup_email, last_backup_at')
                .eq('id', profile.clinic_id)
                .single();

            if (clinic) {
                setBackupConfig({
                    frequency: clinic.backup_frequency || 'WEEKLY',
                    email: clinic.backup_email || '',
                    last_backup: clinic.last_backup_at
                });
            }

        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateWebhook = () => {
        // Placeholder para modal de criação
        alert('Funcionalidade de criação de webhook será implementada no modal.');
    };

    const generateApiKey = () => {
        // Placeholder para geração de chave
        alert('Funcionalidade de geração de API Key segura.');
    };

    const saveBackupConfig = async () => {
        if (!profile?.clinic_id) return;

        try {
            const { error } = await supabase
                .from('clinics')
                .update({
                    backup_frequency: backupConfig.frequency,
                    backup_email: backupConfig.email
                })
                .eq('id', profile.clinic_id);

            if (error) throw error;
            showMessage('success', 'Configuração de backup salva!');
        } catch (error) {
            showMessage('error', 'Erro ao salvar configuração');
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
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Network className="text-blue-600" size={28} />
                    Integrações e Backup
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Gerencie webhooks, chaves de API e backups automáticos
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

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('webhooks')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'webhooks'
                                ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                    >
                        <Webhook size={18} />
                        Webhooks
                    </button>
                    <button
                        onClick={() => setActiveTab('api')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'api'
                                ? 'border-orange-600 text-orange-600 dark:text-orange-400'
                                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                    >
                        <Key size={18} />
                        API Keys
                    </button>
                    <button
                        onClick={() => setActiveTab('backup')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'backup'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                    >
                        <Database size={18} />
                        Backup Automático
                    </button>
                </div>
            </div>

            {/* Webhooks Tab */}
            {activeTab === 'webhooks' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Seus Webhooks</h3>
                        <button
                            onClick={handleCreateWebhook}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <Plus size={18} />
                            Novo Webhook
                        </button>
                    </div>

                    {webhooks.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                            <Webhook className="mx-auto text-gray-400" size={48} />
                            <p className="text-gray-600 dark:text-gray-400 mt-4">
                                Nenhum webhook configurado
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                Conecte o ClinicPro com Zapier, n8n ou seu próprio sistema
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {webhooks.map(hook => (
                                <div key={hook.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-white">{hook.name}</h4>
                                            <code className="text-xs text-gray-500 mt-1 block">{hook.url}</code>
                                            <div className="flex gap-2 mt-2">
                                                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                                    {hook.event}
                                                </span>
                                                {hook.failure_count > 0 && (
                                                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full flex items-center gap-1">
                                                        <AlertCircle size={10} /> {hook.failure_count} falhas
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button className="text-red-500 hover:text-red-700 p-2">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* API Keys Tab */}
            {activeTab === 'api' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Chaves de API (Desenvolvedor)</h3>
                        <button
                            onClick={generateApiKey}
                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <Plus size={18} />
                            Gerar Nova Chave
                        </button>
                    </div>

                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
                        <p className="text-sm text-orange-800 dark:text-orange-300 flex items-center gap-2">
                            <AlertCircle size={16} />
                            Nunca compartilhe suas chaves de API. Elas dão acesso total aos dados da sua clínica.
                        </p>
                    </div>

                    {apiKeys.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                            <Key className="mx-auto text-gray-400" size={48} />
                            <p className="text-gray-600 dark:text-gray-400 mt-4">
                                Nenhuma chave de API ativa
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {apiKeys.map(key => (
                                <div key={key.id} className="flex justify-between items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <div>
                                        <h4 className="font-medium">{key.name}</h4>
                                        <p className="text-sm text-gray-500 font-mono">{key.prefix}****************</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Ativa</span>
                                        <button className="text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Backup Tab */}
            {activeTab === 'backup' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                                <Database size={24} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Backup Automático
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Receba uma cópia dos seus dados por email periodicamente
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Frequência de Envio
                                </label>
                                <select
                                    value={backupConfig.frequency}
                                    onChange={(e) => setBackupConfig({ ...backupConfig, frequency: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="DAILY">Diário</option>
                                    <option value="WEEKLY">Semanal</option>
                                    <option value="MONTHLY">Mensal</option>
                                    <option value="NEVER">Desativado</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Email de Destino
                                </label>
                                <input
                                    type="email"
                                    value={backupConfig.email}
                                    onChange={(e) => setBackupConfig({ ...backupConfig, email: e.target.value })}
                                    placeholder="ex: backup@suaclinica.com"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="text-sm text-gray-500">
                                Último backup: {backupConfig.last_backup ? new Date(backupConfig.last_backup).toLocaleString() : 'Nunca realizado'}
                            </div>
                            <button
                                onClick={saveBackupConfig}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                            >
                                Salvar Configuração
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IntegrationsSettings;
