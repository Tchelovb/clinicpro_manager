import React, { useEffect, useState } from 'react';
import { ChevronRight, ChevronLeft, Calendar, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { orthoService, OrthoTreatmentPlan, AlignerStock } from '../../services/orthoService';
import toast from 'react-hot-toast';

interface AlignerTrackerProps {
    contractId: string;
    patientName: string;
}

export const AlignerTracker: React.FC<AlignerTrackerProps> = ({ contractId, patientName }) => {
    const [treatmentPlan, setTreatmentPlan] = useState<OrthoTreatmentPlan | null>(null);
    const [alignerStock, setAlignerStock] = useState<AlignerStock[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [contractId]);

    const loadData = async () => {
        try {
            const plan = await orthoService.getTreatmentPlanByContract(contractId);
            if (plan) {
                setTreatmentPlan(plan);
                const stock = await orthoService.getAlignerStockByTreatmentPlan(plan.id);
                setAlignerStock(stock);
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            toast.error('Erro ao carregar progresso');
        } finally {
            setLoading(false);
        }
    };

    const handleAdvanceAligner = async (arch: 'upper' | 'lower') => {
        if (!treatmentPlan) return;

        try {
            await orthoService.advanceAligner(treatmentPlan.id, arch);
            toast.success(`Alinhador ${arch === 'upper' ? 'superior' : 'inferior'} avançado!`);
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Erro ao avançar alinhador');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!treatmentPlan) {
        return (
            <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                Nenhum plano de tratamento encontrado
            </div>
        );
    }

    const progressUpper = treatmentPlan.total_aligners_upper > 0
        ? (treatmentPlan.current_aligner_upper / treatmentPlan.total_aligners_upper) * 100
        : 0;

    const progressLower = treatmentPlan.total_aligners_lower > 0
        ? (treatmentPlan.current_aligner_lower / treatmentPlan.total_aligners_lower) * 100
        : 0;

    const getChangeStatus = () => {
        if (!treatmentPlan.next_aligner_change_date) return null;

        const today = new Date();
        const changeDate = new Date(treatmentPlan.next_aligner_change_date);
        const diffDays = Math.ceil((changeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { status: 'OVERDUE', label: 'Atrasado', color: 'red' };
        if (diffDays === 0) return { status: 'TODAY', label: 'Hoje', color: 'yellow' };
        if (diffDays <= 3) return { status: 'SOON', label: 'Em breve', color: 'orange' };
        return { status: 'SCHEDULED', label: 'Agendado', color: 'green' };
    };

    const changeStatus = getChangeStatus();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">Progresso do Tratamento</h2>
                <p className="text-blue-100">{patientName}</p>
            </div>

            {/* Próxima Troca */}
            {treatmentPlan.next_aligner_change_date && changeStatus && (
                <div className={`bg-${changeStatus.color}-50 dark:bg-${changeStatus.color}-900/20 border border-${changeStatus.color}-200 dark:border-${changeStatus.color}-800 rounded-lg p-4`}>
                    <div className="flex items-center gap-3">
                        <Calendar className={`w-5 h-5 text-${changeStatus.color}-600 dark:text-${changeStatus.color}-400`} />
                        <div>
                            <p className={`font-semibold text-${changeStatus.color}-900 dark:text-${changeStatus.color}-100`}>
                                Próxima Troca: {new Date(treatmentPlan.next_aligner_change_date).toLocaleDateString('pt-BR')}
                            </p>
                            <p className={`text-sm text-${changeStatus.color}-700 dark:text-${changeStatus.color}-300`}>
                                Status: {changeStatus.label}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Arcada Superior */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Arcada Superior
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {treatmentPlan.current_aligner_upper}/{treatmentPlan.total_aligners_upper}
                        </span>
                        <button
                            onClick={() => handleAdvanceAligner('upper')}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            disabled={treatmentPlan.current_aligner_upper >= treatmentPlan.total_aligners_upper}
                            title="Avançar para próximo alinhador"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Barra de Progresso */}
                <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span>Progresso</span>
                        <span>{progressUpper.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${progressUpper}%` }}
                        />
                    </div>
                </div>

                {/* Timeline de Alinhadores */}
                <div className="flex gap-1 overflow-x-auto pb-2">
                    {Array.from({ length: treatmentPlan.total_aligners_upper }, (_, i) => i + 1).map((num) => {
                        const isCurrent = num === treatmentPlan.current_aligner_upper;
                        const isCompleted = num < treatmentPlan.current_aligner_upper;
                        const isFuture = num > treatmentPlan.current_aligner_upper;

                        return (
                            <div
                                key={num}
                                className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xs font-semibold transition-all ${isCurrent
                                    ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 dark:ring-offset-gray-800 scale-110'
                                    : isCompleted
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                                    }`}
                                title={`Alinhador #${num}`}
                            >
                                {isCompleted ? <CheckCircle className="w-4 h-4" /> : num}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Arcada Inferior */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Arcada Inferior
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {treatmentPlan.current_aligner_lower}/{treatmentPlan.total_aligners_lower}
                        </span>
                        <button
                            onClick={() => handleAdvanceAligner('lower')}
                            className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                            disabled={treatmentPlan.current_aligner_lower >= treatmentPlan.total_aligners_lower}
                            title="Avançar para próximo alinhador"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Barra de Progresso */}
                <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <span>Progresso</span>
                        <span>{progressLower.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                            className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${progressLower}%` }}
                        />
                    </div>
                </div>

                {/* Timeline de Alinhadores */}
                <div className="flex gap-1 overflow-x-auto pb-2">
                    {Array.from({ length: treatmentPlan.total_aligners_lower }, (_, i) => i + 1).map((num) => {
                        const isCurrent = num === treatmentPlan.current_aligner_lower;
                        const isCompleted = num < treatmentPlan.current_aligner_lower;

                        return (
                            <div
                                key={num}
                                className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xs font-semibold transition-all ${isCurrent
                                    ? 'bg-purple-600 text-white ring-2 ring-purple-400 ring-offset-2 dark:ring-offset-gray-800 scale-110'
                                    : isCompleted
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                                    }`}
                                title={`Alinhador #${num}`}
                            >
                                {isCompleted ? <CheckCircle className="w-4 h-4" /> : num}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Fase Atual */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Fase do Tratamento
                </h3>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                            {treatmentPlan.current_phase.replace('_', ' ')}
                        </p>
                        {treatmentPlan.treatment_goals && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {treatmentPlan.treatment_goals}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
