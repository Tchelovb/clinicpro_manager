import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListFilter, Phone, Mail, Calendar, Loader2, Search, Filter as FilterIcon } from 'lucide-react';
import { useLeads } from '../hooks/useLeads';
import { LeadQuickActions } from '../components/leads/LeadQuickActions';
import { LeadDetailSheet } from '../components/crm/LeadDetailSheet';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const LeadsList: React.FC = () => {
    const navigate = useNavigate();
    const { leads, isLoading } = useLeads();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLead, setSelectedLead] = useState<any>(null);
    const [sheetOpen, setSheetOpen] = useState(false);

    const handleNewLead = () => {
        setSelectedLead(null);
        setSheetOpen(true);
    };

    const handleLeadClick = (lead: any) => {
        setSelectedLead(lead);
        setSheetOpen(true);
    };

    const filteredLeads = leads.filter(lead =>
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'NEW': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
            'CONTACT': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
            'QUALIFICATION': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
            'SCHEDULED': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
            'PROPOSAL': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
            'NEGOTIATION': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
            'WON': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
            'LOST': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
        };
        return colors[status] || 'bg-slate-100 text-slate-700';
    };

    const getTemperatureIcon = (interest?: string) => {
        if (interest === 'Alto') return '🔥';
        if (interest === 'Médio') return '☀️';
        return '❄️';
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <ListFilter className="text-blue-600" size={24} />
                            Gestão de Leads
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Prospecção e Qualificação • {filteredLeads.length} leads
                        </p>
                    </div>

                    {/* Actions */}
                    <LeadQuickActions
                        onOpenFullRegistration={handleNewLead}
                        onSuccess={() => {
                            // Refresh will happen automatically via React Query
                        }}
                    />
                </div>

                {/* Search */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                        <Input
                            placeholder="Buscar por nome, telefone ou email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button variant="outline" size="icon">
                        <FilterIcon size={18} />
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto p-4">
                <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                                    Lead
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase hidden md:table-cell">
                                    Contato
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase hidden lg:table-cell">
                                    Origem
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase hidden md:table-cell">
                                    Data
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {filteredLeads.map((lead) => (
                                <tr
                                    key={lead.id}
                                    onClick={() => handleLeadClick(lead)}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">{getTemperatureIcon(lead.interest)}</span>
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-white">
                                                    {lead.name}
                                                </p>
                                                {lead.interest && (
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {lead.interest}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                <Phone size={14} />
                                                <a
                                                    href={`https://wa.me/55${lead.phone.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="hover:text-green-600 hover:underline"
                                                >
                                                    {lead.phone}
                                                </a>
                                            </div>
                                            {lead.email && (
                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                    <Mail size={14} />
                                                    {lead.email}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 hidden lg:table-cell">
                                        <Badge variant="outline" className="text-xs">
                                            {lead.source}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge className={`text-xs ${getStatusColor(lead.status)}`}>
                                            {lead.status}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 hidden md:table-cell">
                                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                            <Calendar size={14} />
                                            {format(new Date(lead.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredLeads.length === 0 && (
                        <div className="text-center py-12">
                            <ListFilter className="mx-auto h-12 w-12 text-slate-400" />
                            <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                                Nenhum lead encontrado
                            </h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                {searchTerm ? 'Tente ajustar sua busca' : 'Comece adicionando um novo lead'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <LeadDetailSheet
                open={sheetOpen}
                onOpenChange={setSheetOpen}
                leadId={selectedLead?.id}
                pipelineId={null}
                initialStageId={null}
            />
        </div>
    );
};

export default LeadsList;
