import React, { useState } from 'react';
import { MobileDrawer } from '../ui/MobileDrawer';
import { useAttendanceQueue } from '../../hooks/useAttendanceQueue';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Clock, AlertCircle, Play, ShieldAlert } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import SecurityPinModal from '../SecurityPinModal';
import { toast } from 'react-hot-toast';
import { cn } from '../../src/lib/utils';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const AttendanceDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
    const { profile } = useAuth();
    const { queue, loading } = useAttendanceQueue(profile?.clinic_id);
    const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);

    // Filtering only Waiting patients
    const waitingPatients = queue.filter(q => q.status === 'WAITING');

    const handleStartAttendance = (item: any) => {
        // SECURITY: Check if current user is the scheduled professional
        if (profile?.id !== item.professional_id && profile?.role !== 'MASTER') {
            setSelectedPatient(item.id);
            setIsPinModalOpen(true);
        } else {
            // Authorized or Master: proceed directly
            proceedToAttendance(item);
        }
    };

    const proceedToAttendance = (item: any) => {
        toast.success(`Iniciando atendimento de ${item.patients?.name}`, {
            icon: '🚀',
            style: {
                borderRadius: '20px',
                background: '#1e293b',
                color: '#fff',
            },
        });
        // Here you would typically navigate to the evolution screen or open the appointment sheet
        onClose();
    };

    const getTypeConfig = (type: string) => {
        switch (type) {
            case 'EVALUATION':
                return { label: 'Avaliação', color: 'bg-yellow-50 text-yellow-700 border-yellow-500', badge: 'bg-yellow-100 text-yellow-800' };
            case 'TREATMENT':
                return { label: 'Procedimento', color: 'bg-blue-50 text-blue-700 border-blue-500', badge: 'bg-blue-100 text-blue-800' };
            case 'URGENCY':
                return { label: 'Urgência', color: 'bg-red-50 text-red-700 border-red-500', badge: 'bg-red-100 text-red-800' };
            case 'RETURN':
                return { label: 'Retorno', color: 'bg-emerald-50 text-emerald-700 border-emerald-500', badge: 'bg-emerald-100 text-emerald-800' };
            default:
                return { label: 'Clínico', color: 'bg-slate-50 text-slate-700 border-slate-400', badge: 'bg-slate-100 text-slate-700' };
        }
    };

    return (
        <>
            <MobileDrawer isOpen={isOpen} onClose={onClose} title="Fluxo de Atendimento">
                {/* Header Badge */}
                {waitingPatients.length > 0 && (
                    <div className="absolute top-8 right-8 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                        {waitingPatients.length} na fila
                    </div>
                )}

                <div className="space-y-4 pb-8">
                    {loading ? (
                        <div className="flex flex-col gap-4 animate-pulse">
                            <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
                            <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl"></div>
                        </div>
                    ) : waitingPatients.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-600 text-center bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-3 shadow-sm">
                                <Users size={24} className="opacity-30" />
                            </div>
                            <p className="text-lg font-medium text-slate-500 dark:text-slate-400">Recepção Livre</p>
                            <p className="text-sm">Nenhum paciente aguardando</p>
                        </div>
                    ) : (
                        waitingPatients.map(item => {
                            const config = getTypeConfig(item.type);

                            return (
                                <div
                                    key={item.id}
                                    onClick={() => handleStartAttendance(item)}
                                    className={`group relative p-5 rounded-3xl border bg-white dark:bg-slate-800/80 shadow-[0_2px_10px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgb(0,0,0,0.06)] transition-all duration-300 active:scale-[0.98] cursor-pointer
                                        ${config.color.includes('yellow') ? 'border-yellow-200/50' :
                                            config.color.includes('blue') ? 'border-blue-200/50' :
                                                'border-slate-100 dark:border-slate-800'}
                                    `}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
                                                {item.patients?.name || 'Paciente'}
                                            </h3>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                {item.patients?.patient_score || 'STANDARD'}
                                            </span>
                                        </div>

                                        <div className="h-10 w-10 bg-slate-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
                                            <Play size={16} className="ml-0.5" />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg w-fit">
                                        <Clock size={12} />
                                        <span>Chegou há <b>{formatDistanceToNow(new Date(item.arrival_time), { locale: ptBR, addSuffix: false })}</b></span>
                                    </div>

                                    <div className="flex gap-2 items-center">
                                        <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-lg ${config.badge}`}>
                                            {config.label}
                                        </span>

                                        {profile?.id !== item.professional_id && (
                                            <span className="flex items-center gap-1 text-[10px] text-orange-600 font-bold bg-orange-100 px-2 py-1 rounded-lg border border-orange-200">
                                                <ShieldAlert size={10} />
                                                RESTRICTED
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </MobileDrawer>

            <SecurityPinModal
                isOpen={isPinModalOpen}
                onClose={() => setIsPinModalOpen(false)}
                onSuccess={() => {
                    if (selectedPatient) {
                        const item = waitingPatients.find(p => p.id === selectedPatient);
                        if (item) proceedToAttendance(item);
                    }
                    setIsPinModalOpen(false);
                }}
                title="Acesso Restrito"
                description="Este paciente está agendado com outro profissional. Digite seu PIN para assumir o atendimento."
            />
        </>
    );
};
