import React, { useState } from 'react';
import { useAttendanceQueue } from '../../hooks/useAttendanceQueue';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Clock, AlertCircle, Play, ShieldAlert } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import SecurityPinModal from '../SecurityPinModal';
import { toast } from 'react-hot-toast';

interface Props {
    className?: string;
}

export const AttendanceSidebar: React.FC<Props> = ({ className }) => {
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
                borderRadius: '10px',
                background: '#333',
                color: '#fff',
            },
        });
        // Here you would typically navigate to the evolution screen or open the appointment sheet
        // For now, we just acknowledge the action.
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

    if (loading && queue.length === 0) {
        return (
            <div className={`p-4 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 ${className}`}>
                <div className="h-full flex flex-col gap-4 animate-pulse">
                    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
                    <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <aside className={`flex flex-col bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 border-l border-slate-200 dark:border-slate-800 h-full ${className}`}>

            {/* HERITAGE HEADER */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-base tracking-tight">
                    <Users size={20} className="text-slate-900 dark:text-white" />
                    Fluxo de Atendimento
                    {waitingPatients.length > 0 && (
                        <span className="ml-auto bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                            {waitingPatients.length}
                        </span>
                    )}
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {waitingPatients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50%] text-slate-400 dark:text-slate-600 p-4 text-center">
                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                            <Users size={24} className="opacity-30" />
                        </div>
                        <p className="text-sm font-semibold">Recepção Livre</p>
                        <p className="text-xs max-w-[150px] mt-1">Nenhum paciente aguardando no momento.</p>
                    </div>
                ) : (
                    waitingPatients.map(item => {
                        const config = getTypeConfig(item.type);

                        return (
                            <div
                                key={item.id}
                                className={`group relative p-4 rounded-2xl border bg-white dark:bg-slate-800/80 shadow-sm hover:shadow-md transition-all duration-300
                                    ${config.color.includes('yellow') ? 'border-yellow-200 hover:border-yellow-400' :
                                        config.color.includes('blue') ? 'border-blue-200 hover:border-blue-400' :
                                            'border-slate-100 hover:border-slate-300'}
                                `}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white leading-tight">
                                            {item.patients?.name || 'Paciente'}
                                        </h3>
                                        {/* Patient Score / Segment */}
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                            {item.patients?.patient_score || 'STANDARD'}
                                        </span>
                                    </div>

                                    {/* Quick Action Button - Appears on hover */}
                                    <button
                                        onClick={() => handleStartAttendance(item)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-full hover:scale-110 shadow-lg absolute right-3 top-3"
                                        title="Iniciar Atendimento"
                                    >
                                        <Play size={12} fill="currentColor" />
                                    </button>
                                </div>

                                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-3">
                                    <Clock size={12} className="text-slate-400" />
                                    <span>Chegou há {formatDistanceToNow(new Date(item.arrival_time), { locale: ptBR, addSuffix: false })}</span>
                                </div>

                                <div className="flex gap-2 items-center">
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${config.badge}`}>
                                        {config.label}
                                    </span>

                                    {/* Cross Check Logic: If logged user != professional */}
                                    {profile?.id !== item.professional_id && (
                                        <span className="flex items-center gap-1 text-[10px] text-orange-500 font-bold bg-orange-50 px-1.5 py-0.5 rounded">
                                            <ShieldAlert size={10} />
                                            PIN
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

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
        </aside>
    );
};
