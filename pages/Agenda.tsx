import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../src/lib/supabase';
import { useUI } from '../contexts/UIContext';
import { useMediaQuery } from '../hooks/useMediaQuery';
import {
    Clock, User, CheckCircle, XCircle, AlertCircle, Loader2,
    UserCheck, Plus, Briefcase
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, addDays, addWeeks, addMonths, startOfWeek, endOfWeek, isSameDay, parseISO, startOfDay, addHours, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppointmentSheet } from '../components/agenda/AppointmentSheet';
import { AgendaHeader } from '../components/agenda/AgendaHeader';
import { MonthView } from '../components/agenda/MonthView';
import { WeekViewDesktop } from '../components/agenda/WeekViewDesktop';
import { DateStrip } from '../components/agenda/DateStrip';
import { DateStripMobile } from '../components/agenda/DateStripMobile';
import { FloatingActionButton } from '../components/agenda/FloatingActionButton';
import { TasksDrawer } from '../components/tasks/TasksDrawer';
import { ProfessionalsDrawer } from '../components/agenda/ProfessionalsDrawer';
import { AttendanceDrawer } from '../components/agenda/AttendanceDrawer';
import { MobileTabBar } from '../components/ui/MobileTabBar';
import { cn } from '../src/lib/utils';
import { useAppointments } from '../hooks/useAppointments';

interface Appointment {
    id: string;
    patient_id: string;
    professional_id: string;
    date: string;
    duration: number;
    type: string;
    status: 'PENDING' | 'CONFIRMED' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'ADMINISTRATIVE';
    notes?: string;
    patient_name?: string;
    patient_phone?: string;
    doctor_name?: string;
    doctor_color?: string;
}

const STATUS_CONFIG = {
    PENDING: {
        label: 'Agendado',
        color: 'bg-slate-50/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-md',
        icon: Clock
    },
    CONFIRMED: {
        label: 'Confirmado',
        color: 'bg-blue-50/80 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-700/50 backdrop-blur-md',
        icon: CheckCircle
    },
    ARRIVED: {
        label: 'Chegou',
        color: 'bg-green-50/80 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200/50 dark:border-green-700/50 backdrop-blur-md animate-pulse',
        icon: UserCheck
    },
    IN_PROGRESS: {
        label: 'Em Atendimento',
        color: 'bg-purple-50/80 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-700/50 backdrop-blur-md',
        icon: User
    },
    COMPLETED: {
        label: 'Atendido',
        color: 'bg-emerald-50/80 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-700/50 backdrop-blur-md',
        icon: CheckCircle
    },
    CANCELLED: {
        label: 'Cancelado',
        color: 'bg-red-50/80 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200/50 dark:border-red-700/50 backdrop-blur-md opacity-60',
        icon: XCircle
    },
    NO_SHOW: {
        label: 'Faltou',
        color: 'bg-orange-50/80 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border border-orange-200/50 dark:border-orange-700/50 backdrop-blur-md',
        icon: AlertCircle
    },
    ADMINISTRATIVE: {
        label: 'Compromisso',
        color: 'bg-amber-50/80 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-700/50 backdrop-blur-md',
        icon: Briefcase
    }
};

