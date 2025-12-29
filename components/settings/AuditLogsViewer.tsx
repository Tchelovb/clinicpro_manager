import React, { useState, useEffect } from 'react';
import { supabase, getCurrentClinicId } from '../../lib/supabase';
import { Loader2, Shield, User, Calendar, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface AuditLog {
    id: string;
    user_id: string;
    user_name?: string;
    action: string;
    table_name: string;
    record_id?: string;
    description: string;
    created_at: string;
}

const AuditLogsViewer: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [clinicId, setClinicId] = useState<string>('');
    const pageSize = 20;

    useEffect(() => {
        loadData();
    }, [page]);

    const loadData = async () => {
        try {
            setLoading(true);
            const currentClinicId = await getCurrentClinicId();
            if (!currentClinicId) {
                toast.error('Clínica não encontrada');
                return;
            }
            setClinicId(currentClinicId);
            await loadLogs(currentClinicId);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            toast.error('Erro ao carregar logs');
        } finally {
            setLoading(false);
        }
    };

    const loadLogs = async (clinicId: string) => {
        // Contar total de registros
        const { count } = await supabase
            .from('audit_logs')
            .select('*', { count: 'exact', head: true })
            .eq('clinic_id', clinicId);

        if (count) {
            setTotalPages(Math.ceil(count / pageSize));
        }

        // Buscar logs paginados
        const { data, error } = await supabase
            .from('audit_logs')
            .select(`
                *,
                users:user_id (
                    name
                )
            `)
            .eq('clinic_id', clinicId)
            .order('created_at', { ascending: false })
            .range((page - 1) * pageSize, page * pageSize - 1);

        if (error) {
            console.error('Erro ao carregar logs:', error);
            return;
        }

        // Mapear dados com nome do usuário
        const logsWithUserNames = (data || []).map(log => ({
            ...log,
            user_name: log.users?.name || 'Usuário Desconhecido'
        }));

        setLogs(logsWithUserNames);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const getActionBadge = (action: string) => {
        const badges: Record<string, { color: string; label: string }> = {
            CREATE: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', label: 'Criação' },
            UPDATE: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', label: 'Edição' },
            DELETE: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', label: 'Exclusão' },
            LOGIN: { color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300', label: 'Login' },
            LOGOUT: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', label: 'Logout' }
        };

        const badge = badges[action] || { color: 'bg-gray-100 text-gray-800', label: action };

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                {badge.label}
            </span>
        );
    };

    const getTableLabel = (tableName: string) => {
        const labels: Record<string, string> = {
            patients: 'Pacientes',
            budgets: 'Orçamentos',
            expenses: 'Despesas',
            revenues: 'Receitas',
            procedures: 'Procedimentos',
            users: 'Usuários',
            clinics: 'Clínicas',
            suppliers: 'Fornecedores',
            lead_sources: 'Origens de Lead',
            appointment_types: 'Tipos de Agendamento',
            insurance_plans: 'Planos de Convênio'
        };

        return labels[tableName] || tableName;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Carregando logs de auditoria...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Shield className="text-purple-600" />
                    Logs de Auditoria
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Histórico completo de alterações críticas no sistema
                </p>
            </div>

            {/* Stats */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total de Registros</p>
                        <p className="text-3xl font-bold text-purple-600">{totalPages * pageSize}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Página Atual</p>
                        <p className="text-3xl font-bold text-blue-600">{page} / {totalPages}</p>
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Data/Hora
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Usuário
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Ação
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Tabela
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Descrição
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Shield className="w-12 h-12 text-gray-400" />
                                            <p className="text-gray-600 dark:text-gray-400">
                                                Nenhum log de auditoria encontrado
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Os logs aparecerão aqui conforme ações forem realizadas
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr
                                        key={log.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                                                <Calendar size={14} className="text-gray-400" />
                                                {formatDate(log.created_at)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                                                <User size={14} className="text-gray-400" />
                                                {log.user_name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getActionBadge(log.action)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                                <FileText size={14} />
                                                {getTableLabel(log.table_name)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {log.description}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={16} />
                        Anterior
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        Página {page} de {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Próxima
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}

            {/* Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="text-sm font-bold text-blue-900 dark:text-blue-200 mb-2">
                    🔍 Sobre os Logs de Auditoria
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
                    <li>Registra todas as ações críticas realizadas no sistema</li>
                    <li>Permite rastreabilidade completa de alterações em preços, exclusões e configurações</li>
                    <li>Logs são permanentes e não podem ser editados ou excluídos</li>
                    <li>Útil para auditorias internas e resolução de conflitos</li>
                </ul>
            </div>
        </div>
    );
};

export default AuditLogsViewer;
