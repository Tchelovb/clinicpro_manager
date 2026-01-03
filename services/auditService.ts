import { supabase } from '../src/lib/supabase';

/**
 * Audit Service - BOS Fortress
 * Gerencia logs de auditoria e rastreabilidade
 */

export interface AuditLogEntry {
    action_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'EXPORT' | 'IMPORT' | 'PIN_SUCCESS' | 'PIN_FAILED' | 'PIN_BLOCKED' | 'REFUND' | 'DISCOUNT' | 'BUDGET_OVERRIDE';
    entity_type: 'PATIENT' | 'BUDGET' | 'APPOINTMENT' | 'EXPENSE' | 'TRANSACTION' | 'CASH_REGISTER' | 'USER' | 'PROFESSIONAL' | 'PROCEDURE' | 'LEAD' | 'DOCUMENT' | 'CLINICAL_NOTE' | 'TREATMENT' | 'SECURITY_PIN' | 'INSTALLMENT' | 'SUPPLIER' | 'CATEGORY';
    entity_id?: string;
    entity_name?: string;
    old_value?: any;
    new_value?: any;
    changes_summary?: string;
}

export interface AuditLog {
    id: string;
    clinic_id: string;
    user_id: string;
    user_name: string;
    user_email: string;
    action_type: string;
    entity_type: string;
    entity_id?: string;
    entity_name?: string;
    old_value?: any;
    new_value?: any;
    changes_summary?: string;
    ip_address?: string;
    user_agent?: string;
    session_id?: string;
    created_at: string;
}

export interface AuditFilters {
    startDate?: string;
    endDate?: string;
    userId?: string;
    actionType?: string;
    entityType?: string;
    searchTerm?: string;
}

