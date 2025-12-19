import React, { useState, useMemo } from 'react';
import { LEAD_STATUS_LABELS, KANBAN_COLUMNS } from '../constants';
import { LeadStatus } from '../types';
import {
    LayoutGrid, List, Filter, Flame, ArrowUpRight,
    Search, TrendingUp, AlertTriangle, Plus,
    ArrowDownWideNarrow, MessageCircle, Calendar, CheckCircle, RefreshCcw, HandCoins, ArrowRight, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOpportunityHub, FunnelType, OpportunityItem } from '../hooks/useOpportunityHub';
import ScriptModal from './ScriptModal';

interface Filters {
    search: string;
    minValue: number;
}

const CommercialCentral: React.FC = () => {
    const navigate = useNavigate();

    // View State
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
    const [selectedFunnel, setSelectedFunnel] = useState<FunnelType>('ATTRACTION');
    const [showFilters, setShowFilters] = useState(false);

    // Script Modal State
    const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
    const [selectedOpportunity, setSelectedOpportunity] = useState<OpportunityItem | null>(null);

    const handleOpenScript = (e: React.MouseEvent, item: OpportunityItem) => {
        e.stopPropagation();
        setSelectedOpportunity(item);
        setIsScriptModalOpen(true);
    };

    // Data Hook (The Hub)
    const { opportunities, totalValue, isLoading } = useOpportunityHub(selectedFunnel);

    // Filters State
    const [filters, setFilters] = useState<Filters>({ search: '', minValue: 0 });

    // --- FUNNEL CONFIG ---
    const funnelConfig = useMemo(() => {
        switch (selectedFunnel) {
            case 'ATTRACTION':
                return {
                    label: 'Atração (Leads)',
                    icon: ArrowDownWideNarrow, color: 'text-blue-600',
                    insight: (count: number) => `${count} novos leads aguardando primeiro contato.`
                };
            case 'CONVERSION':
                return {
                    label: 'Conversão (Orçamentos)',
                    icon: HandCoins, color: 'text-green-600',
                    insight: (count: number, val: number) => `R$ ${val.toLocaleString('pt-BR')} parados em orçamentos abertos.`
                };
            case 'AGENDA':
                return {
                    label: 'Confirmação (Agenda)',
                    icon: Calendar, color: 'text-purple-600',
                    insight: (count: number) => `${count} agendamentos pendentes de confirmação.`
                };
            case 'LTV':
                return {
                    label: 'Reativação (LTV)',
                    icon: RefreshCcw, color: 'text-orange-600',
                    insight: (count: number) => `${count} pacientes inativos prontos para retorno.`
                };
        }
    }, [selectedFunnel]);

    // Local Filtering
    const filteredItems = useMemo(() => {
        return opportunities.filter(item => {
            const matchesSearch = filters.search ? item.title.toLowerCase().includes(filters.search.toLowerCase()) : true;
            const matchesValue = filters.minValue ? item.value >= filters.minValue : true;
            return matchesSearch && matchesValue;
        });
    }, [opportunities, filters]);

    // Dynamic Kanban Columns
    const dynamicColumns = useMemo(() => {
        if (selectedFunnel === 'ATTRACTION') {
            return KANBAN_COLUMNS.filter(c => [LeadStatus.NEW, LeadStatus.CONTACT].includes(c.id as LeadStatus));
        }
        // Auto-generate columns based on unique statuses for other funnels
        const statuses = Array.from(new Set(filteredItems.map(i => i.status)));
        return statuses.map(s => ({
            id: s,
            title: s,
            color: 'border-gray-300',
            bg: 'bg-gray-50'
        }));
    }, [selectedFunnel, filteredItems]);

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-red-500';
        if (score >= 50) return 'text-orange-500';
        return 'text-blue-500';
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500 animate-pulse">Carregando Hub de Oportunidades...</div>;

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-900 overflow-hidden">
            {/* --- HEADER --- */}
            <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4 shrink-0 z-20 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <TrendingUp className="text-blue-600" /> Central Comercial (Hub)
                    </h1>
                    {/* FUNNEL SELECTOR */}
                    <div className="flex items-center gap-3 mt-2">
                        <div className="relative group">
                            <select
                                value={selectedFunnel}
                                onChange={(e) => setSelectedFunnel(e.target.value as FunnelType)}
                                className={`appearance-none pl-9 pr-8 py-2 rounded-lg font-bold text-sm border-2 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${funnelConfig.color} border-current bg-transparent hover:bg-gray-50 dark:hover:bg-slate-700`}
                            >
                                <option value="ATTRACTION">Funil de Atração</option>
                                <option value="CONVERSION">Funil de Conversão</option>
                                <option value="AGENDA">Funil de Agenda</option>
                                <option value="LTV">Funil de LTV</option>
                            </select>
                            <funnelConfig.icon size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${funnelConfig.color}`} />
                        </div>

                        {/* METRICS BADGES */}
                        <div className="hidden md:flex items-center gap-2">
                            <span className="bg-gray-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                                <ArrowDownWideNarrow size={14} /> {filteredItems.length}
                            </span>
                            <span className="bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 text-green-700 dark:text-green-400">
                                <ArrowUpRight size={14} /> R$ {totalValue.toLocaleString('pt-BR')}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    {/* View Switcher */}
                    <div className="bg-gray-100 dark:bg-slate-700 p-1 rounded-lg flex">
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'kanban' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                            <List size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* --- FILTERS BAR --- */}
            <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-3 flex flex-wrap gap-3 items-center shrink-0">
                <div className={`flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-900 border rounded-lg transition-all ${'border-gray-200 dark:border-slate-600'}`}>
                    <Search size={16} className="text-gray-400" />
                    <input
                        className="bg-transparent border-none outline-none text-sm w-full md:w-60"
                        placeholder="Buscar oportunidade..."
                        value={filters.search}
                        onChange={e => setFilters({ ...filters, search: e.target.value })}
                    />
                </div>
            </div>

            {/* --- CONTENT AREA --- */}
            <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-slate-950 p-4">

                {/* LIST VIEW */}
                {viewMode === 'list' && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-card border border-gray-200 dark:border-slate-700 h-full flex flex-col overflow-hidden">
                        <div className="overflow-auto flex-1">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 text-gray-500 font-medium sticky top-0 z-10">
                                    <tr>
                                        <th className="px-6 py-3">Título / Score</th>
                                        <th className="px-6 py-3">Detalhe (Origem/Proc)</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3 text-right">Valor (R$)</th>
                                        <th className="px-6 py-3">Data</th>
                                        <th className="px-6 py-3 text-right">Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {filteredItems.map(item => (
                                        <tr key={`${item.type}-${item.id}`} className="hover:bg-blue-50/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group" onClick={() => navigate(item.actionUrl)}>
                                            <td className="px-6 py-3">
                                                <div>
                                                    <p className="font-bold text-gray-800 dark:text-white">{item.title}</p>
                                                    {item.score > 0 && (
                                                        <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                                                            <Flame size={10} className={getScoreColor(item.score)} />
                                                            Score: {item.score}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-gray-600 dark:text-gray-300">{item.subtitle}</td>
                                            <td className="px-6 py-3">
                                                <span className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded text-xs border border-gray-200 dark:border-gray-600">
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-right font-bold text-green-600">
                                                {item.value > 0 ? `R$ ${item.value.toLocaleString('pt-BR')}` : '-'}
                                            </td>
                                            <td className="px-6 py-3 text-gray-400 text-xs">
                                                {new Date(item.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-3 text-right">
                                                <button
                                                    onClick={(e) => handleOpenScript(e, item)}
                                                    className="mr-2 p-1.5 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors inline-flex"
                                                    title="Gerar Script IA"
                                                >
                                                    <Sparkles size={14} />
                                                </button>
                                                <button className="text-blue-600 hover:underline flex items-center gap-1 justify-end text-xs font-bold inline-flex">
                                                    Abrir <ArrowRight size={12} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* KANBAN VIEW */}
                {viewMode === 'kanban' && (
                    <div className="flex gap-4 h-full overflow-x-auto pb-4">
                        {dynamicColumns.map(col => {
                            const colItems = filteredItems.filter(i => i.status === col.id);
                            const colValue = colItems.reduce((acc, i) => acc + i.value, 0);

                            return (
                                <div key={col.id} className="w-80 flex-shrink-0 flex flex-col h-full rounded-xl bg-gray-200/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700">
                                    <div className={`p-3 rounded-t-xl bg-white dark:bg-slate-800 border-b border-gray-200 border-t-4 ${col.color || 'border-blue-400'}`}>
                                        <div className="flex justify-between items-center mb-1">
                                            <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm truncate uppercase">{col.title}</h3>
                                            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full font-bold">{colItems.length}</span>
                                        </div>
                                        {colValue > 0 && <div className="text-xs text-green-600 font-bold">R$ {colValue.toLocaleString('pt-BR')}</div>}
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-hide">
                                        {colItems.map(item => (
                                            <div key={`${item.type}-${item.id}`} onClick={() => navigate(item.actionUrl)} className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md cursor-pointer group relative">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded truncate max-w-[150px]">{item.subtitle}</span>
                                                    {item.score > 0 && (
                                                        <div className="flex items-center gap-1 text-[10px] font-bold text-orange-500">
                                                            <Flame size={10} /> {item.score}
                                                        </div>
                                                    )}
                                                </div>
                                                <h4 className="font-bold text-sm text-gray-800 dark:text-gray-200 mb-1 line-clamp-1">{item.title}</h4>
                                                {item.value > 0 && <p className="text-sm font-bold text-gray-900 dark:text-white">R$ {item.value.toLocaleString('pt-BR')}</p>}

                                                <div className="mt-3 pt-2 border-t border-gray-100 dark:border-slate-700 flex justify-end">
                                                    <button
                                                        onClick={(e) => handleOpenScript(e, item)}
                                                        className="text-[10px] flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded font-bold hover:bg-purple-200 transition-colors"
                                                    >
                                                        <Sparkles size={10} /> Closer AI
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                        {dynamicColumns.length === 0 && (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                <AlertTriangle size={32} className="mb-2 opacity-50" />
                                <p>Nenhum dado encontrado para este funil.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* BOS INSIGHT */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-6 bg-gray-900 text-white p-4 rounded-xl shadow-2xl border border-gray-700 max-w-sm animate-in slide-in-from-bottom-10 z-50 flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-opacity-20 ${funnelConfig.color === 'text-blue-600' ? 'bg-blue-600' : 'bg-gray-600'}`}>
                    <funnelConfig.icon size={20} className="text-white" />
                </div>
                <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400">Hub Insight (BOS)</h4>
                    <p className="text-xs font-medium mt-0.5">
                        {funnelConfig.insight(filteredItems.length, totalValue)}
                    </p>
                </div>
            </div>


            <ScriptModal
                isOpen={isScriptModalOpen}
                onClose={() => setIsScriptModalOpen(false)}
                opportunity={selectedOpportunity}
            />
        </div >
    );
};

export default CommercialCentral;
