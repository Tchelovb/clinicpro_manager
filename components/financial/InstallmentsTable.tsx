import React from 'react';
import {
    Calendar, Clock, AlertTriangle, CheckCircle,
    Eye, DollarSign, User
} from 'lucide-react';
import { SecureActionWrapper } from './SecureActionWrapper';
import { useHaptic } from '../../utils/haptics';

interface Installment {
    id: string;
    patient_id: string;
    patient_name?: string;
    installment_number: number;
    total_installments: number;
    amount: number;
    due_date: string;
    paid_date?: string;
    status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL';
    payment_method?: string;
    notes?: string;
}

interface InstallmentsTableProps {
    installments: Installment[];
    onReceivePayment: (installment: Installment) => void;
    onViewDetails: (installment: Installment) => void;
}

/**
 * InstallmentsTable
 * 
 * Tabela de parcelas a receber com ZERO INLINE EDITING
 * Todas as ações abrem Dialog/Drawer
 * 
 * Princípios SAP/Bancários:
 * - Sem edição direta
 * - Recebimento via AdvancedPaymentModal
 * - Auditoria completa
 */
export const InstallmentsTable: React.FC<InstallmentsTableProps> = ({
    installments,
    onReceivePayment,
    onViewDetails
}) => {
    const haptic = useHaptic();

    const getStatusBadge = (installment: Installment) => {
        const today = new Date().toISOString().split('T')[0];
        const dueDate = installment.due_date;

        if (installment.status === 'PAID') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <CheckCircle size={12} />
                    Pago
                </span>
            );
        }

        if (installment.status === 'PARTIAL') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    <Clock size={12} />
                    Parcial
                </span>
            );
        }

        if (dueDate < today) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    <AlertTriangle size={12} />
                    Vencido
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                <Clock size={12} />
                Pendente
            </span>
        );
    };

    const getDaysOverdue = (dueDate: string) => {
        const today = new Date();
        const due = new Date(dueDate);
        const diffTime = today.getTime() - due.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    return (
        <div className="bg-card rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                <h3 className="font-bold text-gray-900 dark:text-white">
                    Parcelas a Receber
                </h3>
            </div>

            {/* Tabela */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Paciente
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Parcela
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Vencimento
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Valor
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Ações
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {installments.map((installment) => {
                            const daysOverdue = getDaysOverdue(installment.due_date);
                            const isOverdue = daysOverdue > 0 && installment.status !== 'PAID';

                            return (
                                <tr
                                    key={installment.id}
                                    className={`
                    hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors
                    ${isOverdue ? 'bg-red-50/50 dark:bg-red-900/10' : ''}
                  `}
                                >
                                    {/* Paciente */}
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                        <div className="flex items-center gap-2">
                                            <User size={16} className="text-gray-400" />
                                            <span className="font-medium">{installment.patient_name || 'N/A'}</span>
                                        </div>
                                    </td>

                                    {/* Parcela */}
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {installment.installment_number}/{installment.total_installments}
                                    </td>

                                    {/* Vencimento */}
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <div className="flex flex-col">
                                            <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-900 dark:text-white'}>
                                                {new Date(installment.due_date).toLocaleDateString('pt-BR')}
                                            </span>
                                            {isOverdue && (
                                                <span className="text-xs text-red-600 dark:text-red-400">
                                                    {daysOverdue} dia(s) atrasado
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Valor */}
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-bold text-gray-900 dark:text-white">
                                        R$ {installment.amount.toLocaleString('pt-BR', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </td>

                                    {/* Status */}
                                    <td className="px-4 py-3 whitespace-nowrap text-center">
                                        {getStatusBadge(installment)}
                                    </td>

                                    {/* Ações */}
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* Ver Detalhes */}
                                            <button
                                                onClick={() => {
                                                    haptic.light();
                                                    onViewDetails(installment);
                                                }}
                                                className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                title="Ver detalhes"
                                            >
                                                <Eye size={16} className="text-blue-600 dark:text-blue-400" />
                                            </button>

                                            {/* Receber (apenas se não pago) */}
                                            {installment.status !== 'PAID' && (
                                                <SecureActionWrapper action="Receber Parcela">
                                                    <button
                                                        onClick={() => {
                                                            haptic.medium();
                                                            onReceivePayment(installment);
                                                        }}
                                                        className="p-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                                                        title="Receber pagamento"
                                                    >
                                                        <DollarSign size={16} className="text-emerald-600 dark:text-emerald-400" />
                                                    </button>
                                                </SecureActionWrapper>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            {installments.length === 0 && (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <Calendar size={48} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma parcela encontrada</p>
                </div>
            )}

            {installments.length > 0 && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>
                            Mostrando {installments.length} parcela(s)
                        </span>
                        <span className="font-medium">
                            Total: R$ {installments.reduce((sum, i) => sum + i.amount, 0).toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstallmentsTable;