class AuditService {
    /**
     * Registra uma ação no audit log
     */
    async log(entry: AuditLogEntry): Promise<void> {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Buscar dados do usuário
            const { data: userData } = await supabase
                .from('users')
                .select('clinic_id, name, email')
                .eq('id', user.id)
                .single();

            // Capturar informações do navegador
            const userAgent = navigator.userAgent;
            const sessionId = sessionStorage.getItem('session_id') || crypto.randomUUID();
            sessionStorage.setItem('session_id', sessionId);

            await supabase.from('system_audit_logs').insert({
                clinic_id: userData?.clinic_id,
                user_id: user.id,
                user_name: userData?.name || user.email || 'Unknown',
                user_email: user.email,
                action_type: entry.action_type,
                entity_type: entry.entity_type,
                entity_id: entry.entity_id,
                entity_name: entry.entity_name,
                old_value: entry.old_value,
                new_value: entry.new_value,
                changes_summary: entry.changes_summary,
                user_agent: userAgent,
                session_id: sessionId
            });
        } catch (error) {
            console.error('Error logging audit action:', error);
        }
    }

    /**
     * Busca logs de auditoria com filtros
     */
    async getLogs(clinicId: string, filters?: AuditFilters, limit: number = 100): Promise<AuditLog[]> {
        try {
            let query = supabase
                .from('system_audit_logs')
                .select('*')
                .eq('clinic_id', clinicId)
                .order('created_at', { ascending: false })
                .limit(limit);

            // Aplicar filtros
            if (filters?.startDate) {
                query = query.gte('created_at', filters.startDate);
            }

            if (filters?.endDate) {
                query = query.lte('created_at', filters.endDate);
            }

            if (filters?.userId) {
                query = query.eq('user_id', filters.userId);
            }

            if (filters?.actionType) {
                query = query.eq('action_type', filters.actionType);
            }

            if (filters?.entityType) {
                query = query.eq('entity_type', filters.entityType);
            }

            if (filters?.searchTerm) {
                query = query.or(`entity_name.ilike.%${filters.searchTerm}%,changes_summary.ilike.%${filters.searchTerm}%`);
            }

            const { data, error } = await query;

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            return [];
        }
    }

    /**
     * Busca logs de uma entidade específica
     */
    async getEntityLogs(clinicId: string, entityType: string, entityId: string): Promise<AuditLog[]> {
        try {
            const { data, error } = await supabase
                .from('system_audit_logs')
                .select('*')
                .eq('clinic_id', clinicId)
                .eq('entity_type', entityType)
                .eq('entity_id', entityId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Error fetching entity logs:', error);
            return [];
        }
    }

    /**
     * Busca logs de um usuário específico
     */
    async getUserLogs(clinicId: string, userId: string, limit: number = 50): Promise<AuditLog[]> {
        try {
            const { data, error } = await supabase
                .from('system_audit_logs')
                .select('*')
                .eq('clinic_id', clinicId)
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Error fetching user logs:', error);
            return [];
        }
    }

    /**
     * Busca estatísticas de auditoria
     */
    async getStats(clinicId: string, startDate?: string, endDate?: string): Promise<any> {
        try {
            let query = supabase
                .from('system_audit_logs')
                .select('action_type, entity_type, user_id')
                .eq('clinic_id', clinicId);

            if (startDate) {
                query = query.gte('created_at', startDate);
            }

            if (endDate) {
                query = query.lte('created_at', endDate);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Processar estatísticas
            const stats = {
                total: data?.length || 0,
                byAction: {} as Record<string, number>,
                byEntity: {} as Record<string, number>,
                byUser: {} as Record<string, number>
            };

            data?.forEach((log: any) => {
                // Por tipo de ação
                stats.byAction[log.action_type] = (stats.byAction[log.action_type] || 0) + 1;

                // Por tipo de entidade
                stats.byEntity[log.entity_type] = (stats.byEntity[log.entity_type] || 0) + 1;

                // Por usuário
                stats.byUser[log.user_id] = (stats.byUser[log.user_id] || 0) + 1;
            });

            return stats;
        } catch (error) {
            console.error('Error fetching audit stats:', error);
            return {
                total: 0,
                byAction: {},
                byEntity: {},
                byUser: {}
            };
        }
    }

    /**
     * Exporta logs para CSV
     */
    async exportToCSV(clinicId: string, filters?: AuditFilters): Promise<string> {
        try {
            const logs = await this.getLogs(clinicId, filters, 10000); // Limite maior para export

            // Cabeçalho CSV
            const headers = [
                'Data/Hora',
                'Usuário',
                'Email',
                'Ação',
                'Entidade',
                'Nome da Entidade',
                'Resumo das Mudanças',
                'IP',
                'Navegador'
            ];

            // Linhas CSV
            const rows = logs.map(log => [
                new Date(log.created_at).toLocaleString('pt-BR'),
                log.user_name,
                log.user_email,
                log.action_type,
                log.entity_type,
                log.entity_name || '-',
                log.changes_summary || '-',
                log.ip_address || '-',
                log.user_agent || '-'
            ]);

            // Montar CSV
            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n');

            return csvContent;
        } catch (error) {
            console.error('Error exporting audit logs:', error);
            return '';
        }
    }

    /**
     * Baixa CSV de logs
     */
    async downloadCSV(clinicId: string, filters?: AuditFilters): Promise<void> {
        const csv = await this.exportToCSV(clinicId, filters);

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /**
     * Helpers para criar logs comuns
     */
    async logPatientCreated(patientId: string, patientName: string) {
        await this.log({
            action_type: 'CREATE',
            entity_type: 'PATIENT',
            entity_id: patientId,
            entity_name: patientName,
            changes_summary: `Paciente ${patientName} criado`
        });
    }

    async logPatientUpdated(patientId: string, patientName: string, oldData: any, newData: any) {
        await this.log({
            action_type: 'UPDATE',
            entity_type: 'PATIENT',
            entity_id: patientId,
            entity_name: patientName,
            old_value: oldData,
            new_value: newData,
            changes_summary: `Paciente ${patientName} atualizado`
        });
    }

    async logPatientDeleted(patientId: string, patientName: string) {
        await this.log({
            action_type: 'DELETE',
            entity_type: 'PATIENT',
            entity_id: patientId,
            entity_name: patientName,
            changes_summary: `Paciente ${patientName} excluído`
        });
    }

    async logBudgetCreated(budgetId: string, patientName: string, value: number) {
        await this.log({
            action_type: 'CREATE',
            entity_type: 'BUDGET',
            entity_id: budgetId,
            entity_name: `Orçamento - ${patientName}`,
            changes_summary: `Orçamento de R$ ${value.toFixed(2)} criado para ${patientName}`
        });
    }

    async logBudgetApproved(budgetId: string, patientName: string, value: number) {
        await this.log({
            action_type: 'UPDATE',
            entity_type: 'BUDGET',
            entity_id: budgetId,
            entity_name: `Orçamento - ${patientName}`,
            changes_summary: `Orçamento de R$ ${value.toFixed(2)} aprovado`
        });
    }

    async logTransactionCreated(transactionId: string, description: string, amount: number) {
        await this.log({
            action_type: 'CREATE',
            entity_type: 'TRANSACTION',
            entity_id: transactionId,
            entity_name: description,
            changes_summary: `Transação de R$ ${amount.toFixed(2)} criada`
        });
    }

    async logExpenseCreated(expenseId: string, description: string, amount: number) {
        await this.log({
            action_type: 'CREATE',
            entity_type: 'EXPENSE',
            entity_id: expenseId,
            entity_name: description,
            changes_summary: `Despesa de R$ ${amount.toFixed(2)} criada`
        });
    }
}

export const auditService = new AuditService();
export default auditService;
