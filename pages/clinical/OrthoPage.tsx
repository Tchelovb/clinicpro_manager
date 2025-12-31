import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useOrtho } from '../../hooks/useOrtho';
import { useFinancialLock } from '../../hooks/useFinancialLock';
import { PinSignatureModal } from '../../components/security/PinSignatureModal';
import { OrthoDashboard } from '../../components/ortho/OrthoDashboard';
import { OrthoTimeline } from '../../components/ortho/OrthoTimeline';
import { ChevronLeft, Lock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const OrthoPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { profile } = useAuth();

    // Core Hooks
    // Using profile?.clinic_id as fallback, should be from context properly in real app
    const { activeContract, treatmentPlan, loading: orthoLoading, updatePlan } = useOrtho(id!, profile?.clinic_id || '');

    // Security Hooks
    const { isLocked, checkStatus } = useFinancialLock(id!);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

    // Initial check on load
    React.useEffect(() => {
        if (id) checkStatus();
    }, [id, checkStatus]);

    const handleSecureAction = async (action: () => void) => {
        const locked = await checkStatus();
        if (locked) {
            toast.custom((t) => (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-lg max-w-sm flex items-start">
                    <AlertCircle className="text-red-500 mr-3 flex-shrink-0" size={24} />
                    <div>
                        <h3 className="text-red-800 font-bold text-sm">Ação Bloqueada</h3>
                        <p className="text-red-700 text-sm mt-1">Paciente com pendências financeiras. Regularize na recepção.</p>
                        <button
                            onClick={() => toast.dismiss(t.id)}
                            className="mt-2 text-xs font-bold text-red-600 hover:underline"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            ), { duration: 5000 });
            return;
        }

        // If not locked, require PIN
        setPendingAction(() => action);
        setShowPinModal(true);
    };

    const handlePinSuccess = () => {
        if (pendingAction) {
            pendingAction();
            setPendingAction(null);
        }
    };

    // Example Action: Advance Phase
    const handleAdvancePhase = () => {
        handleSecureAction(async () => {
            // Logic to advance phase
            toast.success('Fase avançada (Simulação)');
            // await updatePlan(...)
        });
    };

    if (orthoLoading) return <div className="p-8 text-center">Carregando Workstation Orto...</div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            {/* Minimalist Focus Header */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3 px-4 flex items-center justify-between sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(`/patients/${id}`)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500">
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="font-bold text-slate-800 dark:text-white text-lg leading-tight">Painel Ortodontia</h1>
                        <p className="text-xs text-slate-500">Paciente #{id?.substring(0, 6)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {activeContract ? (
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            Contrato Ativo
                        </span>
                    ) : (
                        <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-1 rounded-full">Sem Contrato</span>
                    )}
                </div>
            </header>

            {/* Workstation Content */}
            <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">

                {/* 1. Ortho Dashboard (The Engine) */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-1">
                    <OrthoDashboard
                        plan={treatmentPlan}
                        contract={activeContract}
                    // We can inject custom handlers here that use handleSecureAction if needed
                    />
                </div>

                {/* 2. Timeline & Actions */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800 dark:text-white">Linha do Tempo</h3>
                        <button
                            onClick={handleAdvancePhase}
                            className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                        >
                            <Lock size={16} />
                            Avançar Fase (Req. Senha)
                        </button>
                    </div>

                    {/* Placeholder for Timeline Component */}
                    <div className="text-slate-500 text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        Visualização da Timeline de Evoluções
                    </div>
                </div>
            </main>

            {/* Security Modal */}
            <PinSignatureModal
                open={showPinModal}
                onOpenChange={setShowPinModal}
                onSuccess={handlePinSuccess}
                title="Autorizar Evolução"
                description="Digite seu PIN para confirmar o avanço de fase."
            />
        </div>
    );
};
