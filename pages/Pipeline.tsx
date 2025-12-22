import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp, Users, DollarSign, Target, Phone, Mail, Calendar,
    CheckCircle, XCircle, Clock, Zap, MessageSquare, MoreVertical,
    Filter, AlertCircle, Plus, Crown, Star, Sparkles, Instagram,
    Briefcase, ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { highTicketService, HighTicketLead, PipelineStats } from '../services/highTicketService';
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { cn } from "../lib/utils";

// Status Columns Configuration (High-Ticket Flow)
const COLUMNS = [
    {
        id: 'NEW',
        label: 'Novo Lead',
        color: 'border-blue-500',
        bg: 'bg-blue-50',
        icon: Sparkles,
        description: 'Leads recém-capturados'
    },
    {
        id: 'CONTACT',
        label: 'Em Contato',
        color: 'border-violet-500',
        bg: 'bg-violet-50',
        icon: MessageSquare,
        description: 'Primeiro contato realizado'
    },
    {
        id: 'SCHEDULED',
        label: 'Avaliação Agendada',
        color: 'border-teal-500',
        bg: 'bg-teal-50',
        icon: Calendar,
        description: 'Consulta marcada'
    },
    {
        id: 'PROPOSAL',
        label: 'Orçamento Enviado',
        color: 'border-amber-500',
        bg: 'bg-amber-50',
        icon: DollarSign,
        description: 'Proposta em análise'
    },
    {
        id: 'WON',
        label: 'Fechado ✨',
        color: 'border-green-500',
        bg: 'bg-green-50',
        icon: CheckCircle,
        description: 'Orçamento aprovado'
    },
    {
        id: 'LOST',
        label: 'Perdido',
        color: 'border-slate-400',
        bg: 'bg-slate-50',
        icon: XCircle,
        description: 'Não convertido'
    },
];

// Priority Badge Configuration
const getPriorityConfig = (priority: string) => {
    switch (priority) {
        case 'HIGH':
            return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', label: 'Alta 🔥' };
        case 'MEDIUM':
            return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Média ⚡' };
        default:
            return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', label: 'Normal' };
    }
};

