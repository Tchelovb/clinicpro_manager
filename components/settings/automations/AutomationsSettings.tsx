import React, { useState, useEffect } from 'react';
import {
    Bell,
    MessageCircle,
    Mail,
    Clock,
    Gift,
    CalendarDays,
    CheckCircle2,
    AlertCircle,
    Save,
    Play
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface NotificationTemplate {
    id: string;
    name: string;
    trigger_event: string;
    channel_type: 'WHATSAPP' | 'EMAIL' | 'SMS';
    content: string;
    is_active: boolean;
    schedule_offset_minutes?: number;
}

const AutomationsSettings: React.FC = () => {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'whatsapp' | 'email'>('whatsapp');

    const [templates, setTemplates] = useState<NotificationTemplate[]>([]);

    useEffect(() => {
        loadTemplates();
    }, [profile]);

    const loadTemplates = async () => {
        if (!profile?.clinic_id) return;

        try {
            const { data, error } = await supabase
                .from('notification_templates')
                .select('*')
                .eq('clinic_id', profile.clinic_id)
                .order('name');

            if (error) throw error;
            setTemplates(data || []);
        } catch (error) {
            console.error('Erro ao carregar templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateTemplate = (id: string, updates: Partial<NotificationTemplate>) => {
        setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const handleSaveAll = async () => {
        if (!profile?.clinic_id) return;
        setSaving(true);
        setMessage(null);

        try {
            // Atualizar todos os templates modificados
            const updates = templates.map(t =>
                supabase
                    .from('notification_templates')
                    .update({
                        content: t.content,
                        is_active: t.is_active,
                        schedule_offset_minutes: t.schedule_offset_minutes
                    })
                    .eq('id', t.id)
            );

            await Promise.all(updates);
            showMessage('success', 'Automações salvas com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar:', error);
            showMessage('error', 'Erro ao salvar alterações');
        } finally {
            setSaving(false);
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 5000);
    };

    const getEventIcon = (event: string) => {
        switch (event) {
            case 'APPOINTMENT_CREATED': return <CheckCircle2 size={20} className="text-green-500" />;
            case 'APPOINTMENT_REMINDER': return <Clock size={20} className="text-orange-500" />;
            case 'BIRTHDAY': return <Gift size={20} className="text-pink-500" />;
            case 'RECALL_6_MONTHS': return <CalendarDays size={20} className="text-blue-500" />;
            default: return <Bell size={20} className="text-gray-500" />;
        }
    };

    const getEventLabel = (event: string) => {
        const labels: Record<string, string> = {
            'APPOINTMENT_CREATED': 'Confirmação de Agendamento',
            'APPOINTMENT_REMINDER': 'Lembrete Automático',
            'BIRTHDAY': 'Aniversário do Paciente',
            'RECALL_6_MONTHS': 'Retorno Periódico',
            'APPOINTMENT_MISSED': 'Paciente Faltou'
        };
        return labels[event] || event;
    };

    const getFilteredTemplates = (channel: string) => {
        return templates.filter(t => t.channel_type === channel);
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
                    <Bell className="text-blue-600" size={28} />
                    Notificações e Automações
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Configure mensagens automáticas via WhatsApp e Email para seus pacientes
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
                        onClick={() => setActiveTab('whatsapp')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'whatsapp'
                                ? 'border-green-600 text-green-600 dark:text-green-400'
                                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                    >
                        <MessageCircle size={18} />
                        WhatsApp
                    </button>
                    <button
                        onClick={() => setActiveTab('email')}
                        className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${activeTab === 'email'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                    >
                        <Mail size={18} />
                        Email
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-6">
                {/* Status Card */}
                <div className={`p-4 rounded-lg border flex justify-between items-center ${activeTab === 'whatsapp'
                        ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800'
                        : 'bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800'
                    }`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${activeTab === 'whatsapp' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                            }`}>
                            {activeTab === 'whatsapp' ? <MessageCircle size={24} /> : <Mail size={24} />}
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                Status do Serviço: <span className="text-green-600">Ativo</span>
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {activeTab === 'whatsapp'
                                    ? 'Integração via API Oficial (Simulada)'
                                    : 'Envio via SendGrid (Simulado)'}
                            </p>
                        </div>
                    </div>
                    <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 transition-colors text-sm font-medium">
                        Configurar Credenciais
                    </button>
                </div>

                {/* Templates List */}
                <div className="grid gap-6">
                    {getFilteredTemplates(activeTab.toUpperCase()).map((template) => (
                        <div key={template.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                                        {getEventIcon(template.trigger_event)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                                            {getEventLabel(template.trigger_event)}
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Gatilho: {template.trigger_event}
                                        </p>
                                    </div>
                                </div>

                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={template.is_active}
                                        onChange={(e) => handleUpdateTemplate(template.id, { is_active: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-${activeTab === 'whatsapp' ? 'green' : 'blue'}-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-${activeTab === 'whatsapp' ? 'green' : 'blue'}-600`}></div>
                                </label>
                            </div>

                            {/* Message Editor */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Mensagem
                                </label>
                                <textarea
                                    value={template.content}
                                    onChange={(e) => handleUpdateTemplate(template.id, { content: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Olá {{PATIENT_NAME}}..."
                                    disabled={!template.is_active}
                                />
                                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{'{{PATIENT_NAME}}'}</span>
                                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{'{{APPOINTMENT_DATE}}'}</span>
                                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{'{{APPOINTMENT_TIME}}'}</span>
                                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{'{{PROFESSIONAL_NAME}}'}</span>
                                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{'{{CLINIC_NAME}}'}</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {getFilteredTemplates(activeTab.toUpperCase()).length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500">Nenhum template configurado para este canal.</p>
                            <button className="mt-4 text-blue-600 hover:text-blue-700 font-medium">
                                + Criar novo template
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Save Button */}
            <div className="sticky bottom-6 flex justify-end">
                <button
                    onClick={handleSaveAll}
                    disabled={saving}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Salvando...
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            Salvar Alterações
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default AutomationsSettings;
