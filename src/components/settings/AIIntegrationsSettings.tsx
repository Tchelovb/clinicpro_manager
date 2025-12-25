import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { SystemSettingSafe } from '../../types/database';
import { Save, Key, Bot, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';

export const AIIntegrationsSettings = () => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [settings, setSettings] = useState({
        gemini_api_key: '',
        whatsapp_api_url: '',
        whatsapp_api_key: '',
        whatsapp_instance_name: '',
    });

    // Carregar configurações ao montar
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('view_system_settings_safe')
                .select('key, value')
                .in('key', [
                    'gemini_api_key',
                    'whatsapp_api_url',
                    'whatsapp_api_key',
                    'whatsapp_instance_name'
                ]);

            if (error) throw error;

            // Converter array para objeto
            const settingsObj: any = {};
            data?.forEach((item: SystemSettingSafe) => {
                settingsObj[item.key] = item.value;
            });

            setSettings({
                gemini_api_key: settingsObj.gemini_api_key || '',
                whatsapp_api_url: settingsObj.whatsapp_api_url || '',
                whatsapp_api_key: settingsObj.whatsapp_api_key || '',
                whatsapp_instance_name: settingsObj.whatsapp_instance_name || '',
            });
        } catch (error: any) {
            console.error('Erro ao carregar configurações:', error);
            setMessage({ type: 'error', text: 'Erro ao carregar configurações' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        try {
            // Salvar cada configuração usando a função do banco
            const updates = Object.entries(settings).map(([key, value]) => {
                if (!value || value.startsWith('••••')) return null; // Não salvar se vazio ou mascarado

                return supabase.rpc('update_system_setting', {
                    setting_key: key,
                    setting_value: value,
                    setting_description: getDescription(key)
                });
            }).filter(Boolean);

            const results = await Promise.all(updates);

            // Verificar se houve erros
            const hasError = results.some(r => r?.error);
            if (hasError) {
                throw new Error('Erro ao salvar algumas configurações');
            }

            setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });

            // Recarregar para mostrar valores mascarados
            setTimeout(() => {
                loadSettings();
            }, 1000);

        } catch (error: any) {
            console.error('Erro ao salvar:', error);
            setMessage({ type: 'error', text: error.message || 'Erro ao salvar configurações' });
        } finally {
            setSaving(false);
        }
    };

    const getDescription = (key: string): string => {
        const descriptions: Record<string, string> = {
            gemini_api_key: 'Chave API do Google Gemini para IA',
            whatsapp_api_url: 'URL da Evolution API (WhatsApp)',
            whatsapp_api_key: 'Chave de autenticação da Evolution API',
            whatsapp_instance_name: 'Nome da instância WhatsApp conectada',
        };
        return descriptions[key] || '';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="border-b border-gray-200 pb-4">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Bot className="w-6 h-6 text-blue-600" />
                    Integrações & IA
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                    Configure as chaves de API para habilitar os agentes autônomos
                </p>
            </div>

            {/* Mensagem de feedback */}
            {message && (
                <div className={`flex items-center gap-2 p-4 rounded-lg ${message.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                    {message.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5" />
                    ) : (
                        <AlertCircle className="w-5 h-5" />
                    )}
                    <span className="text-sm font-medium">{message.text}</span>
                </div>
            )}

            {/* Formulário */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="p-6 space-y-6">

                    {/* Gemini API */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                            <Key className="w-4 h-4 text-purple-600" />
                            Google Gemini API Key
                        </label>
                        <input
                            type="text"
                            value={settings.gemini_api_key}
                            onChange={(e) => setSettings({ ...settings, gemini_api_key: e.target.value })}
                            placeholder="AIza..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500">
                            Obtenha em: <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a>
                        </p>
                    </div>

                    {/* Divisor */}
                    <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-4">
                            <MessageSquare className="w-4 h-4 text-green-600" />
                            WhatsApp (Evolution API)
                        </h3>
                    </div>

                    {/* WhatsApp URL */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            URL da Evolution API
                        </label>
                        <input
                            type="text"
                            value={settings.whatsapp_api_url}
                            onChange={(e) => setSettings({ ...settings, whatsapp_api_url: e.target.value })}
                            placeholder="https://api-whatsapp.seudominio.com"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* WhatsApp API Key */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            API Key da Evolution
                        </label>
                        <input
                            type="text"
                            value={settings.whatsapp_api_key}
                            onChange={(e) => setSettings({ ...settings, whatsapp_api_key: e.target.value })}
                            placeholder="DrMarceloSecretKey123456"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* WhatsApp Instance Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            Nome da Instância
                        </label>
                        <input
                            type="text"
                            value={settings.whatsapp_instance_name}
                            onChange={(e) => setSettings({ ...settings, whatsapp_instance_name: e.target.value })}
                            placeholder="clinicpro-bot"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500">
                            Nome da instância criada na Evolution API
                        </p>
                    </div>

                </div>

                {/* Footer com botão salvar */}
                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-lg flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Salvando...' : 'Salvar Configurações'}
                    </button>
                </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Segurança das Chaves</p>
                        <p className="text-blue-700">
                            As chaves são armazenadas de forma segura no banco de dados e mascaradas ao serem exibidas.
                            Apenas atualize os campos se precisar alterar as chaves.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