// Value Tier Badge (DIAMOND, GOLD, STANDARD)
const getValueTier = (value: number) => {
    if (value >= 10000) return { label: 'DIAMOND', icon: Crown, color: 'text-purple-600', bg: 'bg-purple-50' };
    if (value >= 5000) return { label: 'GOLD', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' };
    return { label: 'STANDARD', icon: Target, color: 'text-slate-500', bg: 'bg-slate-50' };
};

export const PipelinePage: React.FC = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [leads, setLeads] = useState<HighTicketLead[]>([]);
    const [stats, setStats] = useState<PipelineStats | null>(null);

    // Filter State
    const [filterPriority, setFilterPriority] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');

    useEffect(() => {
        if (profile?.clinic_id) {
            loadData();
        }
    }, [profile?.clinic_id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const clinicId = profile?.clinic_id!;
            const [leadsData, , statsData] = await Promise.all([
                highTicketService.getHighTicketLeads(clinicId),
                highTicketService.getHighTicketBudgets(clinicId),
                highTicketService.getPipelineStats(clinicId)
            ]);
            setLeads(leadsData);
            setStats(statsData);
        } catch (error) {
            console.error('Erro ao carregar pipeline:', error);
        } finally {
            setLoading(false);
        }
    };

    // Drag & Drop Logic
    const [draggedLead, setDraggedLead] = useState<HighTicketLead | null>(null);

    const handleDragStart = (lead: HighTicketLead) => {
        setDraggedLead(lead);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (status: string) => {
        if (draggedLead && draggedLead.status !== status) {
            try {
                // Optimistic UI update
                const updatedLeads = leads.map(l =>
                    l.id === draggedLead.id ? { ...l, status: status as any } : l
                );
                setLeads(updatedLeads);

                // API Update
                await highTicketService.updateLeadStatus(draggedLead.id, status as any);
            } catch (error) {
                console.error('Erro ao mover card:', error);
                loadData(); // Revert on error
            }
        }
        setDraggedLead(null);
    };

    const filteredLeads = leads.filter(l =>
        filterPriority === 'ALL' || l.priority === filterPriority
    );

    // Loading State
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] animate-pulse">
                <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Carregando pipeline...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] space-y-6">

            {/* ============================================ */}
            {/* HEADER */}
            {/* ============================================ */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                        <Sparkles className="text-amber-600" size={32} />
                        Pipeline High-Ticket
                    </h1>
                    <p className="text-slate-500 mt-2">Funil de conversão de procedimentos premium</p>
                </div>
                <Button
                    onClick={() => navigate('/pipeline/leads/new')}
                    className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
                >
                    <Plus size={18} className="mr-2" />
                    Novo Lead
                </Button>
            </div>

            {/* ============================================ */}
            {/* KPI CARDS */}
            {/* ============================================ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Pipeline Total */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-violet-50 rounded-lg">
                            <DollarSign className="text-violet-600" size={20} />
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Pipeline Total</p>
                    </div>
                    <p className="text-2xl font-bold text-violet-600">
                        {stats ? `R$ ${(stats.totalValue / 1000).toFixed(1)}k` : '...'}
                    </p>
                </div>

                {/* Leads Quentes */}
                <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="p-1.5 bg-rose-50 rounded text-rose-600">
                                    <Zap size={16} />
                                </span>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Leads Quentes</span>
                            </div>
                            <p className="text-2xl font-bold text-rose-600">{stats?.hotLeads || 0}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Taxa de Conversão */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-teal-50 rounded-lg">
                            <TrendingUp className="text-teal-600" size={20} />
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Conversão</p>
                    </div>
                    <p className="text-2xl font-bold text-teal-600">
                        {stats?.conversionRate.toFixed(1) || 0}%
                    </p>
                </div>

                {/* Total de Leads */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Users className="text-blue-600" size={20} />
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase">Total Leads</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                        {leads.length}
                    </p>
                </div>
            </div>

            {/* ============================================ */}
            {/* FILTERS */}
            {/* ============================================ */}
            <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm w-fit">
                <button
                    onClick={() => setFilterPriority('ALL')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filterPriority === 'ALL'
                        ? 'bg-violet-50 text-violet-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Todos
                </button>
                <button
                    onClick={() => setFilterPriority('HIGH')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filterPriority === 'HIGH'
                        ? 'bg-rose-50 text-rose-700 shadow-sm'
                        : 'text-slate-500 hover:text-rose-600'
                        }`}
                >
                    Alta 🔥
                </button>
                <button
                    onClick={() => setFilterPriority('MEDIUM')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filterPriority === 'MEDIUM'
                        ? 'bg-amber-50 text-amber-700 shadow-sm'
                        : 'text-slate-500 hover:text-amber-600'
                        }`}
                >
                    Média ⚡
                </button>
            </div>

            {/* ============================================ */}
            {/* KANBAN BOARD */}
            {/* ============================================ */}
            <div className="flex-1 overflow-x-auto pb-4">
                <div className="flex gap-4 min-w-[1400px] h-full">
                    {COLUMNS.map(col => {
                        const Icon = col.icon;
                        const columnLeads = filteredLeads.filter(l => l.status === col.id);

                        return (
                            <div
                                key={col.id}
                                className={`flex flex-col flex-1 min-w-[280px] bg-white rounded-xl border-t-4 ${col.color} shadow-sm`}
                                onDragOver={handleDragOver}
                                onDrop={() => handleDrop(col.id)}
                            >
                                {/* Column Header */}
                                <div className="p-4 border-b border-slate-100">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <Icon size={18} className={col.id === 'WON' ? 'text-green-600' : 'text-slate-600'} />
                                            <span className={`font-bold ${col.id === 'WON' ? 'text-green-700' : 'text-slate-700'}`}>
                                                {col.label}
                                            </span>
                                        </div>
                                        <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                                            {columnLeads.length}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500">{col.description}</p>
                                </div>

                                {/* Cards Container */}
                                <div className="p-3 flex-1 overflow-y-auto space-y-3 bg-slate-50/50">
                                    {columnLeads.length > 0 ? (
                                        columnLeads.map(lead => {
                                            const priorityConfig = getPriorityConfig(lead.priority);
                                            const valueTier = lead.value ? getValueTier(lead.value) : null;
                                            const TierIcon = valueTier?.icon;

                                            return (
                                                <div
                                                    key={lead.id}
                                                    draggable
                                                    onDragStart={() => handleDragStart(lead)}
                                                    className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all group"
                                                >
                                                    {/* Card Header */}
                                                    <div className="flex justify-between items-start mb-3">
                                                        <h4 className="font-bold text-slate-800 text-sm truncate pr-2 flex-1">
                                                            {lead.name}
                                                        </h4>
                                                        <button className="text-slate-300 hover:text-violet-600 transition-colors opacity-0 group-hover:opacity-100">
                                                            <MoreVertical size={16} />
                                                        </button>
                                                    </div>

                                                    {/* Value & Tier Badge */}
                                                    {lead.value && valueTier && (
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <Badge variant="outline" className={`gap-1 ${valueTier.bg} ${valueTier.color} border-${valueTier.color.replace('text-', '')}-200`}>
                                                                {TierIcon && <TierIcon size={10} />}
                                                                {valueTier.label}
                                                            </Badge>
                                                            <div className="flex items-center text-teal-600 text-sm font-bold">
                                                                <DollarSign size={12} className="mr-0.5" />
                                                                {lead.value.toLocaleString('pt-BR')}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Contact Info */}
                                                    <div className="space-y-2 mb-3">
                                                        <div className="flex items-center text-slate-600 text-xs">
                                                            <Phone size={12} className="mr-2 text-slate-400" />
                                                            {lead.phone}
                                                        </div>
                                                        {lead.desired_treatment && (
                                                            <div className="flex items-center text-slate-600 text-xs">
                                                                <Target size={12} className="mr-2 text-slate-400" />
                                                                {lead.desired_treatment}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Footer */}
                                                    <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                                                        <div className="flex gap-1.5">
                                                            {lead.priority === 'HIGH' && (
                                                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${priorityConfig.bg} ${priorityConfig.text} ${priorityConfig.border}`}>
                                                                    {priorityConfig.label}
                                                                </span>
                                                            )}
                                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                                                                Score: {lead.lead_score}
                                                            </span>
                                                        </div>
                                                        <div className="text-[10px] text-slate-400">
                                                            {new Date(lead.last_interaction).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-center p-8 text-slate-400">
                                            <Icon size={32} className="mb-2 opacity-30" />
                                            <p className="text-xs">Nenhum lead nesta etapa</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default PipelinePage;
