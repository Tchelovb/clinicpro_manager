import React, { useEffect, useState } from 'react';
import { AlertTriangle, Phone, Mail, DollarSign, Calendar } from 'lucide-react';
import { orthoService } from '../../services/orthoService';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export const OrthoAgingReport: React.FC = () => {
    const { profile } = useAuth();
    const [aging, setAging] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.clinic_id) {
            loadAging();
        }
    }, [profile?.clinic_id]);

    const loadAging = async () => {
        try {
            const data = await orthoService.getContractsAging(profile!.clinic_id);
            setAging(data);
        } catch (error) {
            console.error('Erro ao carregar aging:', error);
            toast.error('Erro ao carregar relatório');
        } finally {
            setLoading(false);
        }
    };

    const getSeverityColor = (days: number) => {
        if (days > 30) return 'red';
        if (days > 15) return 'orange';
        if (days > 10) return 'yellow';
        return 'gray';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (aging.length === 0) {
        return (
            <div className="text-center p-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Nenhuma inadimplência encontrada
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                    Todos os contratos ortodônticos estão em dia! 🎉
                </p>
            </div>
        );
    }

    const totalOverdue = aging.reduce((sum, item) => sum + (item.overdue_amount || 0), 0);
    const totalInstallments = aging.reduce((sum, item) => sum + (item.overdue_installments || 0), 0);

    return (
        <div className="space-y-6">
            {/* Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm text-red-600 dark:text-red-400">Contratos Inadimplentes</p>
                            <p className="text-2xl font-bold text-red-900 dark:text-red-100">{aging.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <p className="text-sm text-orange-600 dark:text-orange-400">Parcelas Vencidas</p>
                            <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{totalInstallments}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-sm text-yellow-600 dark:text-yellow-400">Valor em Atraso</p>
                            <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                                R$ {totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lista de Inadimplentes */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Paciente
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Tipo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Parcelas Vencidas
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Valor em Atraso
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Dias de Atraso
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {aging.map((item) => {
                                const severityColor = getSeverityColor(item.days_overdue);
                                return (
                                    <tr key={item.contract_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {item.patient_name}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {item.patient_phone}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-900 dark:text-white">
                                                {item.contract_type === 'ALIGNERS' ? 'Alinhadores' : 'Aparelho Fixo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${severityColor}-100 dark:bg-${severityColor}-900/30 text-${severityColor}-800 dark:text-${severityColor}-200`}>
                                                {item.overdue_installments} parcela{item.overdue_installments > 1 ? 's' : ''}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                                R$ {(item.overdue_amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${severityColor}-100 dark:bg-${severityColor}-900/30 text-${severityColor}-800 dark:text-${severityColor}-200`}>
                                                {item.days_overdue} dia{item.days_overdue > 1 ? 's' : ''}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => window.open(`tel:${item.patient_phone}`)}
                                                    className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                                    title="Ligar"
                                                >
                                                    <Phone className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => window.open(`https://wa.me/${item.patient_phone.replace(/\D/g, '')}`)}
                                                    className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                                                    title="WhatsApp"
                                                >
                                                    <Mail className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