const Agenda: React.FC = () => {
    const { profile } = useAuth();
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
    const [professionals, setProfessionals] = useState<any[]>([]);
    const [filterProfessional, setFilterProfessional] = useState<string>('ALL');

    // Appointment Sheet State
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ date: Date; time: string } | undefined>(undefined);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | undefined>(undefined);

    // Tasks, Flow and Professionals Drawer State
    const [showTasks, setShowTasks] = useState(false);
    const [showFlow, setShowFlow] = useState(false);
    const [showProfessionals, setShowProfessionals] = useState(false);

    // ✅ HOOK CENTRALIZADO DE AGENDAMENTOS (Sincronização Automática)

    // ... (inside component) ...

    // Date Range Calculation (Memoized)
    const dateRange = React.useMemo(() => {
        let start, end;
        if (viewMode === 'month') {
            start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
            end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
        } else if (viewMode === 'week') {
            start = startOfWeek(currentDate, { weekStartsOn: 1 });
            end = endOfWeek(currentDate, { weekStartsOn: 1 });
        } else {
            start = startOfDay(currentDate);
            end = startOfDay(addDays(currentDate, 1));
        }
        return { start, end };
    }, [currentDate, viewMode]);

    // Use React Query Hook
    const {
        appointments,
        isLoading: isLoadingAppointments,
        invalidateAppointments
    } = useAppointments(dateRange.start, dateRange.end, filterProfessional);

    // Load Professionals (Manual Fetch - Static)
    useEffect(() => {
        const loadProfessionals = async () => {
            if (!profile?.clinic_id) return;
            const { data: profsData } = await supabase
                .from('users')
                .select('id, name, agenda_color, photo_url, specialty, cro, is_clinical_provider')
                .eq('clinic_id', profile.clinic_id)
                .eq('is_clinical_provider', true)
                .eq('active', true)
                .order('name');
            setProfessionals(profsData || []);
        };
        loadProfessionals();
    }, [profile?.clinic_id]);

    const loading = isLoadingAppointments; // Compatibility alias

    // Manter a função loadData apenas para compatibilidade ou refresh manual
    const loadData = () => {
        invalidateAppointments();
    };

    // Auto-select user's own agenda
    // ... preserved ...

    const handleNavigate = (direction: 'prev' | 'next') => {
        const amount = direction === 'next' ? 1 : -1;
        if (viewMode === 'day') setCurrentDate(addDays(currentDate, amount));
        if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, amount));
        if (viewMode === 'month') setCurrentDate(addMonths(currentDate, amount));
    };

    const handleCreateClick = () => {
        setSelectedAppointmentId(undefined);
        setSelectedSlot({ date: currentDate, time: '09:00' });
        setIsSheetOpen(true);
    };

    const handleSlotClick = (time: string, date: Date) => {
        setSelectedAppointmentId(undefined);
        setSelectedSlot({ date, time });
        setIsSheetOpen(true);
    };

    const handleAppointmentClick = (apt: Appointment) => {
        setSelectedAppointmentId(apt.id);
        setSelectedSlot(undefined);
        setIsSheetOpen(true);
    };

    const renderDayView = () => {
        const startHour = 6;
        const timeSlots = Array.from({ length: 17 }, (_, i) => `${String(i + startHour).padStart(2, '0')}:00`);

        return (
            <div className="flex-1 overflow-y-auto relative no-scrollbar bg-white dark:bg-slate-950">
                <div className="relative min-h-[1700px] w-full">
                    {timeSlots.map((time, index) => (
                        <div key={time} className="absolute w-full flex" style={{ top: `${index * 100}px`, height: '100px' }}>
                            <div className="w-14 md:w-20 flex-shrink-0 flex flex-col items-center pt-2 border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 sticky left-0 z-10 backdrop-blur-sm">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{time}</span>
                            </div>
                            <div
                                className="flex-1 border-b border-dashed border-slate-100 dark:border-slate-800 relative group"
                                onClick={() => handleSlotClick(time, currentDate)}
                            >
                                <div className="absolute inset-0 bg-transparent group-hover:bg-slate-50 dark:group-hover:bg-slate-900/40 transition-colors pointer-events-none" />
                            </div>
                        </div>
                    ))}

                    {appointments.map(apt => {
                        if (!isSameDay(parseISO(apt.date), currentDate)) return null;
                        const aptDate = parseISO(apt.date);
                        const aptHour = parseInt(format(aptDate, 'HH'));
                        const gridStartIndex = aptHour - startHour;
                        if (gridStartIndex < 0) return null;

                        const topPos = gridStartIndex * 100;
                        const height = (apt.duration / 60) * 100;
                        const config = STATUS_CONFIG[apt.status] || STATUS_CONFIG.PENDING;

                        return (
                            <div
                                key={apt.id}
                                onClick={(e) => { e.stopPropagation(); handleAppointmentClick(apt); }}
                                className={cn(
                                    "absolute left-16 right-2 md:left-24 md:right-4",
                                    "p-3 rounded-[20px] text-xs md:text-sm cursor-pointer",
                                    "shadow-[0_8px_30px_rgb(0,0,0,0.04)]",
                                    "transition-all duration-300",
                                    "hover:scale-[1.02] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:z-20 hover:-translate-y-1",
                                    config.color
                                )}
                                style={{
                                    top: `${topPos + 2}px`,
                                    height: `${height - 4}px`,
                                    zIndex: 1
                                }}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="font-semibold truncate pr-2">
                                        {format(parseISO(apt.date), 'HH:mm')} - {apt.patient_name}
                                    </div>
                                    <config.icon className="w-4 h-4 opacity-70" />
                                </div>
                                <div className="text-[10px] md:text-xs opacity-80 truncate flex gap-1 mt-1 items-center">
                                    <User className="w-3 h-3 inline" /> {apt.doctor_name}
                                </div>
                                {apt.patient_phone && (
                                    <div className="text-[10px] md:text-xs opacity-80 truncate flex gap-1 mt-0.5 items-center">
                                        <b className="w-3 h-3 flex items-center justify-center">📞</b> {apt.patient_phone}
                                    </div>
                                )}
                                {apt.type === 'EVALUATION' && (
                                    <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-yellow-100/80 text-yellow-800 rounded-lg text-[9px] font-bold border border-yellow-200/50 backdrop-blur-sm">
                                        AVALIAÇÃO
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-slate-950">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                </div>
            );
        }

        if (viewMode === 'month') {
            return (
                <div className="overflow-y-auto h-full">
                    <MonthView
                        currentDate={currentDate}
                        appointments={appointments}
                        onSelectDate={(date) => {
                            setCurrentDate(date);
                            setViewMode('day');
                        }}
                    />
                </div>
            );
        }

        if (viewMode === 'week' && !isMobile) {
            return (
                <div className="overflow-hidden h-full flex flex-col">
                    <WeekViewDesktop
                        currentDate={currentDate}
                        appointments={appointments}
                        onSlotClick={handleSlotClick}
                        onAppointmentClick={handleAppointmentClick}
                    />
                </div>
            );
        }

        return renderDayView();
    };

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col bg-[#F5F5F7] dark:bg-slate-950 overflow-hidden relative">
            <div className="flex h-full w-full overflow-hidden bg-[#F5F5F7] dark:bg-slate-950">
                <main className="flex-1 flex flex-col overflow-hidden border-r border-gray-200/50 dark:border-slate-800/50 relative">
                    <AgendaHeader
                        currentDate={currentDate}
                        onNavigate={handleNavigate}
                        onToday={() => setCurrentDate(new Date())}
                        view={viewMode}
                        onViewChange={setViewMode}
                        filterProfessional={filterProfessional}
                        onFilterProfessionalChange={setFilterProfessional}
                        onSelectDate={(d) => {
                            setCurrentDate(d);
                            setViewMode('day');
                        }}
                        onSelectAppointment={(id) => {
                            setSelectedAppointmentId(id);
                            setIsSheetOpen(true);
                        }}
                        professionals={professionals}
                        onOpenTasks={() => setShowTasks(true)}
                        onOpenFlow={() => setShowFlow(true)}
                        onOpenProfessionals={() => setShowProfessionals(true)}
                        onNewAppointment={handleCreateClick}
                    />

                    {isMobile && (
                        <DateStripMobile
                            currentDate={currentDate}
                            onDateChange={setCurrentDate}
                            appointmentDates={appointments.map(apt => parseISO(apt.date))}
                        />
                    )}

                    <div className="flex-1 overflow-hidden relative flex flex-col">
                        {renderContent()}
                    </div>
                </main>
            </div>

            <AppointmentSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                selectedSlot={selectedSlot}
                appointmentId={selectedAppointmentId}
                onSuccess={loadData}
            />

            <TasksDrawer
                isOpen={showTasks}
                onClose={() => setShowTasks(false)}
            />

            <ProfessionalsDrawer
                isOpen={showProfessionals}
                onClose={() => setShowProfessionals(false)}
                professionals={professionals}
                selectedId={filterProfessional}
                onSelect={(id) => setFilterProfessional(id)}
            />

            <AttendanceDrawer
                isOpen={showFlow}
                onClose={() => setShowFlow(false)}
            />

            {!isMobile && <FloatingActionButton onClick={handleCreateClick} />}

            {isMobile && (
                <MobileTabBar
                    onMainAction={handleCreateClick}
                    onAction4={() => setShowFlow(true)}
                    onAction5={() => setShowTasks(true)}
                />
            )}
        </div>
    );
};

export default Agenda;
