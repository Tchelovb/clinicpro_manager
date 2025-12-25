import React, { useEffect, useState } from 'react';
import { crmService, Lead, LeadStatus } from '../../services/crmService';
import { Phone, Calendar, CheckCircle, DollarSign, UserPlus, Trash2, MessageSquare, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Configuração Visual das Colunas
const COLUMNS: { id: LeadStatus; label: string; color: string; bgColor: string; icon: any }[] = [
    { id: 'NEW', label: 'Novos', color: 'border-blue-300', bgColor: 'bg-blue-50', icon: UserPlus },
    { id: 'CONTACT', label: 'Em Contato', color: 'border-yellow-300', bgColor: 'bg-yellow-50', icon: Phone },
    { id: 'SCHEDULED', label: 'Agendado', color: 'border-purple-300', bgColor: 'bg-purple-50', icon: Calendar },
    { id: 'PROPOSAL', label: 'Orçamento', color: 'border-orange-300', bgColor: 'bg-orange-50', icon: DollarSign },
    { id: 'WON', label: 'Fechado', color: 'border-green-300', bgColor: 'bg-green-50', icon: CheckCircle },
];

export const KanbanBoard: React.FC = () => {
    const { profile } = useAuth();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.clinic_id) {
            loadLeads();
        }
    }, [profile?.clinic_id]);

    const loadLeads = async () => {
        try {
            setLoading(true);
            const data = await crmService.getLeads(profile?.clinic_id);
            setLeads(data);
        } catch (error) {
            console.error('Erro ao carregar CRM', error);
        } finally {
            setLoading(false);
        }
    };

    const moveLead = async (id: string, currentStatus: LeadStatus) => {
        // Lógica simples: move para o próximo status
        const currentIndex = COLUMNS.findIndex(c => c.id === currentStatus);
        if (currentIndex < COLUMNS.length - 1) {
            const nextStatus = COLUMNS[currentIndex + 1].id;

            // Atualização Otimista (Muda na tela antes do banco)
            setLeads(prev => prev.map(l => l.id === id ? { ...l, status: nextStatus } : l));

            try {
                await crmService.updateStatus(id, nextStatus);
            } catch (error) {
                console.error('Erro ao mover lead:', error);
                // Reverte em caso de erro
                loadLeads();
            }
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Tem certeza que deseja excluir o lead "${name}"?`)) return;

        try {
            await crmService.deleteLead(id);
            setLeads(prev => prev.filter(l => l.id !== id));
        } catch (error) {
            console.error('Erro ao deletar lead:', error);
            alert('Erro ao deletar lead');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="h-full">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Funil de Vendas</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Gerencie seus leads e acompanhe o progresso das conversões
                </p>
            </div>

            {/* Kanban Board */}
            <div className="flex gap-4 overflow-x-auto pb-4 min-h-[600px]">
                {COLUMNS.map(col => {
                    const columnLeads = leads.filter(l => l.status === col.id);
                    const Icon = col.icon;

                    return (
                        <div
                            key={col.id}
                            className={`flex-shrink-0 w-80 rounded-xl border-2 ${col.color} ${col.bgColor} flex flex-col`}
                        >
                            {/* Cabeçalho da Coluna */}
                            <div className="p-4 font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 border-b border-gray-200 dark:border-gray-600">
                                <Icon size={20} />
                                {col.label}
                                <span className="ml-auto bg-white dark:bg-gray-700 px-2 py-1 rounded-full text-xs font-semibold">
                                    {columnLeads.length}
                                </span>
                            </div>

                            {/* Lista de Cards */}
                            <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                                {columnLeads.length === 0 ? (
                                    <div className="text-center text-gray-400 dark:text-gray-500 py-8 text-sm">
                                        Nenhum lead nesta fase
                                    </div>
                                ) : (
                                    columnLeads.map(lead => (
                                        <div
                                            key={lead.id}
                                            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all group"
                                        >
                                            {/* Header do Card */}
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-semibold text-gray-900 dark:text-white">{lead.name}</h4>
                                                <div className="flex gap-1">
                                                    {/* Botão Deletar */}
                                                    <button
                                                        onClick={() => handleDelete(lead.id, lead.name)}
                                                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                                        title="Excluir lead"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Tratamento Desejado */}
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                {lead.desired_treatment || 'Avaliação'}
                                            </p>

                                            {/* Mensagem da IA */}
                                            {lead.message_sent && (
                                                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-xs text-gray-700 dark:text-gray-300 italic border border-blue-100 dark:border-blue-800 mb-3 flex gap-2">
                                                    <MessageSquare size={14} className="flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                                                    <span className="line-clamp-3">{lead.message_sent}</span>
                                                </div>
                                            )}

                                            {/* Footer do Card */}
                                            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                                    {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                                                </span>

                                                <div className="flex gap-2">
                                                    {/* Botão WhatsApp */}
                                                    <a
                                                        href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 p-1.5 rounded-full hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                                        title="Abrir WhatsApp"
                                                    >
                                                        <Phone size={16} />
                                                    </a>

                                                    {/* Botão Mover */}
                                                    {lead.status !== 'WON' && (
                                                        <button
                                                            onClick={() => moveLead(lead.id, lead.status)}
                                                            className="flex items-center gap-1 text-xs bg-blue-600 dark:bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                                                            title="Mover para próxima fase"
                                                        >
                                                            Mover
                                                            <ArrowRight size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
