import React from 'react';
import {
    Calendar, Clock, AlertTriangle, CheckCircle,
    Eye, DollarSign, Building, FileText
} from 'lucide-react';
import { SecureActionWrapper } from './SecureActionWrapper';
import { useHaptic } from '../../utils/haptics';

interface Expense {
    id: string;
    supplier_id?: string;
    supplier_name?: string;
    category: string;
    description: string;
    amount: number;
    due_date: string;
    paid_date?: string;
    status: 'PENDING' | 'PAID' | 'OVERDUE' | 'SCHEDULED';
    payment_method?: string;
    invoice_number?: string;
    notes?: string;
}

interface ExpensesTableProps {
    expenses: Expense[];
    onPayExpense: (expense: Expense) => void;
    onViewDetails: (expense: Expense) => void;
}

/**
 * ExpensesTable
 * 
 * Tabela de despesas a pagar com ZERO INLINE EDITING
 * Todas as ações abrem Dialog/Drawer
 * 
 * Princípios SAP/Bancários:
 * - Sem edição direta
 * - Pagamento via modal
 * - Auditoria completa
 */
export const ExpensesTable: React.FC<ExpensesTableProps> = ({
    expenses,
    onPayExpense,
    onViewDetails
}) => {
    const haptic = useHaptic();

    const getStatusBadge = (expense: Expense) => {
        const today = new Date().toISOString().split('T')[0];
        const dueDate = expense.due_date;

        if (expense.status === 'PAID') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <CheckCircle size={12} />
                    Pago
                </span>
            );
        }

        if (expense.status === 'SCHEDULED') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    <Clock size={12} />
                    Agendado
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
                    Despesas a Pagar
                </h3>
            </div>

            {/* Tabela */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Fornecedor
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Descrição
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Categoria
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
                        {expenses.map((expense) => {
                            const daysOverdue = getDaysOverdue(expense.due_date);
                            const isOverdue = daysOverdue > 0 && expense.status !== 'PAID';

                            return (
                                <tr
                                    key={expense.id}
                                    className={`
                    hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors
                    ${isOverdue ? 'bg-red-50/50 dark:bg-red-900/10' : ''}
                  `}
                                >
                                    {/* Fornecedor */}
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                        <div className="flex items-center gap-2">
                                            <Building size={16} className="text-gray-400" />
                                            <span className="font-medium">{expense.supplier_name || 'N/A'}</span>
                                        </div>
                                    </td>

                                    {/* Descrição */}
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                        <div className="flex flex-col">
                                            <span className="font-medium">{expense.description}</span>
                                            {expense.invoice_number && (
                                                <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                    <FileText size={10} />
                                                    NF: {expense.invoice_number}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    {/* Categoria */}
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {expense.category}
                                    </td>

                                    {/* Vencimento */}
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <div className="flex flex-col">
                                            <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-900 dark:text-white'}>
                                                {new Date(expense.due_date).toLocaleDateString('pt-BR')}
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
                                        R$ {expense.amount.toLocaleString('pt-BR', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </td>

                                    {/* Status */}
                                    <td className="px-4 py-3 whitespace-nowrap text-center">
                                        {getStatusBadge(expense)}
                                    </td>

                                    {/* Ações */}
                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* Ver Detalhes */}
                                            <button
                                                onClick={() => {
                                                    haptic.light();
                                                    onViewDetails(expense);
                                                }}
                                                className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                title="Ver detalhes"
                                            >
                                                <Eye size={16} className="text-blue-600 dark:text-blue-400" />
                                            </button>

                                            {/* Pagar (apenas se não pago) */}
                                            {expense.status !== 'PAID' && (
                                                <SecureActionWrapper action="Pagar Despesa">
                                                    <button
                                                        onClick={() => {
                                                            haptic.medium();
                                                            onPayExpense(expense);
                                                        }}
                                                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                                        title="Pagar despesa"
                                                    >
                                                        <DollarSign size={16} className="text-red-600 dark:text-red-400" />
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
            {expenses.length === 0 && (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <Calendar size={48} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma despesa encontrada</p>
                </div>
            )}

            {expenses.length > 0 && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>
                            Mostrando {expenses.length} despesa(s)
                        </span>
                        <span className="font-medium">
                            Total: R$ {expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString('pt-BR', {
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

export default ExpensesTable;
