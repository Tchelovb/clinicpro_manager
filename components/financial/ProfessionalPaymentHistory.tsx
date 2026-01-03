import React, { useState, useEffect } from 'react';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import {
    History, ChevronDown, ChevronUp, Calendar, DollarSign,
    TrendingDown, Wallet, PiggyBank, FileText, Loader2, Download
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ProfessionalPaymentHistoryProps {
    professionalId: string;
    embedded?: boolean;
}

interface HistoryRecord {
    id: string;
    period_month: number;
    period_year: number;
    settlement_date: string;
    total_gross: number;
    total_deductions: number;
    total_net_payable: number;
    total_clinic_profit: number;
    items_detail: any[];
    clinic_config: any;
    settled_by: string;
    notes: string;
}

interface CalculatedItem {
    id: string;
    execution_date: string;
    procedure_name: string;
    patient_name: string;
    total_value: number;
    taxes: number;
    cardFees: number;
    labCost: number;
    totalDeductions: number;
    netBase: number;
    professionalFee: number;
    clinicProfit: number;
    feeType: 'FIXED' | 'PERCENTAGE';
}

export const ProfessionalPaymentHistory: React.FC<ProfessionalPaymentHistoryProps> = ({
    professionalId,
    embedded = false
}) => {
    const { profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [records, setRecords] = useState<HistoryRecord[]>([]);
    const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

    useEffect(() => {
        if (professionalId) {
            loadHistory();
        }
    }, [professionalId]);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('professional_payment_history')
                .select('*')
                .eq('professional_id', professionalId)
                .order('period_year', { ascending: false })
                .order('period_month', { ascending: false });

            if (error) throw error;
            setRecords(data || []);
        } catch (error) {
            console.error('Error loading payment history:', error);
            toast.error('Erro ao carregar histórico de pagamentos');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatPeriod = (month: number, year: number) => {
        const monthNames = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        return `${monthNames[month - 1]}/${year}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const toggleExpand = (recordId: string) => {
        setExpandedRecord(expandedRecord === recordId ? null : recordId);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-blue-600" size={32} />
                    <p className="text-gray-600 dark:text-gray-400">Carregando histórico...</p>
                </div>
            </div>
        );
    }

    if (records.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                <History size={64} className="text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Nenhum Período Liquidado
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md">
                    Os períodos liquidados aparecerão aqui. Use a aba "Produção" para calcular e liquidar um novo período.
                </p>
            </div>
        );
    }

    return (
        <div className={embedded ? "space-y-6" : "max-w-7xl mx-auto p-6 space-y-6"}>
            {/* Header */}
            {!embedded && (
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <History className="text-blue-600" size={32} />
                            Histórico de Repasses
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            {records.length} período{records.length !== 1 ? 's' : ''} liquidado{records.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
            )}

            {/* Records List */}
            <div className="space-y-4">
                {records.map((record) => {
                    const isExpanded = expandedRecord === record.id;
                    const items: CalculatedItem[] = record.items_detail;

                    return (
                        <div
                            key={record.id}
                            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
                        >
                            {/* Summary Row */}
                            <div
                                className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                onClick={() => toggleExpand(record.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-6">
                                        {/* Period */}
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                <Calendar className="text-blue-600 dark:text-blue-400" size={24} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Período</p>
                                                <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                    {formatPeriod(record.period_month, record.period_year)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Amount Paid */}
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Valor Pago</p>
                                            <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                                {formatCurrency(record.total_net_payable)}
                                            </p>
                                        </div>

                                        {/* Settlement Date */}
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Data de Liquidação</p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {formatDate(record.settlement_date)}
                                            </p>
                                        </div>

                                        {/* Items Count */}
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Procedimentos</p>
                                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                                                {items.length}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Expand Button */}
                                    <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                                        {isExpanded ? (
                                            <ChevronUp size={24} className="text-gray-500" />
                                        ) : (
                                            <ChevronDown size={24} className="text-gray-500" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Expanded Detail */}
                            {isExpanded && (
                                <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                                    {/* Summary Cards */}
                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {/* Total Gross */}
                                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <DollarSign className="text-blue-600 dark:text-blue-400" size={20} />
                                                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">Bruto</span>
                                            </div>
                                            <p className="text-2xl font-black text-blue-700 dark:text-blue-300">
                                                {formatCurrency(record.total_gross)}
                                            </p>
                                            <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
                                                Total Produzido
                                            </p>
                                        </div>

                                        {/* Total Deductions */}
                                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-700 rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <TrendingDown className="text-orange-600 dark:text-orange-400" size={20} />
                                                <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase">Deduções</span>
                                            </div>
                                            <p className="text-2xl font-black text-orange-700 dark:text-orange-300">
                                                {formatCurrency(record.total_deductions)}
                                            </p>
                                            <p className="text-xs text-orange-600/70 dark:text-orange-400/70 mt-1">
                                                Impostos + Taxas + Lab
                                            </p>
                                        </div>

                                        {/* Total Net Payable */}
                                        <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20 border border-green-200 dark:border-green-700 rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <Wallet className="text-green-600 dark:text-green-400" size={20} />
                                                <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase">Repasse</span>
                                            </div>
                                            <p className="text-2xl font-black text-green-700 dark:text-green-300">
                                                {formatCurrency(record.total_net_payable)}
                                            </p>
                                            <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">
                                                Pago ao Profissional
                                            </p>
                                        </div>

                                        {/* Clinic Profit */}
                                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-700 rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <PiggyBank className="text-purple-600 dark:text-purple-400" size={20} />
                                                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">Lucro</span>
                                            </div>
                                            <p className="text-2xl font-black text-purple-700 dark:text-purple-300">
                                                {formatCurrency(record.total_clinic_profit)}
                                            </p>
                                            <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-1">
                                                Lucro Líquido da Clínica
                                            </p>
                                        </div>
                                    </div>

                                    {/* Detailed Table */}
                                    <div className="px-6 pb-6">
                                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                    <FileText size={16} className="text-blue-600" />
                                                    Extrato Detalhado ({items.length} procedimentos)
                                                </h4>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full">
                                                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Data</th>
                                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Paciente</th>
                                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Procedimento</th>
                                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Bruto</th>
                                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Deduções</th>
                                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Base Líquida</th>
                                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Repasse</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                        {items.map((item, index) => (
                                                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                                                    {new Date(item.execution_date).toLocaleDateString('pt-BR')}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                                                    {item.patient_name}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                                                    {item.procedure_name}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-right font-semibold text-blue-600 dark:text-blue-400">
                                                                    {formatCurrency(item.total_value)}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-right text-orange-600 dark:text-orange-400">
                                                                    {formatCurrency(item.totalDeductions)}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-gray-100">
                                                                    {formatCurrency(item.netBase)}
                                                                </td>
                                                                <td className="px-4 py-3 text-sm text-right font-bold text-green-600 dark:text-green-400">
                                                                    {formatCurrency(item.professionalFee)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
