import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp, Users, DollarSign, Target, Phone, Mail, Calendar,
    CheckCircle, XCircle, Clock, Zap, MessageSquare, MoreVertical,
    Filter, AlertCircle, Plus, Crown, Star, Sparkles, Instagram,
    Briefcase, ChevronRight, ChevronDown // Imported ChevronDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { highTicketService, HighTicketLead, PipelineStats, Pipeline, PipelineStage } from '../services/highTicketService';
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { cn } from "../lib/utils";
import { LeadDetailsSheet } from "../components/pipeline/LeadDetailsSheet";
import { LeadDetailSheet } from "../components/crm/LeadDetailSheet";

// Priority Badge Configuration
const getPriorityConfig = (priority: string) => {
    switch (priority) {
        case 'HIGH':
            return { bg: 'bg-rose-50 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800', label: 'Alta 🔥' };
        case 'MEDIUM':
            return { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800', label: 'Média ⚡' };
        default:
            return { bg: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700', label: 'Normal' };
    }
};

// Value Tier Badge (DIAMOND, GOLD, STANDARD)
const getValueTier = (value: number) => {
    if (value >= 10000) return { label: 'DIAMOND', icon: Crown, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30' };
    if (value >= 5000) return { label: 'GOLD', icon: Star, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30' };
    return { label: 'STANDARD', icon: Target, color: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800' };
};

// Icon mapping for stages
const getStageIcon = (stageName: string) => {
    const name = stageName.toLowerCase();
    if (name.includes('novo') || name.includes('new')) return Sparkles;
    if (name.includes('contato') || name.includes('contact')) return MessageSquare;
    if (name.includes('agend') || name.includes('schedul')) return Calendar;
    if (name.includes('orça') || name.includes('proposal')) return DollarSign;
    if (name.includes('fech') || name.includes('won') || name.includes('ganho')) return CheckCircle;
    if (name.includes('perd') || name.includes('lost')) return XCircle;
    return Target;
};

// Color mapping for stages
const getStageColor = (color?: string) => {
    if (!color) return 'border-slate-300 dark:border-slate-600';
    // Map database colors to Tailwind border classes
    const colorMap: Record<string, string> = {
        'bg-blue-100': 'border-blue-400 dark:border-blue-600',
        'bg-yellow-100': 'border-yellow-400 dark:border-yellow-600',
        'bg-purple-100': 'border-purple-400 dark:border-purple-600',
        'bg-orange-100': 'border-orange-400 dark:border-orange-600',
        'bg-green-100': 'border-green-400 dark:border-green-600',
        'bg-red-100': 'border-red-400 dark:border-red-600',
        'bg-gray-100': 'border-gray-300 dark:border-gray-600'
    };
    return colorMap[color] || 'border-slate-300 dark:border-slate-600';
};

export const PipelinePage: React.FC = () => {
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [leads, setLeads] = useState<HighTicketLead[]>([]);
    const [stats, setStats] = useState<PipelineStats | null>(null);

    // NEW: Dynamic Pipeline State
    const [allPipelines, setAllPipelines] = useState<Pipeline[]>([]);
    const [pipeline, setPipeline] = useState<Pipeline | null>(null);
    const [stages, setStages] = useState<PipelineStage[]>([]);

    // Sheet State
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<HighTicketLead | null>(null);

    // New Detail Sheet State
    const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

    // Filter State
    const [filterPriority, setFilterPriority] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
    const [filterStage, setFilterStage] = useState<string>('ALL');

    // View Mode State
    const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

    useEffect(() => {
        if (profile?.clinic_id) {
            loadData();
        }
    }, [profile?.clinic_id]);

    const loadData = async (pipelineIdToLoad?: string) => {
        try {
            setLoading(true);
            const clinicId = profile?.clinic_id!;

            // 1. Load All Pipelines (if not already loaded)
            let pipelinesList = allPipelines;
            if (pipelinesList.length === 0) {
                pipelinesList = await highTicketService.getAllPipelines(clinicId);
                setAllPipelines(pipelinesList);
            }

            // 2. Determine Active Pipeline
            let activePipeline = pipeline;

            if (pipelineIdToLoad) {
                // User switched pipeline
                activePipeline = pipelinesList.find(p => p.id === pipelineIdToLoad) || null;
            } else if (!activePipeline && pipelinesList.length > 0) {
                // Initial Load
                activePipeline = pipelinesList.find(p => p.is_default) || pipelinesList[0];
            }

            if (!activePipeline) return; // Should not happen if seeded correctly

            setPipeline(activePipeline);
            setStages(activePipeline.stages);

            // 3. Load Leads for this pipeline
            const [leadsData, , statsData] = await Promise.all([
                highTicketService.getHighTicketLeads(clinicId, activePipeline.id),
                highTicketService.getHighTicketBudgets(clinicId),
                highTicketService.getPipelineStats(clinicId, activePipeline.id)
            ]);

            setLeads(leadsData);
            setStats(statsData);
        } catch (error) {
            console.error('Erro ao carregar pipeline:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePipelineChange = (pipelineId: string) => {
        loadData(pipelineId);
    };

    const handleNewLead = () => {
        setSelectedLead(null);
        setIsSheetOpen(true);
    };

    const handleEditLead = (lead: HighTicketLead) => {
        // Open new App Shell detail sheet
        setSelectedLeadId(lead.id);
        setIsDetailSheetOpen(true);
    };

    // Drag & Drop Logic
    const [draggedLead, setDraggedLead] = useState<HighTicketLead | null>(null);

    const handleDragStart = (lead: HighTicketLead) => {
        setDraggedLead(lead);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = async (stageId: string) => {
        if (draggedLead && draggedLead.stage_id !== stageId) {
            try {
                // Optimistic UI update
                const updatedLeads = leads.map(l =>
                    l.id === draggedLead.id ? { ...l, stage_id: stageId } : l
                );
                setLeads(updatedLeads);

                // API Update (NEW METHOD)
                await highTicketService.moveLeadToStage(draggedLead.id, stageId);
            } catch (error) {
                console.error('Erro ao mover card:', error);
                loadData(); // Revert on error
            }
        }
        setDraggedLead(null);
    };

    const filteredLeads = leads.filter(l => {
        // Priority filter
        const matchesPriority = filterPriority === 'ALL' || l.priority === filterPriority;

        // Stage filter (only applies in list view)
        const matchesStage = filterStage === 'ALL' || l.stage_id === filterStage;

        return matchesPriority && matchesStage;
    });

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
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">

            {/* ============================================ */}
            {/* HEADER - FIXO */}
            {/* ============================================ */}
            <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 md:p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="p-0 h-auto hover:bg-transparent text-lg md:text-xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
                                        <Sparkles className="text-amber-500 fill-amber-500" size={20} />
                                        {pipeline?.name || 'Pipeline'}
                                        <ChevronDown size={18} className="text-slate-400" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-56 dark:bg-slate-800 dark:border-slate-700">
                                    {allPipelines.map(p => (
                                        <DropdownMenuItem
                                            key={p.id}
                                            onClick={() => handlePipelineChange(p.id)}
                                            className={cn("cursor-pointer font-medium dark:text-slate-200 dark:focus:bg-slate-700", p.id === pipeline?.id && "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300")}
                                        >
                                            {p.name}
                                            {p.is_default && <span className="ml-auto text-[10px] text-slate-400">Padrão</span>}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                            <span>Funil de Vendas</span>
                            <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
                            <span>{leads.length} leads ativos</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* View Toggles */}
                        <div className="hidden lg:flex bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg">
                            <button
                                onClick={() => setViewMode('board')}
                                className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${viewMode === 'board'
                                    ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                    }`}
                            >
                                <Briefcase size={12} /> Board
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-all ${viewMode === 'list'
                                    ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                    }`}
                            >
                                <Users size={12} /> Lista
                            </button>
                        </div>

                        <Button
                            onClick={handleNewLead}
                            className="bg-violet-600 hover:bg-violet-700 text-white shadow-md hover:shadow-lg transition-all h-9 px-4 font-bold text-sm w-full md:w-auto"
                        >
                            <Plus size={16} className="mr-1" />
                            NOVO LEAD
                        </Button>
                    </div>
                </div>

                {/* KPI CARDS (Compact) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-3">
                    {/* Pipeline Total */}
                    <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between transition-colors">
                        <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Pipeline</p>
                            <p className="text-base md:text-lg font-bold text-violet-600 dark:text-violet-400">
                                {stats ? `R$ ${(stats.totalValue / 1000).toFixed(1)}k` : '...'}
                            </p>
                        </div>
                        <div className="p-1.5 bg-violet-50 dark:bg-violet-900/20 rounded">
                            <DollarSign className="text-violet-600 dark:text-violet-400" size={14} />
                        </div>
                    </div>

                    {/* Leads Quentes */}
                    <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between hover:border-rose-200 dark:hover:border-rose-800 transition-colors cursor-pointer" onClick={() => setFilterPriority('HIGH')}>
                        <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Quentes</p>
                            <p className="text-base md:text-lg font-bold text-rose-600 dark:text-rose-400">{stats?.hotLeads || 0}</p>
                        </div>
                        <div className="p-1.5 bg-rose-50 dark:bg-rose-900/20 rounded">
                            <Zap className="text-rose-600 dark:text-rose-400 fill-rose-600 dark:fill-rose-400" size={14} />
                        </div>
                    </div>

                    {/* Taxa de Conversão */}
                    <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between transition-colors">
                        <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Conversão</p>
                            <p className="text-base md:text-lg font-bold text-teal-600 dark:text-teal-400">
                                {stats?.conversionRate.toFixed(1) || 0}%
                            </p>
                        </div>
                        <div className="p-1.5 bg-teal-50 dark:bg-teal-900/20 rounded">
                            <TrendingUp className="text-teal-600 dark:text-teal-400" size={14} />
                        </div>
                    </div>

                    {/* Total de Leads */}
                    <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between transition-colors">
                        <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
                            <p className="text-base md:text-lg font-bold text-blue-600 dark:text-blue-400">
                                {leads.length}
                            </p>
                        </div>
                        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded">
                            <Users className="text-blue-600 dark:text-blue-400" size={14} />
                        </div>
                    </div>
                </div>

                {/* FILTERS */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Filtros:</span>

                    {/* Priority Filter */}
                    <button
                        onClick={() => setFilterPriority('ALL')}
                        className={`px-2 py-1 rounded-full text-[10px] font-bold transition-all border whitespace-nowrap ${filterPriority === 'ALL'
                            ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:border-slate-200'
                            : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilterPriority('HIGH')}
                        className={`px-2 py-1 rounded-full text-[10px] font-bold transition-all border whitespace-nowrap ${filterPriority === 'HIGH'
                            ? 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800'
                            : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-rose-200 hover:text-rose-600'
                            }`}
                    >
                        Alta 🔥
                    </button>

                    {/* Stage Filter (Only in List View) */}
                    {viewMode === 'list' && (
                        <>
                            <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-600 mx-1" />
                            <select
                                value={filterStage}
                                onChange={(e) => setFilterStage(e.target.value)}
                                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                            >
                                <option value="ALL">Todas Etapas</option>
                                {stages.map(stage => (
                                    <option key={stage.id} value={stage.id}>
                                        {stage.name}
                                    </option>
                                ))}
                            </select>
                        </>
                    )}
                </div>
            </div>


            {/* BOARD OR LIST VIEW - SCROLLÁVEL */}
            {viewMode === 'board' ? (
                // KANBAN BOARD VIEW - Scroll horizontal, colunas com scroll vertical
                <div className="flex-1 overflow-x-auto overflow-y-hidden p-3 md:p-4">
                    <div className="flex gap-3 h-full min-w-min">
                        {stages.map(stage => {
                            const Icon = getStageIcon(stage.name);
                            const columnLeads = filteredLeads.filter(l => l.stage_id === stage.id);
                            const borderColor = getStageColor(stage.color);

                            return (
                                <div
                                    key={stage.id}

                                    className={`w-full md:w-72 flex flex-col min-h-[500px] md:min-h-0 md:h-full rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 md:max-h-full shrink-0`}
                                    onDragOver={handleDragOver}
                                    onDrop={() => handleDrop(stage.id)}
                                >
                                    {/* Column Header */}
                                    <div className={`p-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-800 rounded-t-xl border-t-4 ${borderColor} flex-shrink-0 sticky top-0 z-10 md:static`}>
                                        <div className="flex items-center gap-2">
                                            <Icon size={16} className="text-slate-500 dark:text-slate-400" />
                                            <span className="font-bold text-sm text-slate-700 dark:text-slate-200">
                                                {stage.name}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-bold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 px-2 py-0.5 rounded-full shadow-sm transition-colors">
                                            {columnLeads.length}
                                        </span>
                                    </div>

                                    {/* Cards Container */}
                                    <div className="p-2 flex-1 md:overflow-y-auto scrollbar-hide">
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
                                                        onClick={() => handleEditLead(lead)}
                                                        className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md hover:border-violet-200 dark:hover:border-violet-700 transition-all group relative animate-in fade-in duration-300"
                                                    >
                                                        {/* Card Header */}
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate pr-6 leading-tight">
                                                                {lead.name}
                                                            </h4>
                                                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <MoreVertical size={14} className="text-slate-400 hover:text-violet-600 dark:hover:text-violet-400" />
                                                            </div>
                                                        </div>

                                                        {/* Value & Tier Badge */}
                                                        {lead.value && valueTier && (
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${valueTier.bg} ${valueTier.color} border-${valueTier.color.replace('text-', '')}-200/50`}>
                                                                    {TierIcon && <TierIcon size={10} />}
                                                                    <span className="font-bold">{valueTier.label}</span>
                                                                </div>
                                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                                                    R$ {lead.value.toLocaleString('pt-BR', { notation: 'compact' })}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* Contact Info (Compact) */}
                                                        <div className="space-y-1 mb-2">
                                                            <div className="flex items-center text-slate-500 dark:text-slate-400 text-[11px]">
                                                                <Phone size={10} className="mr-1.5 opacity-70" />
                                                                {lead.phone}
                                                            </div>
                                                            {lead.desired_treatment && (
                                                                <div className="flex items-center text-slate-500 dark:text-slate-400 text-[11px]">
                                                                    <Target size={10} className="mr-1.5 opacity-70" />
                                                                    <span className="truncate max-w-[180px]">{lead.desired_treatment}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Footer */}
                                                        <div className="border-t border-slate-50 dark:border-slate-700/50 pt-2 flex justify-between items-center mt-2">
                                                            <div className="flex gap-1">
                                                                {lead.priority === 'HIGH' && (
                                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${priorityConfig.bg} ${priorityConfig.text} ${priorityConfig.border}`}>
                                                                        {priorityConfig.label}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-[9px] text-slate-300 dark:text-slate-600 font-medium">
                                                                {new Date(lead.last_interaction).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-center py-10 opacity-50 hover:opacity-100 transition-opacity">
                                                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2 transition-colors">
                                                    <Plus className="text-slate-400" size={20} />
                                                </div>
                                                <p className="text-xs text-slate-400 font-medium">Arraste leads aqui</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                // LIST/TABLE VIEW
                <div className="flex-1 overflow-auto bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10 transition-colors">
                            <tr className="border-b border-slate-200 dark:border-slate-700">
                                <th className="text-left p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Nome</th>
                                <th className="text-left p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Telefone</th>
                                <th className="text-left p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Tratamento</th>
                                <th className="text-left p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Valor</th>
                                <th className="text-left p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Etapa</th>
                                <th className="text-left p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Prioridade</th>
                                <th className="text-left p-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Última Interação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLeads.map(lead => {
                                const stage = stages.find(s => s.id === lead.stage_id);
                                const priorityConfig = getPriorityConfig(lead.priority);

                                return (
                                    <tr
                                        key={lead.id}
                                        onClick={() => handleEditLead(lead)}
                                        className="border-b border-slate-100 dark:border-slate-800 hover:bg-violet-50 dark:hover:bg-violet-900/10 cursor-pointer transition-colors"
                                    >
                                        <td className="p-3">
                                            <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{lead.name}</div>
                                        </td>
                                        <td className="p-3 text-sm text-slate-600 dark:text-slate-400">{lead.phone}</td>
                                        <td className="p-3 text-sm text-slate-600 dark:text-slate-400">{lead.desired_treatment || '-'}</td>
                                        <td className="p-3">
                                            {lead.value ? (
                                                <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                                    R$ {lead.value.toLocaleString('pt-BR')}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="p-3">
                                            <Badge variant="outline" className="text-[10px] dark:border-slate-600 dark:text-slate-300">
                                                {stage?.name || 'N/A'}
                                            </Badge>
                                        </td>
                                        <td className="p-3">
                                            {lead.priority === 'HIGH' && (
                                                <span className={`text-[10px] px-2 py-1 rounded font-bold border ${priorityConfig.bg} ${priorityConfig.text} ${priorityConfig.border}`}>
                                                    {priorityConfig.label}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3 text-xs text-slate-400">
                                            {new Date(lead.last_interaction).toLocaleDateString('pt-BR')}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredLeads.length === 0 && (
                        <div className="text-center py-10 text-slate-400">
                            <Users size={32} className="mx-auto mb-2 opacity-20" />
                            <p className="text-sm">Nenhum lead encontrado</p>
                        </div>
                    )}
                </div>
            )}


            {/* Lead Details Sheet */}
            <LeadDetailsSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                lead={selectedLead}
                onSave={loadData}
                pipeline={pipeline}
            />

            {/* New App Shell Lead Detail Sheet */}
            <LeadDetailSheet
                leadId={selectedLeadId}
                open={isDetailSheetOpen}
                onOpenChange={setIsDetailSheetOpen}
            />
        </div>
    );
};

export default PipelinePage;
