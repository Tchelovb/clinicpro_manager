import React, { useState, useEffect } from 'react';
import { Shield, Search, Filter, Download, Eye, Calendar, User, Activity } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface AuditLog {
    id: string;
    created_at: string;
    user_name: string;
    user_email: string;
    action_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'EXPORT' | 'IMPORT';
    entity_type: string;
    entity_name: string;
    changes_summary: string;
    ip_address: string | null;
    old_value: any;
    new_value: any;
}

const AuditLogViewer: React.FC = () => {
    const { profile } = useAuth();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState<string>('ALL');
    const [filterEntity, setFilterEntity] = useState<string>('ALL');
    const [filterUser, setFilterUser] = useState<string>('ALL');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);

    useEffect(() => {
        loadAuditLogs();
        loadUsers();
    }, [profile]);

    const loadAuditLogs = async () => {
        if (!profile?.clinic_id) return;

        try {
            setLoading(true);
            let query = supabase
                .from('system_audit_logs')
                .select('*')
                .eq('clinic_id', profile.clinic_id)
                .order('created_at', { ascending: false })
                .limit(100);

            const { data, error } = await query;

            if (error) throw error;

            setLogs(data || []);
        } catch (error) {
            console.error('Erro ao carregar audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        if (!profile?.clinic_id) return;

        try {
            const { data } = await supabase
                .from('users')
                .select('id, name')
                .eq('clinic_id', profile.clinic_id);

            setUsers(data || []);
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
        }
    };

    const filteredLogs = logs.filter(log => {
        // Filtro de busca
        if (searchTerm && !log.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !log.changes_summary?.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }

        // Filtro de ação
        if (filterAction !== 'ALL' && log.action_type !== filterAction) {
            return false;
        }

        // Filtro de entidade
        if (filterEntity !== 'ALL' && log.entity_type !== filterEntity) {
            return false;
        }

        // Filtro de usuário
        if (filterUser !== 'ALL' && log.user_name !== filterUser) {
            return false;
        }

        // Filtro de data
        if (dateFrom && new Date(log.created_at) < new Date(dateFrom)) {
            return false;
        }
        if (dateTo && new Date(log.created_at) > new Date(dateTo)) {
            return false;
        }

        return true;
    });

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            case 'UPDATE': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
            case 'DELETE': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
            case 'LOGIN': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
            case 'LOGOUT': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
            case 'LOGIN_FAILED': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
        }
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'CREATE': return '➕';
            case 'UPDATE': return '✏️';
            case 'DELETE': return '🗑️';
            case 'LOGIN': return '🔓';
            case 'LOGOUT': return '🔒';
            case 'LOGIN_FAILED': return '⚠️';
            default: return '📝';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(date);
    };

    const exportToCSV = () => {
        const headers = ['Data/Hora', 'Usuário', 'Ação', 'Entidade', 'Descrição', 'IP'];
        const rows = filteredLogs.map(log => [
            formatDate(log.created_at),
            log.user_name,
            log.action_type,
            log.entity_type,
            log.changes_summary || log.entity_name,
            log.ip_address || 'N/A'
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const viewDetails = (log: AuditLog) => {
        setSelectedLog(log);
        setShowDetails(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Shield className="text-blue-600" size={28} />
                    Registro de Auditoria
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Histórico completo de todas as ações realizadas no sistema
                </p>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>

                    {/* Filter Action */}
                    <select
                        value={filterAction}
                        onChange={(e) => setFilterAction(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="ALL">Todas as Ações</option>
                        <option value="CREATE">Criação</option>
                        <option value="UPDATE">Atualização</option>
                        <option value="DELETE">Exclusão</option>
                        <option value="LOGIN">Login</option>
                        <option value="LOGOUT">Logout</option>
                        <option value="LOGIN_FAILED">Falha de Login</option>
                    </select>

                    {/* Filter Entity */}
                    <select
                        value={filterEntity}
                        onChange={(e) => setFilterEntity(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="ALL">Todas as Entidades</option>
                        <option value="PATIENT">Pacientes</option>
                        <option value="BUDGET">Orçamentos</option>
                        <option value="TRANSACTION">Transações</option>
                        <option value="APPOINTMENT">Agendamentos</option>
                        <option value="USER">Usuários</option>
                    </select>

                    {/* Filter User */}
                    <select
                        value={filterUser}
                        onChange={(e) => setFilterUser(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="ALL">Todos os Usuários</option>
                        {users.map(user => (
                            <option key={user.id} value={user.name}>{user.name}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Date From */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Data Inicial
                        </label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>

                    {/* Date To */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Data Final
                        </label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>

                    {/* Export Button */}
                    <div className="flex items-end">
                        <button
                            onClick={exportToCSV}
                            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                        >
                            <Download size={18} />
                            Exportar CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total de Registros</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{filteredLogs.length}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Criações</div>
                    <div className="text-2xl font-bold text-green-600">{filteredLogs.filter(l => l.action_type === 'CREATE').length}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Atualizações</div>
                    <div className="text-2xl font-bold text-blue-600">{filteredLogs.filter(l => l.action_type === 'UPDATE').length}</div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Exclusões</div>
                    <div className="text-2xl font-bold text-red-600">{filteredLogs.filter(l => l.action_type === 'DELETE').length}</div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Data/Hora
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Usuário
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Ação
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Entidade
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Descrição
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    IP
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                        Nenhum registro encontrado
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                                            {formatDate(log.created_at)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                            <div className="flex items-center gap-2">
                                                <User size={16} className="text-gray-400" />
                                                <div>
                                                    <div className="font-medium">{log.user_name}</div>
                                                    <div className="text-xs text-gray-500">{log.user_email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action_type)}`}>
                                                {getActionIcon(log.action_type)} {log.action_type}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                            {log.entity_type}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                            {log.changes_summary || log.entity_name}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 font-mono">
                                            {log.ip_address || 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <button
                                                onClick={() => viewDetails(log)}
                                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                                            >
                                                <Eye size={16} />
                                                Ver
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Details Modal */}
            {showDetails && selectedLog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                Detalhes do Registro de Auditoria
                            </h3>
                            <button
                                onClick={() => setShowDetails(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Data/Hora</label>
                                    <p className="text-gray-900 dark:text-white">{formatDate(selectedLog.created_at)}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Usuário</label>
                                    <p className="text-gray-900 dark:text-white">{selectedLog.user_name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Ação</label>
                                    <p className="text-gray-900 dark:text-white">{selectedLog.action_type}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Entidade</label>
                                    <p className="text-gray-900 dark:text-white">{selectedLog.entity_type}</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Descrição</label>
                                    <p className="text-gray-900 dark:text-white">{selectedLog.changes_summary}</p>
                                </div>
                            </div>

                            {selectedLog.old_value && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Valor Anterior</label>
                                    <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg text-xs overflow-x-auto">
                                        {JSON.stringify(selectedLog.old_value, null, 2)}
                                    </pre>
                                </div>
                            )}

                            {selectedLog.new_value && (
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Valor Novo</label>
                                    <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg text-xs overflow-x-auto">
                                        {JSON.stringify(selectedLog.new_value, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditLogViewer;
