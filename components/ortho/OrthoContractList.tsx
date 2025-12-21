import React, { useEffect, useState } from 'react';
import { Calendar, DollarSign, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { orthoService, OrthoContract } from '../../services/orthoService';
import toast from 'react-hot-toast';

interface OrthoContractListProps {
    patientId: string;
    onSelectContract?: (contract: OrthoContract) => void;
    reload?: number; // Timestamp para forçar reload
}

export const OrthoContractList: React.FC<OrthoContractListProps> = ({ patientId, onSelectContract, reload }) => {
    const [contracts, setContracts] = useState<OrthoContract[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadContracts();
    }, [patientId, reload]); // Recarrega quando reload mudar

    const loadContracts = async () => {
        try {
            const data = await orthoService.getContractsByPatient(patientId);
            setContracts(data);
        } catch (error) {
            console.error('Erro ao carregar contratos:', error);
            toast.error('Erro ao carregar contratos');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            ACTIVE: { icon: CheckCircle, color: 'green', label: 'Ativo' },
            SUSPENDED: { icon: AlertCircle, color: 'red', label: 'Suspenso' },
            COMPLETED: { icon: CheckCircle, color: 'blue', label: 'Concluído' },
            CANCELLED: { icon: XCircle, color: 'gray', label: 'Cancelado' },
        };

        const badge = badges[status as keyof typeof badges] || badges.ACTIVE;
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-${badge.color}-100 dark:bg-${badge.color}-900/30 text-${badge.color}-700 dark:text-${badge.color}-300`}>
                <Icon className="w-3 h-3" />
                {badge.label}
            </span>
        );
    };

    const getContractTypeLabel = (type: string) => {
        const labels = {
            ALIGNERS: 'Alinhadores (Invisalign)',
            FIXED_BRACES: 'Aparelho Fixo',
            CERAMIC: 'Aparelho Cerâmico',
            LINGUAL: 'Aparelho Lingual',
            ORTHOPEDIC: 'Ortopedia Funcional',
        };
        return labels[type as keyof typeof labels] || type;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (contracts.length === 0) {
        return (
            <div className="text-center p-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400">Nenhum contrato ortodôntico encontrado</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {contracts.map((contract) => (
                <div
                    key={contract.id}
                    onClick={() => onSelectContract?.(contract)}
                    className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-200 dark:border-gray-700"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                                {getContractTypeLabel(contract.contract_type)}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Início: {new Date(contract.start_date).toLocaleDateString('pt-BR')}
                            </p>
                        </div>
                        {getStatusBadge(contract.status)}
                    </div>

                    {/* Informações Financeiras */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Valor Total</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                R$ {contract.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Entrada</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                R$ {contract.down_payment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Mensalidade</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                R$ {contract.monthly_payment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Parcelas</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                {contract.number_of_months}x
                            </p>
                        </div>
                    </div>

                    {/* Alertas */}
                    {contract.status === 'SUSPENDED' && contract.suspension_reason && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-red-900 dark:text-red-100">Contrato Suspenso</p>
                                <p className="text-xs text-red-700 dark:text-red-300 mt-1">{contract.suspension_reason}</p>
                            </div>
                        </div>
                    )}

                    {contract.block_scheduling_if_overdue && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-3">
                            <Clock className="w-3 h-3" />
                            <span>Bloqueio automático após {contract.overdue_tolerance_days} dias de atraso</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
