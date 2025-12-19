
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { KANBAN_COLUMNS } from '../constants';
import { Lead, LeadStatus } from '../types';
import {
    MoreHorizontal, Clock, Plus,
    LayoutGrid, List, FileText, AlertCircle, RefreshCcw, ArrowRight, Briefcase, TrendingUp, Loader
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLeads } from '../hooks/useLeads';
import { useUnapprovedBudgets } from '../hooks/useBudgets';

const CRM: React.FC = () => {
    const { leads, isLoading, createLead } = useLeads();
    const { budgets: unapprovedBudgets, isLoading: budgetsLoading } = useUnapprovedBudgets();
    const navigate = useNavigate();
    const [activeView, setActiveView] = useState<'kanban' | 'list' | 'budgets'>('kanban');

    const conversionRate = leads.length ? (leads.filter(l => l.status === LeadStatus.WON).length / leads.length) * 100 : 0;
    const totalValue = leads.reduce((acc, l) => acc + (l.value || 0), 0);

    const handleCreateOpportunity = (patientId: string, budgetId: string) => {
        // Find budget details (already available in unapprovedBudgets)
        const budget = unapprovedBudgets.find(b => b.id === budgetId);
        if (!budget) return;

        createLead({
            name: budget.patientName || 'Paciente sem nome',
            phone: budget.patientPhone || '',
            source: 'Orçamento',
            status: LeadStatus.NEGOTIATION,
            interest: 'Alto',
            value: budget.totalValue || 0,
            budgetId: budgetId,
            // Other required fields are optional in Omit<Lead...> or handled by hook logic
        }, {
            onSuccess: (data) => {
                navigate(`/crm/${data.id}`);
            }
        });
    };

    if (isLoading) {
        return <div className="flex h-full items-center justify-center"><Loader className="animate-spin text-blue-600" size={32} /></div>;
    }

    const LeadCard: React.FC<{ lead: Lead }> = ({ lead }) => {
        // Check if this lead was generated from a rejected budget (check history for keyword)
        const isBudgetReturn = lead.history.some(h => h.content.includes('reprovação do orçamento'));

        return (
            <div
                onClick={() => navigate(`/crm/${lead.id}`)}
                className="bg-white dark:bg-gray-800 p-4 md:p-3 rounded-xl md:rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer mb-3 group relative w-full"
            >
                <div className="flex justify-between items-start mb-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide
          ${lead.source === 'Instagram' ? 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400' :
                            lead.source === 'Google' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                                lead.source === 'Indicação' ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                                    lead.source === 'Orçamento' ? 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                                        'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                        {lead.source}
                    </span>
                    {lead.tasks && lead.tasks.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    )}
                </div>

                {isBudgetReturn && (
                    <div className="mb-2">
                        <span className="text-[10px] flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded font-bold border border-orange-200 dark:border-orange-800">
                            <RefreshCcw size={10} /> Retorno de Orçamento
                        </span>
                    </div>
                )}

                <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-1 line-clamp-1">{lead.name}</h4>
                {lead.value && (
                    <p className="text-gray-900 dark:text-white font-bold text-xs mb-2">R$ {lead.value.toLocaleString('pt-BR')}</p>
                )}

                <div className="flex items-center gap-3 text-gray-400 dark:text-gray-500 text-xs mt-3 pt-3 border-t border-gray-50 dark:border-gray-700">
                    <div className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400">
                        <Clock size={12} />
                        {new Date(lead.lastInteraction).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full gap-6 pb-20 md:pb-0 overflow-x-hidden">
            {/* --- DASHBOARD HEADER --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Central de Conversão</h1>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <span><strong className="text-gray-900 dark:text-gray-200">{leads.length}</strong> Oportunidades</span>
                        <span><strong className="text-green-600 dark:text-green-400">{conversionRate.toFixed(1)}%</strong> Conversão</span>
                        <span><strong className="text-blue-600 dark:text-blue-400">R$ {totalValue.toLocaleString('pt-BR')}</strong> em Pipeline</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-1 flex">
                        <button onClick={() => setActiveView('kanban')} className={`p-2 rounded ${activeView === 'kanban' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`} title="Kanban"><LayoutGrid size={18} /></button>
                        <button onClick={() => setActiveView('list')} className={`p-2 rounded ${activeView === 'list' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`} title="Lista"><List size={18} /></button>
                        <button onClick={() => setActiveView('budgets')} className={`p-2 rounded ${activeView === 'budgets' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`} title="Recuperação de Orçamentos"><FileText size={18} /></button>
                    </div>

                    {/* Desktop Button */}
                    <button
                        onClick={() => navigate('/crm/new')}
                        className="hidden md:flex bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg items-center gap-2 font-medium transition ml-auto md:ml-0"
                    >
                        <Plus size={18} /> Novo Contato
                    </button>
                </div>
            </div>

            {/* --- VIEW: KANBAN --- */}
            {activeView === 'kanban' && (
                <div className="flex-1 md:overflow-x-auto md:overflow-y-hidden">
                    {/* MOBILE: Flex Column (Vertical Stack) | DESKTOP: Flex Row (Horizontal) */}
                    <div className="flex flex-col md:flex-row gap-4 h-auto md:h-full w-full md:min-w-max pb-4">
                        {KANBAN_COLUMNS.map((column) => {
                            const columnLeads = leads.filter(l => l.status === column.id);

                            return (
                                <div key={column.id} className="w-full md:w-72 flex flex-col md:h-full rounded-xl bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 md:max-h-full shrink-0">
                                    <div className={`p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 rounded-t-xl border-t-4 ${column.color} flex-shrink-0 sticky top-0 z-10 md:static`}>
                                        <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm">{column.title}</h3>
                                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                            {columnLeads.length}
                                        </span>
                                    </div>
                                    {/* Inner scroll only on Desktop. Mobile uses page scroll. */}
                                    <div className="p-2 flex-1 md:overflow-y-auto scrollbar-hide">
                                        {columnLeads.map(lead => (
                                            <LeadCard key={lead.id} lead={lead} />
                                        ))}
                                        {columnLeads.length === 0 && (
                                            <div className="h-16 md:h-20 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                                                Vazio
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* --- VIEW: LIST --- */}
            {activeView === 'list' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex-1 flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Nome</th>
                                    <th className="px-6 py-3 font-medium">Origem</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium">Última Interação</th>
                                    <th className="px-6 py-3 font-medium text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {leads.map(lead => (
                                    <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors" onClick={() => navigate(`/crm/${lead.id}`)}>
                                        <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">{lead.name}</td>
                                        <td className="px-6 py-3 text-gray-500 dark:text-gray-400">{lead.source}</td>
                                        <td className="px-6 py-3">
                                            <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-bold border border-blue-100 dark:border-blue-800">
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-gray-500 dark:text-gray-400">
                                            {new Date(lead.lastInteraction).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <button className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"><MoreHorizontal size={16} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- VIEW: BUDGET RECOVERY --- */}
            {activeView === 'budgets' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex-1 flex flex-col">
                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border-b border-orange-100 dark:border-orange-900/50 flex items-center gap-2 text-orange-800 dark:text-orange-200 text-sm shrink-0">
                        <AlertCircle size={16} />
                        Mostrando <strong>{unapprovedBudgets.length}</strong> orçamentos não aprovados.
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 sticky top-0">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Paciente</th>
                                    <th className="px-6 py-3 font-medium">Data Envio</th>
                                    <th className="px-6 py-3 font-medium">Status</th>
                                    <th className="px-6 py-3 font-medium text-right">Valor</th>
                                    <th className="px-6 py-3 font-medium text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {unapprovedBudgets.map((budget, idx) => (
                                    <tr key={`${budget.id}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-3">
                                            <p className="font-bold text-gray-900 dark:text-white">{budget.patientName}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{budget.patientPhone}</p>
                                        </td>
                                        <td className="px-6 py-3 text-gray-500 dark:text-gray-400">{budget.createdAt}</td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold border 
                                        ${budget.status === 'Em Negociação' ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-yellow-50 text-yellow-700 border-yellow-100'} dark:bg-opacity-20`}>
                                                {budget.status === 'Em Análise' ? 'Aguardando Aprovação' : budget.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right font-bold text-gray-900 dark:text-white">
                                            R$ {budget.totalValue.toLocaleString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            {budget.status === 'Em Negociação' ? (
                                                <button
                                                    onClick={() => {
                                                        // Try to find the linked lead
                                                        const linkedLead = leads.find(l => l.budgetId === budget.id);
                                                        if (linkedLead) {
                                                            navigate(`/crm/${linkedLead.id}`);
                                                        } else {
                                                            // Fallback to budget edit if lead missing (edge case)
                                                            navigate(`/patients/${budget.patientId}/budgets/${budget.id}`);
                                                        }
                                                    }}
                                                    className="text-purple-600 dark:text-purple-400 hover:text-purple-700 font-medium text-xs border border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 px-3 py-1.5 rounded hover:bg-purple-100 dark:hover:bg-purple-900/40 flex items-center gap-1 ml-auto"
                                                >
                                                    <TrendingUp size={12} /> Ver Oportunidade
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleCreateOpportunity(budget.patientId, budget.id)}
                                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium text-xs border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center gap-1 ml-auto"
                                                >
                                                    <Briefcase size={12} /> Criar Oportunidade
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MOBILE FLOATING ACTION BUTTON */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
                <button
                    onClick={() => navigate('/crm/new')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg"
                >
                    <Plus size={20} /> Novo Contato
                </button>
            </div>
        </div>
    );
};

export default CRM;
