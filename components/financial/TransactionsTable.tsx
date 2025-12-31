import React from 'react';
import {
    ArrowUpCircle, ArrowDownCircle, ArrowRightLeft,
    Calendar, Search, Filter, Download, Eye, Trash2
} from 'lucide-react';
import { SecureActionWrapper } from './SecureActionWrapper';
import { useHaptic } from '../../utils/haptics';

interface Transaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    category: string;
    payment_method: string;
    payment_status: string;
}

interface TransactionsTableProps {
    transactions: Transaction[];
    onViewDetails: (transaction: Transaction) => void;
    onRefund?: (transaction: Transaction) => void;
}

/**
 * TransactionsTable
 * 
 * Tabela de transações com ZERO INLINE EDITING
 * Todas as ações abrem Dialog/Drawer
 * 
 * Princípios SAP/Bancários:
 * - Sem edição direta
 * - Ações via modal
 * - Auditoria completa
 */
export const TransactionsTable: React.FC<TransactionsTableProps> = ({
    transactions,
    onViewDetails,
    onRefund
}) => {
    const haptic = useHaptic();

    const handleAction = (action: string, transaction: Transaction) => {
        haptic.light();

        if (action === 'view') {
            onViewDetails(transaction);
        } else if (action === 'refund' && onRefund) {
            onRefund(transaction);
        }
    };

    return (
        <div className="bg-card rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            {/* Header da Tabela */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 dark:text-white">
                        Transações Recentes
                    </h3>
                    <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                            <Search size={18} className="text-gray-500" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                            <Filter size={18} className="text-gray-500" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                            <Download size={18} className="text-gray-500" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabela */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Data
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Descrição
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Categoria
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Método
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
                        {transactions.map((transaction) => (
                            <tr
                                key={transaction.id}
                                className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                            >
                                {/* Data */}
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    {new Date(transaction.date).toLocaleDateString('pt-BR')}
                                </td>

                                {/* Descrição */}
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                    <div className="flex items-center gap-2">
                                        {transaction.type === 'INCOME' ? (
                                            <ArrowUpCircle size={16} className="text-emerald-600 dark:text-emerald-400" />
                                        ) : (
                                            <ArrowDownCircle size={16} className="text-red-600 dark:text-red-400" />
                                        )}
                                        <span className="font-medium">{transaction.description}</span>
                                    </div>
                                </td>

                                {/* Categoria */}
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {transaction.category}
                                </td>

                                {/* Método */}
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {transaction.payment_method}
                                </td>

                                {/* Valor */}
                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-bold">
                                    <span className={
                                        transaction.type === 'INCOME'
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : 'text-red-600 dark:text-red-400'
                                    }>
                                        {transaction.type === 'INCOME' ? '+' : '-'}
                                        R$ {transaction.amount.toLocaleString('pt-BR', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </span>
                                </td>

                                {/* Status */}
                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                    <span className={`
                    inline-flex px-2 py-1 text-xs font-medium rounded-full
                    ${transaction.payment_status === 'Settled'
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                            : transaction.payment_status === 'Pending'
                                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                                        }
                  `}>
                                        {transaction.payment_status}
                                    </span>
                                </td>

                                {/* Ações (ZERO INLINE EDITING) */}
                                <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                                    <div className="flex items-center justify-end gap-2">
                                        {/* Ver Detalhes */}
                                        <button
                                            onClick={() => handleAction('view', transaction)}
                                            className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors group"
                                            title="Ver detalhes"
                                        >
                                            <Eye size={16} className="text-blue-600 dark:text-blue-400" />
                                        </button>

                                        {/* Estornar (apenas para Settled) */}
                                        {transaction.payment_status === 'Settled' && onRefund && (
                                            <SecureActionWrapper action="Estornar Transação">
                                                <button
                                                    onClick={() => handleAction('refund', transaction)}
                                                    className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors group"
                                                    title="Estornar (requer PIN)"
                                                >
                                                    <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                                                </button>
                                            </SecureActionWrapper>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            {transactions.length === 0 && (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <Calendar size={48} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma transação encontrada</p>
                </div>
            )}

            {transactions.length > 0 && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>
                            Mostrando {transactions.length} transação(ões)
                        </span>
                        <button className="text-blue-600 dark:text-blue-400 hover:underline">
                            Carregar mais →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransactionsTable;
