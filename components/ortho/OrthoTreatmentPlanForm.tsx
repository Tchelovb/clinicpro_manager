import React, { useState } from 'react';
import { Save, X, Calendar } from 'lucide-react';
import { orthoService, OrthoTreatmentPlan } from '../../services/orthoService';
import toast from 'react-hot-toast';

interface OrthoTreatmentPlanFormProps {
    contractId: string;
    existingPlan?: OrthoTreatmentPlan | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export const OrthoTreatmentPlanForm: React.FC<OrthoTreatmentPlanFormProps> = ({
    contractId,
    existingPlan,
    onSuccess,
    onCancel,
}) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        // Alinhadores
        total_aligners_upper: existingPlan?.total_aligners_upper || 0,
        total_aligners_lower: existingPlan?.total_aligners_lower || 0,
        change_frequency_days: existingPlan?.change_frequency_days || 14,

        // Aparelho Fixo
        installation_date: existingPlan?.installation_date || '',
        bracket_type: existingPlan?.bracket_type || 'METAL' as const,

        // Fase e Objetivos
        current_phase: existingPlan?.current_phase || 'DIAGNOSIS' as const,
        treatment_goals: existingPlan?.treatment_goals || '',

        // Extrações
        extractions_planned: existingPlan?.extractions_planned?.join(', ') || '',

        // Attachments
        attachments_planned: existingPlan?.attachments_planned?.join(', ') || '',

        notes: existingPlan?.notes || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const planData = {
                contract_id: contractId,
                total_aligners_upper: formData.total_aligners_upper,
                total_aligners_lower: formData.total_aligners_lower,
                change_frequency_days: formData.change_frequency_days,
                installation_date: formData.installation_date || undefined,
                bracket_type: formData.bracket_type,
                current_phase: formData.current_phase,
                treatment_goals: formData.treatment_goals,
                extractions_planned: formData.extractions_planned
                    ? formData.extractions_planned.split(',').map(s => s.trim()).filter(Boolean)
                    : [],
                attachments_planned: formData.attachments_planned
                    ? formData.attachments_planned.split(',').map(s => s.trim()).filter(Boolean)
                    : [],
                notes: formData.notes,
            };

            if (existingPlan) {
                await orthoService.updateTreatmentPlan(existingPlan.id, planData);
                toast.success('Plano de tratamento atualizado!');
            } else {
                await orthoService.createTreatmentPlan(planData);
                toast.success('Plano de tratamento criado!');
            }

            onSuccess();
        } catch (error: any) {
            console.error('Erro ao salvar plano:', error);
            toast.error(error.message || 'Erro ao salvar plano de tratamento');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {existingPlan ? 'Editar' : 'Criar'} Plano de Tratamento
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Configure o planejamento ortodôntico
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
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Tipo de Tratamento
                        </h3>

                        {/* Alinhadores */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                                Alinhadores (Invisalign)
                            </h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Alinhadores Superiores
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.total_aligners_upper}
                                        onChange={(e) => setFormData({ ...formData, total_aligners_upper: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Alinhadores Inferiores
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.total_aligners_lower}
                                        onChange={(e) => setFormData({ ...formData, total_aligners_lower: parseInt(e.target.value) || 0 })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Troca a cada (dias)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.change_frequency_days}
                                        onChange={(e) => setFormData({ ...formData, change_frequency_days: parseInt(e.target.value) || 14 })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        min="1"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Aparelho Fixo */}
                        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                            <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-3">
                                Aparelho Fixo
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        <Calendar className="w-4 h-4 inline mr-1" />
                                        Data de Instalação
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.installation_date}
                                        onChange={(e) => setFormData({ ...formData, installation_date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Tipo de Braquete
                                    </label>
                                    <select
                                        value={formData.bracket_type}
                                        onChange={(e) => setFormData({ ...formData, bracket_type: e.target.value as any })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    >
                                        <option value="METAL">Metálico</option>
                                        <option value="CERAMIC">Cerâmico</option>
                                        <option value="SAPPHIRE">Safira</option>
                                        <option value="LINGUAL">Lingual</option>
                                        <option value="SELF_LIGATING">Autoligado</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Fase do Tratamento */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Fase Atual do Tratamento
                        </label>
                        <select
                            value={formData.current_phase}
                            onChange={(e) => setFormData({ ...formData, current_phase: e.target.value as any })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            required
                        >
                            <option value="DIAGNOSIS">Diagnóstico/Planejamento</option>
                            <option value="LEVELING">Nivelamento</option>
                            <option value="ALIGNMENT">Alinhamento</option>
                            <option value="WORKING">Fase de Trabalho</option>
                            <option value="SPACE_CLOSURE">Fechamento de Espaços</option>
                            <option value="FINISHING">Finalização</option>
                            <option value="RETENTION">Contenção</option>
                        </select>
                    </div>

                    {/* Objetivos do Tratamento */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Objetivos do Tratamento
                        </label>
                        <textarea
                            value={formData.treatment_goals}
                            onChange={(e) => setFormData({ ...formData, treatment_goals: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            rows={3}
                            placeholder="Ex: Corrigir mordida cruzada, alinhar incisivos superiores, fechar diastema..."
                        />
                    </div>

                    {/* Extrações Planejadas */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Extrações Planejadas
                        </label>
                        <input
                            type="text"
                            value={formData.extractions_planned}
                            onChange={(e) => setFormData({ ...formData, extractions_planned: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Ex: 14, 24, 34, 44 (separados por vírgula)"
                        />
                    </div>

                    {/* Attachments Planejados */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Attachments Planejados (para alinhadores)
                        </label>
                        <input
                            type="text"
                            value={formData.attachments_planned}
                            onChange={(e) => setFormData({ ...formData, attachments_planned: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder="Ex: 11, 21, 31, 41 (separados por vírgula)"
                        />
                    </div>

                    {/* Observações */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Observações
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            rows={3}
                            placeholder="Observações adicionais sobre o planejamento..."
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
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            disabled={loading}
                        >
                            <Save className="w-4 h-4" />
                            {loading ? 'Salvando...' : 'Salvar Plano'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
