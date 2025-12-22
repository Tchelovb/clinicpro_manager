import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp,
    Users,
    DollarSign,
    Target,
    Phone,
    Mail,
    Calendar,
    MessageSquare,
    CheckCircle,
    XCircle,
    Clock,
    Zap,
    Loader
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { highTicketService, HighTicketLead, HighTicketBudget, PipelineStats } from '../services/highTicketService';

export const HighTicketPipeline: React.FC = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'leads' | 'budgets'>('leads');

    const [leads, setLeads] = useState<HighTicketLead[]>([]);
    const [budgets, setBudgets] = useState<HighTicketBudget[]>([]);
    const [stats, setStats] = useState<PipelineStats | null>(null);
    const [selectedScript, setSelectedScript] = useState<any>(null);

    useEffect(() => {
        if (profile?.clinic_id) {
            loadData();
        }
    }, [profile?.clinic_id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const clinicId = profile?.clinic_id!;

            const [leadsData, budgetsData, statsData] = await Promise.all([
                highTicketService.getHighTicketLeads(clinicId),
                highTicketService.getHighTicketBudgets(clinicId),
                highTicketService.getPipelineStats(clinicId)
            ]);

            setLeads(leadsData);
            setBudgets(budgetsData);
            setStats(statsData);
        } catch (error) {
            console.error('Erro ao carregar pipeline:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLeadAction = async (leadId: string, action: 'contact' | 'schedule' | 'convert') => {
        try {
            if (action === 'contact') {
                await highTicketService.updateLeadStatus(leadId, 'CONTACTED');
                await highTicketService.addLeadInteraction(
                    leadId,
                    profile?.id!,
                    'CALL',
                    'Contato realizado via telefone'
                );
            } else if (action === 'schedule') {
                await highTicketService.updateLeadStatus(leadId, 'SCHEDULED');
                navigate('/dashboard/schedule');
            } else if (action === 'convert') {
                const lead = leads.find(l => l.id === leadId);
                if (lead?.patient_id) {
                    navigate(`/budgets/new?patient=${lead.patient_id}`);
                }
            }
            loadData();
        } catch (error) {
            console.error('Erro ao processar ação:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                <Loader className="animate-spin text-purple-500" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pb-20 md:pb-0">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-900 to-orange-900 text-white p-8 shadow-2xl">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Target size={48} className="animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold flex items-center gap-3">
                                Funil High-Ticket
                                <Zap size={28} className="text-yellow-300" />
                            </h1>
                            <p className="text-lg text-orange-100 mt-2">
                                Pipeline de Procedimentos Premium (≥ R$ 5.000)
                            </p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Users size={20} className="text-blue-300" />
                                    <span className="text-white/70 text-sm">Leads Quentes</span>
                                </div>
                                <p className="text-white text-2xl font-bold">{stats.hotLeads}</p>
                            </div>

                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <DollarSign size={20} className="text-green-300" />
                                    <span className="text-white/70 text-sm">Pipeline Total</span>
                                </div>
                                <p className="text-white text-2xl font-bold">
                                    R$ {(stats.totalValue / 1000).toFixed(0)}k
                                </p>
                            </div>

                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Target size={20} className="text-yellow-300" />
                                    <span className="text-white/70 text-sm">Ticket Médio</span>
                                </div>
                                <p className="text-white text-2xl font-bold">
                                    R$ {(stats.avgTicket / 1000).toFixed(1)}k
                                </p>
                            </div>

                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp size={20} className="text-purple-300" />
                                    <span className="text-white/70 text-sm">Conversão</span>
                                </div>
                                <p className="text-white text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</p>
                            </div>

                            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle size={20} className="text-emerald-300" />
                                    <span className="text-white/70 text-sm">Orçamentos</span>
                                </div>
                                <p className="text-white text-2xl font-bold">{stats.totalBudgets}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto p-8">
                {/* Tabs */}
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setActiveTab('leads')}
                        className={`px-6 py-3 rounded-lg font-bold transition-all ${activeTab === 'leads'
                            ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Users size={20} />
                            Leads ({leads.length})
                        </div>
                    </button>

                    <button
                        onClick={() => setActiveTab('budgets')}
                        className={`px-6 py-3 rounded-lg font-bold transition-all ${activeTab === 'budgets'
                            ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <DollarSign size={20} />
                            Orçamentos ({budgets.length})
                        </div>
                    </button>
                </div>

                {/* Leads Tab */}
                {activeTab === 'leads' && (
                    <div className="space-y-4">
                        {leads.length === 0 ? (
                            <div className="bg-gray-800/50 rounded-xl p-12 text-center">
                                <Users size={64} className="mx-auto text-gray-600 mb-4" />
                                <p className="text-gray-400 text-lg">Nenhum lead high-ticket no momento</p>
                                <p className="text-gray-500 text-sm mt-2">
                                    Leads interessados em Cervicoplastia, Lip Lifting e outros procedimentos premium aparecerão aqui
                                </p>
                            </div>
                        ) : (
                            leads.map(lead => (
                                <div
                                    key={lead.id}
                                    className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-amber-500 transition-all"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-white text-xl font-bold">{lead.name}</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${lead.priority === 'HIGH'
                                                    ? 'bg-red-500/20 text-red-300'
                                                    : lead.priority === 'MEDIUM'
                                                        ? 'bg-yellow-500/20 text-yellow-300'
                                                        : 'bg-blue-500/20 text-blue-300'
                                                    }`}>
                                                    {lead.priority === 'HIGH' ? '🔥 QUENTE' : lead.priority === 'MEDIUM' ? '⚡ MORNO' : '❄️ FRIO'}
                                                </span>
                                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300">
                                                    Score: {lead.lead_score}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div className="flex items-center gap-2 text-gray-400">
                                                    <Phone size={16} />
                                                    <span className="text-sm">{lead.phone}</span>
                                                </div>
                                                {lead.email && (
                                                    <div className="flex items-center gap-2 text-gray-400">
                                                        <Mail size={16} />
                                                        <span className="text-sm">{lead.email}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 text-gray-400">
                                                    <Target size={16} />
                                                    <span className="text-sm">{lead.desired_treatment || lead.interest || 'N/A'}</span>
                                                </div>
                                                {lead.value && (
                                                    <div className="flex items-center gap-2 text-green-400">
                                                        <DollarSign size={16} />
                                                        <span className="text-sm font-bold">R$ {lead.value.toLocaleString('pt-BR')}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 text-gray-500 text-xs">
                                                <Clock size={14} />
                                                <span>Criado: {new Date(lead.created_at).toLocaleDateString('pt-BR')}</span>
                                                <span className="mx-2">•</span>
                                                <span>Última interação: {new Date(lead.last_interaction).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2 ml-4">
                                            <button
                                                onClick={() => handleLeadAction(lead.id, 'contact')}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                                            >
                                                <Phone size={16} />
                                                Contatar
                                            </button>
                                            <button
                                                onClick={() => handleLeadAction(lead.id, 'schedule')}
                                                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                                            >
                                                <Calendar size={16} />
                                                Agendar
                                            </button>
                                            <button
                                                onClick={() => handleLeadAction(lead.id, 'convert')}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                                            >
                                                <CheckCircle size={16} />
                                                Orçar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Budgets Tab */}
                {activeTab === 'budgets' && (
                    <div className="space-y-4">
                        {budgets.length === 0 ? (
                            <div className="bg-gray-800/50 rounded-xl p-12 text-center">
                                <DollarSign size={64} className="mx-auto text-gray-600 mb-4" />
                                <p className="text-gray-400 text-lg">Nenhum orçamento high-ticket no momento</p>
                                <p className="text-gray-500 text-sm mt-2">
                                    Orçamentos acima de R$ 5.000 aparecerão aqui
                                </p>
                            </div>
                        ) : (
                            budgets.map(budget => (
                                <div
                                    key={budget.id}
                                    className="bg-gray-800/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-green-500 transition-all cursor-pointer"
                                    onClick={() => navigate(`/dashboard/budgets/${budget.id}`)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-white text-xl font-bold">{budget.patient_name}</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${budget.status === 'APPROVED'
                                                    ? 'bg-green-500/20 text-green-300'
                                                    : budget.status === 'SENT'
                                                        ? 'bg-blue-500/20 text-blue-300'
                                                        : 'bg-gray-500/20 text-gray-300'
                                                    }`}>
                                                    {budget.status === 'APPROVED' ? '✅ APROVADO' :
                                                        budget.status === 'SENT' ? '📧 ENVIADO' :
                                                            '📝 RASCUNHO'}
                                                </span>
                                            </div>

                                            <div className="mb-4">
                                                <p className="text-green-400 text-2xl font-black mb-1">
                                                    R$ {budget.final_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </p>
                                                {budget.discount > 0 && (
                                                    <p className="text-gray-400 text-sm">
                                                        Desconto: R$ {budget.discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-2 mb-3">
                                                {budget.procedures.map((proc, idx) => (
                                                    <span key={idx} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs">
                                                        {proc}
                                                    </span>
                                                ))}
                                            </div>

                                            <div className="flex items-center gap-2 text-gray-500 text-xs">
                                                <Clock size={14} />
                                                <span>Criado: {new Date(budget.created_at).toLocaleDateString('pt-BR')}</span>
                                                <span className="mx-2">•</span>
                                                <span>Atualizado: {new Date(budget.updated_at).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                        </div>

                                        <div className="ml-4">
                                            <button className="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold transition-all">
                                                Ver Detalhes →
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
