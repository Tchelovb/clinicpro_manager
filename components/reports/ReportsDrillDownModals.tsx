import React from 'react';
import { X, Calendar, DollarSign, User, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const DrillDownModal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                    {children}
                </div>
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

interface TransactionListProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    transactions: any[];
    type: 'income' | 'expense';
}

export const TransactionListModal: React.FC<TransactionListProps> = ({ isOpen, onClose, title, transactions, type }) => {
    const { patients } = useData();

    const getPatientName = (patientId: string) => {
        if (!patientId) return '-';
        return patients.find(p => p.id === patientId)?.name || 'Paciente Removido';
    };

    return (
        <DrillDownModal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="px-4 py-3">Data</th>
                            <th className="px-4 py-3">Descrição</th>
                            <th className="px-4 py-3">Categoria</th>
                            <th className="px-4 py-3">Paciente</th>
                            <th className="px-4 py-3 text-right">Valor</th>
                            <th className="px-4 py-3 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                    {new Date(tx.date).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                    {tx.description}
                                </td>
                                <td className="px-4 py-3">
                                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                        {tx.category}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                    {getPatientName(tx.patient_id)}
                                </td>
                                <td className={`px-4 py-3 text-right font-semibold ${type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                    }`}>
                                    {type === 'income' ? '+ ' : '- '}
                                    R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${tx.status === 'paid'
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                        }`}>
                                        {tx.status === 'paid' ? 'Pago' : 'Pendente'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {transactions.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                    Nenhum registro encontrado neste período.
                                </td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot className="bg-gray-50 dark:bg-gray-700/50 font-semibold text-gray-900 dark:text-white">
                        <tr>
                            <td colSpan={4} className="px-4 py-3 text-right">Total</td>
                            <td className="px-4 py-3 text-right">
                                R$ {transactions.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </DrillDownModal>
    );
};

interface TreatmentListProps {
    isOpen: boolean;
    onClose: () => void;
    treatments: any[];
}

export const TreatmentListModal: React.FC<TreatmentListProps> = ({ isOpen, onClose, treatments }) => {
    return (
        <DrillDownModal isOpen={isOpen} onClose={onClose} title="Detalhamento de Tratamentos">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="px-4 py-3">Início</th>
                            <th className="px-4 py-3">Paciente</th>
                            <th className="px-4 py-3">Procedimentos</th>
                            <th className="px-4 py-3 text-right">Valor Total</th>
                            <th className="px-4 py-3 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {treatments.map((t) => (
                            <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                    {new Date(t.start_date || t.created_at).toLocaleDateString('pt-BR')}
                                </td>
                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                    {t.patient_name || 'Paciente'}
                                </td>
                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-xs truncate">
                                    {t.description || '-'}
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                                    R$ {(t.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className="px-2 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                        {t.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {treatments.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                    Nenhum tratamento iniciado neste período.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </DrillDownModal>
    );
};
