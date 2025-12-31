import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useAttendanceQueue, QueueItem } from '../hooks/useAttendanceQueue';
import {
    Clock, Play, CheckCircle2, AlertTriangle, DollarSign, User, Stethoscope
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import SecurityPinModal from '../components/SecurityPinModal';

// Helper: GHL Color Logic
const getGHLClass = (type: string) => {
    switch (type) {
        case 'URGENCY': return 'border-l-4 border-red-500 bg-red-50 dark:bg-red-900/10 hover:bg-red-100';
        case 'EVALUATION':
        case 'ORCAMENTO': return 'border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100';
        case 'TREATMENT': return 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100';
        case 'RETURN': return 'border-l-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 hover:bg-emerald-100';
        default: return 'border-l-4 border-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50';
    }
};

const FluxoAtendimento: React.FC = () => {
    const { profile } = useAuth();
    const { queue, loading, refresh } = useAttendanceQueue(profile?.clinic_id);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);

    // Columns Data
    const waiting = queue.filter(i => i.status === 'WAITING');
    const inProgress = queue.filter(i => i.status === 'IN_PROGRESS');
    const finished = queue.filter(i => i.status === 'FINISHED' || i.status === 'COMPLETED');

    // --- ACTIONS ---

    const handleStartAttendance = async (item: QueueItem) => {
        try {
            // Block if bad debtor
            if (item.patients?.bad_debtor) {
                toast.error('Paciente com pendências financeiras! Regularize antes de atender.', { icon: '🚫' });
                return;
            }

            const { error } = await supabase
                .from('attendance_queue')
                .update({
                    status: 'IN_PROGRESS',
                    start_time: new Date().toISOString()
                })
                .eq('id', item.id);

            if (error) throw error;
            toast.success(`${item.patients?.name} em atendimento!`);
            refresh();
        } catch (e) {
            toast.error('Erro ao iniciar atendimento');
        }
    };

    const handleFinishAttendance = (item: QueueItem) => {
        const finishAction = async () => {
            // 1. Update attendance_queue status
            const { error: queueError } = await supabase
                .from('attendance_queue')
                .update({
                    status: 'FINISHED',
                    end_time: new Date().toISOString()
                })
                .eq('id', item.id);

            if (queueError) throw queueError;

            // 2. Digital Signature: Call RPC to sign treatment_items
            if (item.appointment_id && profile?.id) {
                try {
                    // Query treatment_items for this appointment
                    const { data: treatmentItems } = await supabase
                        .from('treatment_items')
                        .select('id')
                        .eq('appointment_id', item.appointment_id)
                        .eq('status', 'IN_PROGRESS');

                    // Sign each treatment item
                    if (treatmentItems && treatmentItems.length > 0) {
                        for (const ti of treatmentItems) {
                            await supabase.rpc('sign_treatment_item', {
                                p_item_id: ti.id,
                                p_user_id: profile.id
                            });
                        }
                        toast.success('✅ Assinatura digital registrada!', { icon: '🔐' });
                    }
                } catch (signError) {
                    console.error('Error signing treatment items:', signError);
                    // Don't block the flow, just log the error
                }
            }

            toast.success(`Procedimento concluído!`);
            refresh();
        };

        // Trigger PIN flow (MANDATORY for finishing)
        setPendingAction(() => finishAction);
        setIsPinModalOpen(true);
    };

    const handleFinancialCheck = async (item: QueueItem) => {
        toast('💰 Abrir modal de recebimento...', { icon: '💳' });
        // TODO: Implement Transaction Modal
        // After transaction is created, update:
        // await supabase.from('attendance_queue').update({ transaction_id: newTransactionId, billing_verified: true }).eq('id', item.id);
    };

    // --- RENDER CARD ---
    const renderCard = (item: QueueItem, column: string) => {
        const ghlClass = getGHLClass(item.type);
        const duration = item.start_time ? differenceInMinutes(new Date(), new Date(item.start_time)) : 0;

        return (
            <div
                key={item.id}
                className={`relative p-4 mb-3 rounded-xl border bg-white dark:bg-slate-800 shadow-sm transition-all hover:shadow-md ${ghlClass}`}
            >
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white leading-tight text-sm">
                            {item.patients?.name || 'Paciente'}
                        </h3>
                        <div className="flex gap-2 items-center mt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {item.patients?.patient_score || 'STANDARD'}
                            </span>
                            {item.patients?.bad_debtor && (
                                <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded font-bold">DEVEDOR</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                    <div className="text-xs text-slate-500">
                        {column === 'WAITING' && (
                            <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {formatDistanceToNow(new Date(item.arrival_time), { locale: ptBR, addSuffix: false })}
                            </span>
                        )}
                        {column === 'IN_PROGRESS' && (
                            <span className="flex items-center gap-1 text-blue-600 font-medium">
                                <Stethoscope size={12} />
                                {duration} min
                            </span>
                        )}
                        {column === 'FINISHED' && (
                            <span className="flex items-center gap-1 text-green-600 font-medium">
                                <CheckCircle2 size={12} />
                                Finalizado
                            </span>
                        )}
                    </div>

                    {/* ACTIONS */}
                    <div className="flex gap-2">
                        {column === 'WAITING' && (
                            <button
                                onClick={() => handleStartAttendance(item)}
                                className="p-1.5 bg-slate-900 text-white rounded-full hover:scale-110 transition-transform"
                                title="Iniciar"
                            >
                                <Play size={14} fill="currentColor" />
                            </button>
                        )}
                        {column === 'IN_PROGRESS' && (
                            <button
                                onClick={() => handleFinishAttendance(item)}
                                className="p-1.5 bg-green-600 text-white rounded-full hover:scale-110 transition-transform"
                                title="Concluir (Requer PIN)"
                            >
                                <CheckCircle2 size={14} />
                            </button>
                        )}
                        {column === 'FINISHED' && (
                            !item.transaction_id ? (
                                <button
                                    onClick={() => handleFinancialCheck(item)}
                                    className="px-2 py-1 bg-red-100 text-red-600 rounded-md text-xs font-bold flex items-center gap-1 hover:bg-red-200 animate-pulse"
                                    title="Pendente Financeiro"
                                >
                                    <AlertTriangle size={12} />
                                    Receber
                                </button>
                            ) : (
                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-bold flex items-center gap-1">
                                    <DollarSign size={12} />
                                    Pago
                                </span>
                            )
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return <div className="p-10 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div></div>;

    return (
        <div className="p-6 max-w-[1800px] mx-auto">
            {/* HEADER */}
            <div className="mb-6">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white">
                    Fluxo de Atendimento
                </h1>
                <p className="text-sm text-slate-500 font-medium">
                    Command Center • Blindado
                </p>
            </div>

            {/* 3-COLUMN LAYOUT */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* COLUMN 1: WAITING */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-amber-50 dark:bg-amber-900/20">
                        <h2 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <Clock size={18} className="text-amber-600" />
                            Aguardando
                        </h2>
                        <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full font-black">
                            {waiting.length}
                        </span>
                    </div>
                    <div className="p-4 space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                        {waiting.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-slate-400">
                                <User size={48} className="mb-4 opacity-30" />
                                <p className="text-sm font-medium">Nenhum paciente aguardando</p>
                            </div>
                        ) : (
                            waiting.map(item => renderCard(item, 'WAITING'))
                        )}
                    </div>
                </div>

                {/* COLUMN 2: IN_PROGRESS */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-blue-50 dark:bg-blue-900/20">
                        <h2 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <Stethoscope size={18} className="text-blue-600" />
                            Em Atendimento
                        </h2>
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full font-black">
                            {inProgress.length}
                        </span>
                    </div>
                    <div className="p-4 space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                        {inProgress.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-slate-400">
                                <Stethoscope size={48} className="mb-4 opacity-30" />
                                <p className="text-sm font-medium">Nenhum atendimento em andamento</p>
                            </div>
                        ) : (
                            inProgress.map(item => renderCard(item, 'IN_PROGRESS'))
                        )}
                    </div>
                </div>

                {/* COLUMN 3: FINISHED */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-green-50 dark:bg-green-900/20">
                        <h2 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <CheckCircle2 size={18} className="text-green-600" />
                            Finalizados
                        </h2>
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full font-black">
                            {finished.length}
                        </span>
                    </div>
                    <div className="p-4 space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                        {finished.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-8 text-slate-400">
                                <CheckCircle2 size={48} className="mb-4 opacity-30" />
                                <p className="text-sm font-medium">Nenhum atendimento finalizado</p>
                            </div>
                        ) : (
                            finished.map(item => renderCard(item, 'FINISHED'))
                        )}
                    </div>
                </div>
            </div>

            {/* PIN MODAL */}
            <SecurityPinModal
                isOpen={isPinModalOpen}
                onClose={() => setIsPinModalOpen(false)}
                onSuccess={async () => {
                    if (pendingAction) await pendingAction();
                    setIsPinModalOpen(false);
                }}
                title="Autorização Necessária"
                description="Confirme sua identidade para concluir este procedimento."
            />
        </div>
    );
};

export default FluxoAtendimento;
