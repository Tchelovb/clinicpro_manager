import React, { useState, useEffect } from 'react';
import {
    Shield, AlertTriangle, Eye, Trash2, Edit, Plus,
    Clock, User, FileText, Filter, Search
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useHaptic } from '../../utils/haptics';
import toast from 'react-hot-toast';

interface AuditLog {
    id: string;
    table_name: string;
    record_id: string;
    action_type: 'CREATE' | 'UPDATE' | 'DELETE';
    old_data?: any;
    new_data?: any;
    user_id: string;
    user_name?: string;
    notes?: string;
    created_at: string;
}

/**
 * AuditView
 * 
 * View de Auditoria Financeira
 * - Timeline de logs de auditoria
 * - Botão de Pânico (ações críticas)
 * - Filtros por usuário/tipo/tabela
 * - Detalhes de alterações (old_data vs new_data)
 */
export const AuditView: React.FC = () => {
    const { profile } = useAuth();
    const haptic = useHaptic();

    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCriticalOnly, setShowCriticalOnly] = useState(false);

    useEffect(() => {
        const fetchAuditLogs = async () => {
            if (!profile?.clinic_id) return;

            try {
                setLoading(true);

                const { data, error } = await supabase
                    .from('financial_audit_trail')
                    .select('*')
                    .eq('clinic_id', profile.clinic_id)
                    .order('created_at', { ascending: false })
                    .limit(100);

                if (error) throw error;

                setLogs(data || []);

            } catch (error: any) {
                console.error('Erro ao buscar logs:', error);
                toast.error('Erro ao carregar auditoria');
            } finally {
                setLoading(false);
            }
        };

        fetchAuditLogs();
    }, [profile?.clinic_id]);

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'CREATE':
                return <Plus size={16} className="text-emerald-600 dark:text-emerald-400" />;
            case 'UPDATE':
                return <Edit size={16} className="text-blue-600 dark:text-blue-400" />;
            case 'DELETE':
                return <Trash2 size={16} className="text-red-600 dark:text-red-400" />;
            default:
                return <Eye size={16} className="text-gray-600 dark:text-gray-400" />;
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE':
                return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'UPDATE':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'DELETE':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    const isCriticalAction = (log: AuditLog) => {
        return log.action_type === 'DELETE' ||
            (log.action_type === 'UPDATE' && log.table_name === 'transactions') ||
            (log.action_type === 'UPDATE' && log.table_name === 'cash_registers');
    };

    const filteredLogs = showCriticalOnly
        ? logs.filter(isCriticalAction)
        : logs;

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Shield className="text-blue-600 dark:text-blue-400" size={28} />
                        Auditoria Financeira
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Logs e rastreamento de ações críticas
                    </p>
                </div>

                {/* Filtros */}
                <div className="flex items-center gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <Search size={18} />
                        <span className="text-sm">Buscar</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <Filter size={18} />
                        <span className="text-sm">Filtros</span>
                    </button>
                </div>
            </div>

            {/* Botão de Pânico */}
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700 rounded-xl p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-red-100 dark:bg-red-900/40 rounded-lg">
                        <AlertTriangle className="text-red-600 dark:text-red-400" size={32} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-red-900 dark:text-red-100 mb-2">
                            🚨 Botão de Pânico - Ações Críticas
                        </h3>
                        <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                            Visualize apenas as ações críticas: exclusões, estornos e alterações em transações/caixa.
                            Estas ações requerem atenção especial e são destacadas para auditoria rigorosa.
                        </p>
                        <button
                            onClick={() => {
                                haptic.warning();
                                setShowCriticalOnly(!showCriticalOnly);
                            }}
                            className={`
                px-6 py-3 rounded-lg font-bold shadow-sm transition-all
                ${showCriticalOnly
                                    ? 'bg-gray-600 hover:bg-gray-700 text-white'
                                    : 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                                }
              `}
                        >
                            {showCriticalOnly ? '✅ Mostrar Todas as Ações' : '🚨 Ativar Botão de Pânico'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total de Logs</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{logs.length}</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg p-4">
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-1">Criações</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {logs.filter(l => l.action_type === 'CREATE').length}
                    </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Alterações</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {logs.filter(l => l.action_type === 'UPDATE').length}
                    </p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                    <p className="text-sm text-red-700 dark:text-red-300 mb-1">Exclusões</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {logs.filter(l => l.action_type === 'DELETE').length}
                    </p>
                </div>
            </div>

            {/* Timeline de Auditoria */}
            <div className="bg-card rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                    <h3 className="font-bold text-gray-900 dark:text-white">
                        {showCriticalOnly ? '🚨 Ações Críticas' : 'Timeline de Auditoria'}
                    </h3>
                </div>

                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                    {filteredLogs.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            <Shield size={48} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">
                                {showCriticalOnly
                                    ? 'Nenhuma ação crítica encontrada'
                                    : 'Nenhum log de auditoria encontrado'}
                            </p>
                        </div>
                    ) : (
                        filteredLogs.map((log) => (
                            <div
                                key={log.id}
                                className={`
                  p-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors
                  ${isCriticalAction(log) ? 'bg-red-50/50 dark:bg-red-900/10 border-l-4 border-red-500' : ''}
                `}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Ícone da Ação */}
                                    <div className={`p-2 rounded-lg ${getActionColor(log.action_type)}`}>
                                        {getActionIcon(log.action_type)}
                                    </div>

                                    {/* Detalhes */}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white">
                                                    {log.action_type} em {log.table_name}
                                                    {isCriticalAction(log) && (
                                                        <span className="ml-2 text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">
                                                            CRÍTICO
                                                        </span>
                                                    )}
                                                </p>
                                                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    <span className="flex items-center gap-1">
                                                        <User size={12} />
                                                        {log.user_name || 'N/A'}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={12} />
                                                        {new Date(log.created_at).toLocaleString('pt-BR')}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <FileText size={12} />
                                                        ID: {log.record_id.slice(0, 8)}...
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Notas */}
                                        {log.notes && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                                📝 {log.notes}
                                            </p>
                                        )}

                                        {/* Dados Alterados (se UPDATE ou DELETE) */}
                                        {(log.action_type === 'UPDATE' || log.action_type === 'DELETE') && log.old_data && (
                                            <details className="mt-3">
                                                <summary className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">
                                                    Ver alterações
                                                </summary>
                                                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-xs">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="font-bold text-red-600 dark:text-red-400 mb-1">Antes:</p>
                                                            <pre className="text-gray-600 dark:text-gray-400 overflow-x-auto">
                                                                {JSON.stringify(log.old_data, null, 2)}
                                                            </pre>
                                                        </div>
                                                        {log.new_data && (
                                                            <div>
                                                                <p className="font-bold text-emerald-600 dark:text-emerald-400 mb-1">Depois:</p>
                                                                <pre className="text-gray-600 dark:text-gray-400 overflow-x-auto">
                                                                    {JSON.stringify(log.new_data, null, 2)}
                                                                </pre>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </details>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {filteredLogs.length > 0 && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                            <span>
                                Mostrando {filteredLogs.length} log(s)
                            </span>
                            <button className="text-blue-600 dark:text-blue-400 hover:underline">
                                Carregar mais →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuditView;
