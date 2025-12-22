import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User, Phone, Mail, Target, Calendar, MessageSquare, X, ArrowLeft, Edit2, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Lead {
    id: string;
    name: string;
    phone: string;
    email?: string;
    source: string;
    status: string;
    desired_treatment?: string;
    priority: string;
    created_at: string;
    last_interaction: string;
    notes?: string;
    lead_score: number;
}

const LeadDetail: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { profile } = useAuth();

    const [loading, setLoading] = useState(true);
    const [lead, setLead] = useState<Lead | null>(null);

    useEffect(() => {
        if (id) {
            loadLead();
        }
    }, [id]);

    const loadLead = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .eq('id', id)
                .eq('clinic_id', profile?.clinic_id)
                .single();

            if (error) throw error;
            setLead(data);
        } catch (error) {
            console.error('Erro ao carregar lead:', error);
            toast.error('Erro ao carregar lead');
            navigate('/pipeline');
        } finally {
            setLoading(false);
        }
    };

    const getPriorityConfig = (priority: string) => {
        switch (priority) {
            case 'HIGH':
                return { label: '🔥 Alta', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
            case 'MEDIUM':
                return { label: '⚡ Média', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
            default:
                return { label: '📌 Baixa', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };
        }
    };

    const getStatusConfig = (status: string) => {
        const configs: Record<string, any> = {
            'NEW': { label: 'Novo Lead', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
            'CONTACTED': { label: 'Em Contato', bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
            'SCHEDULED': { label: 'Agendado', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
            'BUDGET_CREATED': { label: 'Orçamento Enviado', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
            'WON': { label: 'Fechado ✨', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
            'LOST': { label: 'Perdido', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' }
        };
        return configs[status] || configs['NEW'];
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] animate-pulse">
                <Loader2 className="w-12 h-12 text-violet-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Carregando lead...</p>
            </div>
        );
    }

    if (!lead) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                <p className="text-slate-500">Lead não encontrado</p>
                <button
                    onClick={() => navigate('/pipeline')}
                    className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                >
                    Voltar para Pipeline
                </button>
            </div>
        );
    }

    const priorityConfig = getPriorityConfig(lead.priority);
    const statusConfig = getStatusConfig(lead.status);

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/pipeline')}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={24} className="text-slate-400" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
                            {lead.name}
                        </h1>
                        <p className="text-slate-500 mt-1">Lead #{id?.substring(0, 8)}</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate(`/pipeline/leads/${id}/edit`)}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium shadow-sm"
                >
                    <Edit2 size={18} />
                    Editar
                </button>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column - Lead Info */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Contact Info Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Informações de Contato</h3>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Phone size={18} className="text-slate-400" />
                                <span className="text-slate-700">{lead.phone}</span>
                            </div>
                            {lead.email && (
                                <div className="flex items-center gap-3">
                                    <Mail size={18} className="text-slate-400" />
                                    <span className="text-slate-700">{lead.email}</span>
                                </div>
                            )}
                            {lead.desired_treatment && (
                                <div className="flex items-center gap-3">
                                    <Target size={18} className="text-slate-400" />
                                    <span className="text-slate-700">{lead.desired_treatment}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notes Card */}
                    {lead.notes && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Observações</h3>
                            <p className="text-slate-600 whitespace-pre-wrap">{lead.notes}</p>
                        </div>
                    )}

                    {/* Timeline Placeholder */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <MessageSquare size={20} />
                            Histórico de Interações
                        </h3>
                        <div className="text-center py-8 text-slate-400">
                            <MessageSquare size={48} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Nenhuma interação registrada ainda</p>
                            <p className="text-xs mt-1">Em breve: timeline completa de ações</p>
                        </div>
                    </div>
                </div>

                {/* Right Column - Status & Actions */}
                <div className="space-y-6">

                    {/* Status Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Status</h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-slate-500 mb-2">Etapa Atual</p>
                                <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                                    <CheckCircle size={14} />
                                    {statusConfig.label}
                                </span>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-2">Prioridade</p>
                                <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold border ${priorityConfig.bg} ${priorityConfig.text} ${priorityConfig.border}`}>
                                    {priorityConfig.label}
                                </span>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-2">Origem</p>
                                <span className="text-sm text-slate-700">{lead.source}</span>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-2">Lead Score</p>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="bg-violet-600 h-full rounded-full transition-all"
                                            style={{ width: `${lead.lead_score}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700">{lead.lead_score}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dates Card */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Datas</h3>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Criado em</p>
                                <p className="text-sm text-slate-700">
                                    {new Date(lead.created_at).toLocaleDateString('pt-BR', {
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 mb-1">Última Interação</p>
                                <p className="text-sm text-slate-700">
                                    {new Date(lead.last_interaction).toLocaleDateString('pt-BR', {
                                        day: '2-digit',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Ações Rápidas</h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`, '_blank')}
                                className="w-full px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                            >
                                <MessageSquare size={16} />
                                WhatsApp
                            </button>
                            <button
                                onClick={() => window.location.href = `tel:${lead.phone}`}
                                className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                            >
                                <Phone size={16} />
                                Ligar
                            </button>
                            <button
                                onClick={() => navigate('/agenda/new')}
                                className="w-full px-4 py-2 bg-violet-50 text-violet-700 rounded-lg hover:bg-violet-100 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                            >
                                <Calendar size={16} />
                                Agendar Avaliação
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeadDetail;
