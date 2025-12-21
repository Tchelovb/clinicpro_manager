import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp, Users, DollarSign, Target, Phone, Mail, Calendar,
    CheckCircle, XCircle, Clock, Zap, MessageSquare, MoreVertical,
    Filter, AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { highTicketService, HighTicketLead, PipelineStats } from '../services/highTicketService';

// Status Columns Configuration
const COLUMNS = [
    { id: 'NEW', label: 'Novo Lead', color: 'border-blue-500', bg: 'bg-blue-50' },
    { id: 'CONTACTED', label: 'Em Contato', color: 'border-violet-500', bg: 'bg-violet-50' },
    { id: 'SCHEDULED', label: 'Agendado', color: 'border-teal-500', bg: 'bg-teal-50' },
    { id: 'BUDGET_CREATED', label: 'Orçamento', color: 'border-amber-500', bg: 'bg-amber-50' },
    { id: 'WON', label: 'Fechado', color: 'border-green-500', bg: 'bg-green-50' },
    { id: 'LOST', label: 'Perdido', color: 'border-slate-400', bg: 'bg-slate-50' },
];

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

                // Reload to sync (optional, maybe just keep optimistic)
                // loadData(); 
            } catch (error) {
                console.error('Erro ao mover card:', error);
                // Revert on error would be ideal
                loadData();
            }
        }
        setDraggedLead(null);
    };

    const handleLeadAction = (leadId: string, action: string) => {
        // Implement actions
        navigate(`/crm/${leadId}`); // Or specific action route
    };

    const filteredLeads = leads.filter(l =>
        filterPriority === 'ALL' || l.priority === filterPriority
    );

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)]">
            {/* Header Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-violet-50 rounded-lg text-violet-600">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Pipeline Total</p>
                        <p className="text-2xl font-bold text-slate-800">
                            {stats ? `R$ ${(stats.totalValue / 1000).toFixed(1)}k` : '...'}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-50 rounded-lg text-amber-500">
                        <Zap size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Leads Quentes</p>
                        <p className="text-2xl font-bold text-slate-800">
                            {stats?.hotLeads || 0}
                        </p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-teal-50 rounded-lg text-teal-600">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Conversão</p>
                        <p className="text-2xl font-bold text-slate-800">
                            {stats?.conversionRate.toFixed(1) || 0}%
                        </p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Total Leads</p>
                        <p className="text-2xl font-bold text-slate-800">
                            {leads.length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters & Actions */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                    <button
                        onClick={() => setFilterPriority('ALL')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filterPriority === 'ALL' ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilterPriority('HIGH')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filterPriority === 'HIGH' ? 'bg-rose-50 text-rose-600' : 'text-slate-500 hover:text-rose-600'}`}
                    >
                        Alta 🔥
                    </button>
                    <button
                        onClick={() => setFilterPriority('MEDIUM')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filterPriority === 'MEDIUM' ? 'bg-amber-50 text-amber-600' : 'text-slate-500 hover:text-amber-600'}`}
                    >
                        Média ⚡
                    </button>
                </div>

                <button className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2">
                    <Users size={18} />
                    Novo Lead
                </button>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto pb-4">
                <div className="flex gap-4 min-w-[1200px] h-full">
                    {COLUMNS.map(col => (
                        <div
                            key={col.id}
                            className={`flex flex-col flex-1 min-w-[280px] bg-slate-50 rounded-xl border-t-4 ${col.color} shadow-sm`}
                            onDragOver={handleDragOver}
                            onDrop={() => handleDrop(col.id)}
                        >
                            <div className="p-3 border-b border-slate-200 flex justify-between items-center">
                                <span className={`font-bold text-slate-700 ${col.id === 'WON' ? 'text-green-700' : ''}`}>
                                    {col.label}
                                </span>
                                <span className="text-xs font-semibold bg-white text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">
                                    {filteredLeads.filter(l => l.status === col.id).length}
                                </span>
                            </div>

                            <div className="p-2 flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                                {filteredLeads.filter(l => l.status === col.id).map(lead => (
                                    <div
                                        key={lead.id}
                                        draggable
                                        onDragStart={() => handleDragStart(lead)}
                                        className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm cursor-grab hover:shadow-md transition-all group relative"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-slate-800 text-sm truncate pr-6">{lead.name}</h4>
                                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="text-slate-400 hover:text-violet-600">
                                                    <MoreVertical size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2 mb-3">
                                            {lead.value && (
                                                <div className="flex items-center text-teal-600 text-xs font-bold">
                                                    <DollarSign size={12} className="mr-1" />
                                                    R$ {lead.value.toLocaleString('pt-BR')}
                                                </div>
                                            )}
                                            <div className="flex items-center text-slate-500 text-xs">
                                                <Phone size={12} className="mr-1" />
                                                {lead.phone}
                                            </div>
                                            {lead.desired_treatment && (
                                                <div className="flex items-center text-slate-500 text-xs">
                                                    <Target size={12} className="mr-1" />
                                                    {lead.desired_treatment}
                                                </div>
                                            )}
                                        </div>

                                        <div className="border-t border-slate-100 pt-2 flex justify-between items-center">
                                            <div className="flex gap-1">
                                                {lead.priority === 'HIGH' && <span className="text-[10px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded font-bold">Alta</span>}
                                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                                                    Score: {lead.lead_score}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-slate-400">
                                                {new Date(lead.last_interaction).toLocaleDateString('pt-BR')}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PipelinePage;
