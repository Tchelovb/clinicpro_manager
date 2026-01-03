import React, { useMemo } from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, User, CheckCircle, UserCheck, XCircle, AlertCircle } from 'lucide-react';

// Reusing types/config locally for now
interface Appointment {
    id: string;
    patient_id: string;
    professional_id: string;  // ✅ PADRONIZAÇÃO
    date: string;
    duration: number;
    type: string;
    status: string;
    patient_name?: string;
    patient_phone?: string;
    doctor_name?: string;
    doctor_color?: string;
}

const STATUS_CONFIG: any = {
    PENDING: { color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-l-4 border-slate-400', icon: Clock },
    CONFIRMED: { color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-l-4 border-blue-500', icon: CheckCircle },
    ARRIVED: { color: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-l-4 border-green-500 animate-pulse', icon: UserCheck },
    IN_PROGRESS: { color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-l-4 border-purple-500', icon: User },
    COMPLETED: { color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-l-4 border-emerald-500', icon: CheckCircle },
    CANCELLED: { color: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-l-4 border-red-500 opacity-60', icon: XCircle },
    NO_SHOW: { color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-l-4 border-orange-500', icon: AlertCircle }
};

interface WeekViewDesktopProps {
    currentDate: Date;
    appointments: Appointment[];
    onSlotClick: (time: string, date: Date) => void;
    onAppointmentClick: (apt: Appointment) => void;
}

export const WeekViewDesktop: React.FC<WeekViewDesktopProps> = ({
    currentDate,
    appointments,
    onSlotClick,
    onAppointmentClick
}) => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    const timeSlots = Array.from({ length: 13 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`);

    return (
        <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-slate-950">
            {/* Week Header */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 ml-14">
                {days.map(day => (
                    <div
                        key={day.toISOString()}
                        className={`flex-1 py-3 text-center border-r border-slate-100 dark:border-slate-800 last:border-r-0 ${isToday(day) ? 'bg-blue-50/50 dark:bg-slate-900' : ''}`}
                    >
                        <div className={`text-xs font-bold uppercase ${isToday(day) ? 'text-blue-600' : 'text-slate-500'}`}>
                            {format(day, 'EEE', { locale: ptBR })}
                        </div>
                        <div className={`text-lg font-bold ${isToday(day) ? 'text-blue-600' : 'text-slate-700 dark:text-slate-300'}`}>
                            {format(day, 'd')}
                        </div>
                    </div>
                ))}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto relative no-scrollbar">
                <div className="flex min-h-[1200px]">
                    {/* Time Axis (Sticky Left) */}
                    <div className="w-14 flex-shrink-0 flex flex-col bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm z-20 border-r border-slate-200 dark:border-slate-800 sticky left-0">
                        {timeSlots.map((time, index) => (
                            <div key={time} className="h-[100px] flex items-start justify-center pt-2 relative">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{time}</span>
                            </div>
                        ))}
                    </div>

                    {/* Columns */}
                    {days.map((day, dayIndex) => {
                        const dayAppointments = appointments.filter(apt => isSameDay(new Date(apt.date), day));

                        return (
                            <div key={day.toISOString()} className="flex-1 relative border-r border-slate-100 dark:border-slate-800 min-w-[120px] group-hover:bg-slate-50">
                                {/* Grid Lines */}
                                {timeSlots.map((time, index) => (
                                    <div
                                        key={time}
                                        className="h-[100px] border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                                        onClick={() => onSlotClick(time, day)}
                                    />
                                ))}

                                {/* Appointments Overlay */}
                                {dayAppointments.map(apt => {
                                    if (!timeSlots.some(t => t === format(parseISO(apt.date), 'HH:mm'))) return null;
                                    const startHour = parseInt(format(parseISO(apt.date), 'HH'));
                                    const gridStartIndex = startHour - 8;
                                    if (gridStartIndex < 0) return null;

                                    const topPos = gridStartIndex * 100;
                                    const height = (apt.duration / 60) * 100;


                                    // GHL COLOR LOGIC
                                    let colorClass = 'bg-slate-100 border-l-4 border-slate-400 text-slate-700'; // Default

                                    // 1. By Type (Primary Hierarchy)
                                    switch (apt.type) {
                                        case 'URGENCY':
                                            colorClass = 'bg-red-50 border-l-4 border-red-500 text-red-700 dark:bg-red-900/20 dark:text-red-300';
                                            break;
                                        case 'EVALUATION':
                                            colorClass = 'bg-amber-50 border-l-4 border-amber-500 text-amber-900 dark:bg-amber-900/20 dark:text-amber-100';
                                            break;
                                        case 'TREATMENT':
                                            colorClass = 'bg-blue-50 border-l-4 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300';
                                            break;
                                        case 'RETURN':
                                            colorClass = 'bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300';
                                            break;
                                        default:
                                            // Fallback to Status if Type is generic 'CLINICA' or unknown
                                            const statusConfig = STATUS_CONFIG[apt.status] || STATUS_CONFIG.PENDING;
                                            colorClass = statusConfig.color;
                                            break;
                                    }

                                    // 2. Status Overrides (Dimming/Icons)
                                    if (apt.status === 'CANCELLED') colorClass += ' opacity-50 grayscale';
                                    if (apt.status === 'ARRIVED') colorClass += ' ring-2 ring-green-400 ring-offset-1 animate-pulse';

                                    return (
                                        <div
                                            key={apt.id}
                                            onClick={(e) => { e.stopPropagation(); onAppointmentClick(apt); }}
                                            className={`absolute left-1 right-1 p-1.5 rounded text-[10px] cursor-pointer shadow-sm transition-all hover:scale-[1.02] bg-opacity-90 hover:z-20 ${colorClass}`}
                                            style={{
                                                top: `${topPos + 2}px`,
                                                height: `${height - 4}px`,
                                                zIndex: 10
                                            }}
                                        >
                                            <div className="font-bold truncate leading-tight">
                                                {format(parseISO(apt.date), 'HH:mm')} {apt.patient_name}
                                            </div>
                                            {apt.type === 'TREATMENT' && (
                                                <div className="mt-0.5 px-1 bg-white/30 rounded w-fit">Proc.</div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
