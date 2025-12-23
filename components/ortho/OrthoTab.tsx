import React, { useState } from 'react';
import { useOrtho } from '../../hooks/useOrtho';
import { OrthoContractForm } from './OrthoContractForm';
import { OrthoDashboard } from './OrthoDashboard';
import { OrthoTimeline } from './OrthoTimeline';
import { OrthoEvolutionForm } from './OrthoEvolutionForm';
import { Plus, Smile, Activity } from 'lucide-react';

interface OrthoTabProps {
    patientId: string;
    patientName: string;
    clinicId: string;
    budgetId?: string;
}

export const OrthoTab: React.FC<OrthoTabProps> = ({ patientId, patientName, clinicId, budgetId }) => {
    const {
        activeContract,
        treatmentPlan,
        appointments,
        loading,
        refresh,
        createAppointment
    } = useOrtho(patientId, clinicId);

    const [showContractModal, setShowContractModal] = useState(false);
    const [showEvolutionModal, setShowEvolutionModal] = useState(false);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Activity className="w-8 h-8 animate-pulse mb-4 text-primary" />
                <p>Carregando dados ortodônticos...</p>
            </div>
        );
    }

    // 1. EMPTY STATE - No Active Contract
    if (!activeContract) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <Smile className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Iniciar Tratamento Ortodôntico</h3>
                <p className="text-muted-foreground max-w-md mb-8">
                    Este paciente ainda não possui um contrato de ortodontia ativo.
                    Inicie configurando o tipo de aparelho e plano de pagamento.
                </p>
                <button
                    onClick={() => setShowContractModal(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
                >
                    <Plus size={20} />
                    Novo Contrato
                </button>

                <OrthoContractForm
                    open={showContractModal}
                    onOpenChange={setShowContractModal}
                    patientId={patientId}
                    patientName={patientName}
                    clinicId={clinicId}
                    budgetId={budgetId}
                    onSuccess={() => {
                        // Keep open for a moment or just refresh
                        // refresh logic is handled in the form usually or triggering it here
                        refresh();
                    }}
                />
            </div>
        );
    }

    // 2. ACTIVE STATE - Dashboard & Timeline
    return (
        <div className="space-y-6">
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                <div>
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        Ortodontia Digital
                        <span className="px-2 py-0.5 rounded text-[10px] bg-primary/10 text-primary border border-primary/20 font-mono">
                            BETA
                        </span>
                    </h2>
                </div>

                <button
                    onClick={() => setShowEvolutionModal(true)}
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2.5 rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 transition-all"
                >
                    <Plus size={20} />
                    Nova Evolução
                </button>
            </div>

            {/* Dashboard */}
            <OrthoDashboard contract={activeContract} plan={treatmentPlan} />

            {/* Timeline */}
            <div>
                <h3 className="text-lg font-bold text-foreground mb-4 pl-2 border-l-4 border-primary">
                    Linha do Tempo
                </h3>
                <OrthoTimeline appointments={appointments} />
            </div>

            {/* Evolution Modal */}
            <OrthoEvolutionForm
                open={showEvolutionModal}
                onOpenChange={setShowEvolutionModal}
                contract={activeContract}
                onSave={async (data) => {
                    await createAppointment(data);
                    // refresh is called inside useOrtho's createAppointment
                    // form closes itself or we force close?
                    // The form implementation calls onSave then onOpenChange(false)
                }}
            />
        </div>
    );
};
