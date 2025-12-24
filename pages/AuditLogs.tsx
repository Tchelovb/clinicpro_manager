import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auditService, AuditLog, AuditFilters } from '../services/auditService';
import {
    FileText,
    Filter,
    Download,
    Search,
    Calendar,
    User,
    Activity,
    Database,
    Loader2,
    ChevronDown,
    ChevronRight,
    AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const AuditLogs: React.FC = () => {
    const { profile } = useAuth();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedLog, setExpandedLog] = useState<string | null>(null);
    const [filters, setFilters] = useState<AuditFilters>({
        startDate: '',
        endDate: '',
        userId: '',
        actionType: '',
        entityType: '',
        searchTerm: ''
    });
    const [showFilters, setShowFilters] = useState(false);

    // Verificar permissão
    useEffect(() => {
        if (profile && profile.role !== 'ADMIN' && profile.role !== 'MASTER') {
            toast.error('Acesso negado. Apenas administradores podem visualizar logs de auditoria.');
            window.location.href = '/dashboard';
        }
    }, [profile]);

    useEffect(() => {
        if (profile?.clinic_id) {
            loadLogs();
        }
    }, [profile?.clinic_id, filters]);

    const loadLogs = async () => {
        try {
            setLoading(true);
            const data = await auditService.getLogs(profile!.clinic_id, filters, 200);
            setLogs(data);
        } catch (error) {
            console.error('Erro ao carregar logs:', error);
            toast.error('Erro ao carregar logs de auditoria');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            toast.loading('Exportando logs...');
            await auditService.downloadCSV(profile!.clinic_id, filters);
            toast.dismiss();
            toast.success('Logs exportados com sucesso!');
        } catch (error) {
            toast.dismiss();
            toast.error('Erro ao exportar logs');
        }
    };

    const getActionColor = (action: string) => {
        const colors: Record<string, string> = {
            'CREATE': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            'UPDATE': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            'DELETE': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            'LOGIN': 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
            'LOGOUT': 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
            'PIN_SUCCESS': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            'PIN_FAILED': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
            'PIN_BLOCKED': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            'REFUND': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            'DISCOUNT': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
        };
        return colors[action] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'CREATE': return '➕';
            case 'UPDATE': return '✏️';
            case 'DELETE': return '🗑️';
            case 'LOGIN': return '🔓';
            case 'LOGOUT': return '🔒';
            case 'PIN_SUCCESS': return '✅';
            case 'PIN_FAILED': return '❌';
            case 'PIN_BLOCKED': return '🔐';
            case 'REFUND': return '↩️';
            case 'DISCOUNT': return '💰';
            default: return '📝';
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
                <Loader2 className="w-12 h-12 text-violet-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Carregando logs de auditoria...</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto bg-slate-50 dark:bg-slate-900 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                        <FileText className="text-slate-600 dark:text-slate-400" size={32} />
                        Logs de Auditoria
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        Rastreamento completo de todas as ações do sistema
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-sm ${showFilters
                                ? 'bg-violet-600 text-white'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                    >
                        <Filter size={16} />
                        Filtros
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm shadow-sm"
                    >
                        <Download size={16} />
                        Exportar CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4 animate-in slide-in-from-top duration-200">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4">Filtros</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Data Inicial
                            </label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Data Final
                            </label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Tipo de Ação
                            </label>
                            <select
                                value={filters.actionType}
                                onChange={(e) => setFilters({ ...filters, actionType: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            >
                                <option value="">Todas as ações</option>
                                <option value="CREATE">Criação</option>
                                <option value="UPDATE">Atualização</option>
                                <option value="DELETE">Exclusão</option>
                                <option value="LOGIN">Login</option>
                                <option value="LOGOUT">Logout</option>
                                <option value="PIN_SUCCESS">PIN Sucesso</option>
                                <option value="PIN_FAILED">PIN Falha</option>
                                <option value="REFUND">Estorno</option>
                                <option value="DISCOUNT">Desconto</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Tipo de Entidade
                            </label>
                            <select
                                value={filters.entityType}
                                onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            >
                                <option value="">Todas as entidades</option>
                                <option value="PATIENT">Paciente</option>
                                <option value="BUDGET">Orçamento</option>
                                <option value="APPOINTMENT">Agendamento</option>
                                <option value="EXPENSE">Despesa</option>
                                <option value="TRANSACTION">Transação</option>
                                <option value="USER">Usuário</option>
                                <option value="SECURITY_PIN">PIN Segurança</option>
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Buscar
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    value={filters.searchTerm}
                                    onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                                    placeholder="Buscar por nome ou descrição..."
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => setFilters({
                                startDate: '',
                                endDate: '',
                                userId: '',
                                actionType: '',
                                entityType: '',
                                searchTerm: ''
                            })}
                            className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium text-sm"
                        >
                            Limpar Filtros
                        </button>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                            <Activity className="text-violet-600 dark:text-violet-400" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Total de Logs</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">{logs.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <Database className="text-green-600 dark:text-green-400" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Criações</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                {logs.filter(l => l.action_type === 'CREATE').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Activity className="text-blue-600 dark:text-blue-400" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Atualizações</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                {logs.filter(l => l.action_type === 'UPDATE').length}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <AlertCircle className="text-red-600 dark:text-red-400" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Exclusões</p>
                            <p className="text-2xl font-bold text-slate-800 dark:text-white">
                                {logs.filter(l => l.action_type === 'DELETE').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Logs List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {logs.length === 0 ? (
                    <div className="p-12 text-center">
                        <FileText size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                        <h4 className="text-lg font-bold text-slate-600 dark:text-slate-300 mb-2">
                            Nenhum log encontrado
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Ajuste os filtros ou aguarde novas ações no sistema
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                        {logs.map((log) => (
                            <div key={log.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getActionColor(log.action_type)}`}>
                                                {getActionIcon(log.action_type)} {log.action_type}
                                            </span>
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                                {log.entity_type}
                                            </span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                {new Date(log.created_at).toLocaleString('pt-BR')}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 mb-2">
                                            <User size={14} className="text-slate-400" />
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                {log.user_name}
                                            </span>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                ({log.user_email})
                                            </span>
                                        </div>

                                        {log.entity_name && (
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                                                <strong>Entidade:</strong> {log.entity_name}
                                            </p>
                                        )}

                                        {log.changes_summary && (
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                {log.changes_summary}
                                            </p>
                                        )}

                                        {/* Expandable Details */}
                                        {(log.old_value || log.new_value) && (
                                            <button
                                                onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                                                className="mt-2 flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 hover:underline"
                                            >
                                                {expandedLog === log.id ? (
                                                    <>
                                                        <ChevronDown size={14} />
                                                        Ocultar detalhes
                                                    </>
                                                ) : (
                                                    <>
                                                        <ChevronRight size={14} />
                                                        Ver detalhes
                                                    </>
                                                )}
                                            </button>
                                        )}

                                        {expandedLog === log.id && (
                                            <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-2">
                                                {log.old_value && (
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                            Valor Anterior:
                                                        </p>
                                                        <pre className="text-xs text-slate-600 dark:text-slate-400 overflow-x-auto">
                                                            {JSON.stringify(log.old_value, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                                {log.new_value && (
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                                            Valor Novo:
                                                        </p>
                                                        <pre className="text-xs text-slate-600 dark:text-slate-400 overflow-x-auto">
                                                            {JSON.stringify(log.new_value, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditLogs;
