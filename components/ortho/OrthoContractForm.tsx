import React, { useState } from 'react';
import { Calendar, DollarSign, User, FileText, X } from 'lucide-react';
import { orthoService, OrthoContract } from '../../services/orthoService';
import toast from 'react-hot-toast';

interface OrthoContractFormProps {
    patientId: string;
    patientName: string;
    clinicId: string;
    budgetId?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export const OrthoContractForm: React.FC<OrthoContractFormProps> = ({
    patientId,
    patientName,
    clinicId,
    budgetId,
    onSuccess,
    onCancel,
}) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        contract_type: 'ALIGNERS' as const,
        total_value: 15000,
        down_payment: 3000,
        number_of_months: 24,
        billing_day: 10,
        start_date: new Date().toISOString().split('T')[0],
        auto_charge: false,
        block_scheduling_if_overdue: true,
        overdue_tolerance_days: 10,
        notes: '',
    });

    const monthlyPayment = (formData.total_value - formData.down_payment) / formData.number_of_months;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const estimatedEndDate = new Date(formData.start_date);
            estimatedEndDate.setMonth(estimatedEndDate.getMonth() + formData.number_of_months);

            const contract = await orthoService.createContract({
                clinic_id: clinicId,
                patient_id: patientId,
                budget_id: budgetId,
                ...formData,
                monthly_payment: monthlyPayment,
                estimated_end_date: estimatedEndDate.toISOString().split('T')[0],
                status: 'ACTIVE',
            });

            // Gerar parcelas automaticamente
            await orthoService.generateInstallments(contract.id);

            toast.success('Contrato ortodôntico criado com sucesso!');
            onSuccess();
        } catch (error: any) {
            console.error('Erro ao criar contrato:', error);
            toast.error(error.message || 'Erro ao criar contrato');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Novo Contrato Ortodôntico
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Paciente: {patientName}
                        </p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Tipo de Tratamento */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Tipo de Tratamento
                        </label>
                        <select
                            value={formData.contract_type}
                            onChange={(e) => setFormData({ ...formData, contract_type: e.target.value as any })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            required
                        >
                            <option value="ALIGNERS">Alinhadores (Invisalign)</option>
                            <option value="FIXED_BRACES">Aparelho Fixo</option>
                            <option value="CERAMIC">Aparelho Cerâmico</option>
                            <option value="LINGUAL">Aparelho Lingual</option>
                            <option value="ORTHOPEDIC">Ortopedia Funcional</option>
                        </select>
                    </div>

                    {/* Valores */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <DollarSign className="w-4 h-4 inline mr-1" />
                                Valor Total
                            </label>
                            <input
                                type="number"
                                value={formData.total_value}
                                onChange={(e) => setFormData({ ...formData, total_value: parseFloat(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                required
                                min="0"
                                step="0.01"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Entrada (Down Payment)
                            </label>
                            <input
                                type="number"
                                value={formData.down_payment}
                                onChange={(e) => setFormData({ ...formData, down_payment: parseFloat(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                required
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>

                    {/* Parcelamento */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Número de Mensalidades
                            </label>
                            <input
                                type="number"
                                value={formData.number_of_months}
                                onChange={(e) => setFormData({ ...formData, number_of_months: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                required
                                min="1"
                                max="60"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Dia de Vencimento
                            </label>
                            <input
                                type="number"
                                value={formData.billing_day}
                                onChange={(e) => setFormData({ ...formData, billing_day: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                required
                                min="1"
                                max="31"
                            />
                        </div>
                    </div>

                    {/* Resumo Financeiro */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Resumo Financeiro</h3>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Valor Total:</span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    R$ {formData.total_value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Entrada:</span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    R$ {formData.down_payment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Saldo a Parcelar:</span>
                                <span className="font-semibold text-gray-900 dark:text-white">
                                    R$ {(formData.total_value - formData.down_payment).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-blue-200 dark:border-blue-800">
                                <span className="text-gray-600 dark:text-gray-400">Mensalidade:</span>
                                <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                                    {formData.number_of_months}x de R$ {monthlyPayment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Data de Início */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Data de Início
                        </label>
                        <input
                            type="date"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            required
                        />
                    </div>

                    {/* Configurações */}
                    <div className="space-y-3">
                        <label className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                checked={formData.block_scheduling_if_overdue}
                                onChange={(e) => setFormData({ ...formData, block_scheduling_if_overdue: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                Bloquear agendamento se inadimplente
                            </span>
                        </label>

                        <div className="ml-7">
                            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                                Tolerância de atraso (dias)
                            </label>
                            <input
                                type="number"
                                value={formData.overdue_tolerance_days}
                                onChange={(e) => setFormData({ ...formData, overdue_tolerance_days: parseInt(e.target.value) })}
                                className="w-32 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                min="0"
                                max="90"
                            />
                        </div>
                    </div>

                    {/* Observações */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <FileText className="w-4 h-4 inline mr-1" />
                            Observações
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            rows={3}
                            placeholder="Informações adicionais sobre o contrato..."
                        />
                    </div>

                    {/* Botões */}
                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            disabled={loading}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                        >
                            {loading ? 'Criando...' : 'Criar Contrato'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
