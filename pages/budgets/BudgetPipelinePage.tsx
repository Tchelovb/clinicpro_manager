import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Filter, Eye, Edit, Trash2, TrendingUp, Clock, CheckCircle, XCircle, Phone, AlertCircle, LayoutGrid, ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { cn } from '../../src/lib/utils';

interface Budget {
    id: string;
    patient_id: string;
    total_value: number;
    final_value: number;
    status: string;
    created_at: string;
    patients: {
        name: string;
        photo_profile_url?: string;
    } | null;
}

export const BudgetPipelinePage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showPatientSearch, setShowPatientSearch] = useState(false);

    // 1. CONFIGURAÇÃO DAS ABAS (Onde matamos o Rascunho)
    const tabs = [
        { id: 'all', label: 'Visão Geral', icon: LayoutGrid, count: 0 },

        // A NOVA "ENTRADA" (Substitui Rascunho/Enviado)
        {
            id: 'WAITING_CLOSING',
            label: 'Na Recepção (24h)',
            icon: AlertCircle,
            color: 'text-blue-600',
            count: 0
        },

        // O MEIO DE CAMPO (CRM)
        {
            id: 'PENDING',
            label: 'Pendentes / Follow-up',
            icon: Phone,
            color: 'text-orange-500',
            count: 0
        },

        // O SUCESSO
        {
            id: 'APPROVED',
            label: 'Vendidos',
            icon: CheckCircle,
            color: 'text-green-600',
            count: 0
        },

        // O ARQUIVO MORTO
        {
            id: 'REJECTED',
            label: 'Perdidos',
            icon: XCircle,
            color: 'text-red-400',
            count: 0
        }
    ];

    // 2. RENDERIZAÇÃO DOS BADGES (Etiquetas nos Cards)
    const renderStatusBadge = (status: string) => {
        switch (status) {
            case 'DRAFT':
                return (
                    <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-xs font-bold border border-slate-200">
                        Em Edição
                    </span>
                );
            case 'WAITING_CLOSING':
                return (
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-100 flex items-center">
                        <Clock size={12} className="mr-1" /> Na Recepção
                    </span>
                );
            case 'PENDING':
                return (
                    <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs font-bold border border-orange-100 flex items-center">
                        <Phone size={12} className="mr-1" /> Follow-up Necessário
                    </span>
                );
            case 'APPROVED':
            case 'PAID':
                return (
                    <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-100 flex items-center">
                        <CheckCircle size={12} className="mr-1" /> Aprovado
                    </span>
                );
            case 'REJECTED':
                return (
                    <span className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs font-bold border border-red-100">
                        Recusado
                    </span>
                );
            default:
                return null;
        }
    };

    // 3. BORDA SEMÂNTICA (Visual Management)
    const getCardStyle = (status: string) => {
        switch (status) {
            case 'WAITING_CLOSING':
                // AZUL: Urgente, fresco, na recepção
                return 'border-2 border-blue-500 shadow-[0_4px_20px_-10px_rgba(59,130,246,0.3)]';

            case 'PENDING':
                // LARANJA: Alerta, follow-up, pendente
                return 'border-2 border-orange-400 shadow-[0_4px_20px_-10px_rgba(251,146,60,0.3)]';

            case 'APPROVED':
            case 'PAID':
                // VERDE: Sucesso, dinheiro garantido
                return 'border-2 border-green-500 shadow-[0_4px_20px_-10px_rgba(34,197,94,0.3)]';

            case 'REJECTED':
                // CINZA/VERMELHO: Arquivo morto, sem destaque
                return 'border border-slate-200 opacity-60 grayscale hover:grayscale-0';

            default:
                return 'border border-slate-200';
        }
    };

    // Fetch budgets
    const { data: budgets, isLoading, refetch } = useQuery({
        queryKey: ['budgets', user?.clinic_id, statusFilter],
        queryFn: async () => {
            if (!user?.clinic_id) return [];

            let query = supabase
                .from('budgets')
                .select(`
                    id,
                    patient_id,
                    total_value,
                    final_value,
                    status,
                    created_at,
                    patients!inner (
                        name,
                        photo_profile_url
                    )
                `)
                .eq('clinic_id', user.clinic_id)
                .order('created_at', { ascending: false });

            // IMPORTANT: Updated filter logic
            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            const { data, error } = await query;
            if (error) throw error;

            // Transform the data to match our Budget interface
            return (data as any[]).map((item) => ({
                ...item,
                patients: Array.isArray(item.patients) ? item.patients[0] : item.patients
            })) as Budget[];
        },
        enabled: !!user?.clinic_id,
    });

    // Filter budgets by search term
    const filteredBudgets = budgets?.filter((budget) =>
        budget.patients?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenStudio = (patientId: string, budgetId?: string) => {
        if (budgetId) {
            navigate(`/patients/${patientId}/budget-studio/${budgetId}`);
        } else {
            navigate(`/patients/${patientId}/budget-studio`);
        }
    };

    const handleDeleteBudget = async (budgetId: string) => {
        if (!confirm('Tem certeza que deseja excluir este orçamento?')) return;

        try {
            const { error } = await supabase.from('budgets').delete().eq('id', budgetId);
            if (error) throw error;
            toast.success('Orçamento excluído com sucesso');
            refetch();
        } catch (err: any) {
            console.error(err);
            toast.error('Erro ao excluir orçamento: ' + err.message);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                Gestão de Orçamentos
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Pipeline de vendas e acompanhamento de propostas
                            </p>
                        </div>
                        <button
                            onClick={() => setShowPatientSearch(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium shadow-sm"
                        >
                            <Plus size={20} />
                            Novo Orçamento
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por paciente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
                        />
                    </div>
                </div>

                {/* Status Filter Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 mb-6 border-b border-slate-200 dark:border-slate-800">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = statusFilter === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setStatusFilter(tab.id)}
                                className={cn(
                                    'flex items-center gap-2 px-4 py-3 border-b-2 transition-all font-medium text-sm whitespace-nowrap',
                                    isActive
                                        ? 'border-violet-600 text-violet-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                )}
                            >
                                <Icon size={16} className={isActive ? 'text-violet-600' : 'text-slate-400'} />
                                {tab.label}
                                {(tab.count ?? 0) > 0 && (
                                    <span className={cn(
                                        "ml-1 px-2 py-0.5 rounded-full text-xs",
                                        isActive ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-500"
                                    )}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Budgets List */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredBudgets && filteredBudgets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredBudgets.map((budget) => {
                            return (
                                <div
                                    key={budget.id}
                                    className={`
                                        bg-white dark:bg-slate-900 rounded-xl p-5 transition-all duration-300 hover:-translate-y-1
                                        ${getCardStyle(budget.status)}
                                    `}
                                >
                                    {/* CABEÇALHO DO CARD */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            {/* Avatar com as iniciais */}
                                            <div className={`
                                                w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                                                ${budget.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                    budget.status === 'WAITING_CLOSING' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-slate-100 text-slate-600'}
                                            `}>
                                                {budget.patients?.name.substring(0, 2).toUpperCase()}
                                            </div>

                                            <div>
                                                <h3 className="font-bold text-slate-800 dark:text-white text-sm line-clamp-1">{budget.patients?.name}</h3>
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    {format(new Date(budget.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* VALOR (Centro das Atenções) */}
                                    <div className="mb-4">
                                        <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Valor da Proposta</p>
                                        <p className={`text-2xl font-black tracking-tight
                                            ${budget.status === 'PENDING' ? 'text-orange-500' :
                                                budget.status === 'WAITING_CLOSING' ? 'text-blue-600' :
                                                    (budget.status === 'APPROVED' || budget.status === 'PAID') ? 'text-green-600' : 'text-slate-700 dark:text-slate-300'}
                                        `}>
                                            {formatCurrency(budget.final_value)}
                                        </p>
                                    </div>

                                    {/* RODAPÉ E AÇÕES */}
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 border-dashed">
                                        {/* Badge de Status (Pequeno, pois a borda já diz tudo) */}
                                        {renderStatusBadge(budget.status)}

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleDeleteBudget(budget.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleOpenStudio(budget.patient_id, budget.id)}
                                                className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 flex items-center bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors"
                                            >
                                                Abrir <ArrowRight size={14} className="ml-1" />
                                            </button>
                                        </div>
                                    </div>

                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <Filter size={48} className="mb-4 opacity-20" />
                        <p className="text-lg font-medium">Nenhum orçamento encontrado</p>
                        <p className="text-sm">Tente ajustar os filtros ou criar um novo orçamento</p>
                    </div>
                )}
            </div>

            {/* Patient Search Modal (Simplified - will be enhanced) */}
            {showPatientSearch && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowPatientSearch(false)}
                >
                    <div
                        className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                            Selecionar Paciente
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            Funcionalidade em desenvolvimento. Por enquanto, acesse o perfil do paciente e clique em
                            "Novo Orçamento".
                        </p>
                        <button
                            onClick={() => {
                                setShowPatientSearch(false);
                                navigate('/patients');
                            }}
                            className="w-full px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium"
                        >
                            Ir para Pacientes
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
