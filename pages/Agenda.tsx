import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useUI } from '../contexts/UIContext';
import { useMediaQuery } from '../hooks/useMediaQuery';
import {
    Clock, User, CheckCircle, XCircle, AlertCircle, Loader2,
    UserCheck, Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, addDays, addWeeks, addMonths, startOfWeek, endOfWeek, isSameDay, parseISO, startOfDay, addHours, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppointmentSheet } from '../components/agenda/AppointmentSheet';
import { AgendaHeader } from '../components/agenda/AgendaHeader';
import { MonthView } from '../components/agenda/MonthView';
import { WeekViewDesktop } from '../components/agenda/WeekViewDesktop';
import { DateStrip } from '../components/agenda/DateStrip';

import { AttendanceSidebar } from '../components/agenda/AttendanceSidebar';

interface Appointment {
    id: string;
    patient_id: string;
    doctor_id: string;
    date: string;
    duration: number;
    type: string;
    status: 'PENDING' | 'CONFIRMED' | 'ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
    notes?: string;
    patient_name?: string;
    patient_phone?: string;
    doctor_name?: string;
    doctor_color?: string;
}

const STATUS_CONFIG = {
    PENDING: { label: 'Agendado', color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-l-4 border-slate-400', icon: Clock },
    CONFIRMED: { label: 'Confirmado', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-l-4 border-blue-500', icon: CheckCircle },
    ARRIVED: { label: 'Chegou', color: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-l-4 border-green-500 animate-pulse', icon: UserCheck },
    IN_PROGRESS: { label: 'Em Atendimento', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-l-4 border-purple-500', icon: User },
    COMPLETED: { label: 'Atendido', color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-l-4 border-emerald-500', icon: CheckCircle },
    CANCELLED: { label: 'Cancelado', color: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-l-4 border-red-500 opacity-60', icon: XCircle },
    NO_SHOW: { label: 'Faltou', color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-l-4 border-orange-500', icon: AlertCircle }
};

const Agenda: React.FC = () => {
    const { profile } = useAuth();
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [professionals, setProfessionals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterProfessional, setFilterProfessional] = useState<string>('ALL');

    // Appointment Sheet State
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ date: Date; time: string } | undefined>(undefined);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | undefined>(undefined);

    useEffect(() => {
        loadData();
    }, [currentDate, profile?.clinic_id, filterProfessional, viewMode]);

    // Simplified Mobile ViewMode Logic:
    // User can manually switch, but we default/force logic if needed. 
    // Actually, keeping user choice is better. 'Week' on mobile means DateStrip + Day details.

    const loadData = async () => {
        if (!profile?.clinic_id) return;
        setLoading(true);

        try {
            // Load professionals
            const { data: profsData } = await supabase
                .from('users')
                .select('id, name, color, professional_id')
                .eq('clinic_id', profile.clinic_id)
                .not('professional_id', 'is', null)
                .eq('is_active', true);
            setProfessionals(profsData || []);

            // Determine Date Range based on View Mode
            let startDate, endDate;
            if (viewMode === 'month') {
                startDate = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 }); // Include pre/post month days
                endDate = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
            } else if (viewMode === 'week') {
                startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
                endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
            } else {
                startDate = startOfDay(currentDate);
                endDate = startOfDay(addDays(currentDate, 1));
            }

            let query = supabase
                .from('appointments')
                .select(`
                    *,
                    patients!appointments_patient_id_fkey(name, phone),
                    users!appointments_doctor_id_fkey(name, color)
                `)
                .eq('clinic_id', profile.clinic_id)
                .gte('date', startDate.toISOString())
                .lt('date', endDate.toISOString())
                .in('type', ['EVALUATION', 'TREATMENT', 'RETURN', 'URGENCY']) // 🛡️ Fix de ENUMS
                .order('date');

            if (filterProfessional !== 'ALL') {
                query = query.eq('doctor_id', filterProfessional);
            }

            const { data: appts, error } = await query;
            if (error) throw error;

            const enrichedAppts = (appts || []).map((apt: any) => ({
                ...apt,
                // Ensure robustness against uppercase/lowercase enum differences
                type: apt.type?.toUpperCase() || 'EVALUATION',
                status: apt.status?.toUpperCase() || 'PENDING',
                patient_name: apt.patients?.name || 'Paciente Sem Nome',
                patient_phone: apt.patients?.phone || '',
                doctor_name: apt.users?.name || 'Profissional',
                doctor_color: apt.users?.color || '#3B82F6'
            }));

            setAppointments(enrichedAppts);
        } catch (error) {
            console.error('Error loading agenda:', error);
            toast.error('Erro ao carregar agenda');
        } finally {
            setLoading(false);
        }
    };

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

    // Render Day View (Classic Timeline)
    const renderDayView = () => {
        // Expanded to 06:00 - 23:00 to catch early/shifted appointments
        const startHour = 6;
        const timeSlots = Array.from({ length: 17 }, (_, i) => `${String(i + startHour).padStart(2, '0')}:00`);

        return (
            <div className="flex-1 overflow-y-auto relative no-scrollbar bg-white dark:bg-slate-950">
                <div className="relative min-h-[1700px] w-full">
                    {timeSlots.map((time, index) => (
                        <div key={time} className="absolute w-full flex" style={{ top: `${index * 100}px`, height: '100px' }}>
                            {/* Time Label */}
                            <div className="w-14 md:w-20 flex-shrink-0 flex flex-col items-center pt-2 border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 sticky left-0 z-10 backdrop-blur-sm">
                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{time}</span>
                            </div>

                            {/* Grid Line content */}
                            <div
                                className="flex-1 border-b border-dashed border-slate-100 dark:border-slate-800 relative group"
                                onClick={() => handleSlotClick(time, currentDate)}
                            >
                                <div className="absolute inset-0 bg-transparent group-hover:bg-slate-50 dark:group-hover:bg-slate-900/40 transition-colors pointer-events-none" />
                            </div>
                        </div>
                    ))}

                    {/* Appointments Overlay */}
                    {appointments.map(apt => {
                        // In Day view (or DateStrip active day), we filter for currentDate
                        if (!isSameDay(parseISO(apt.date), currentDate)) return null;

                        // Ensure we respect the grid start time
                        if (!timeSlots.some(t => t === format(parseISO(apt.date), 'HH:mm'))) {
                            // Optional: Could log or show "out of bounds" warning
                            // return null; 
                        }

                        const aptDate = parseISO(apt.date);
                        const aptHour = parseInt(format(aptDate, 'HH'));
                        const gridStartIndex = aptHour - startHour;

                        // Safety check: if before startHour, don't crash, just hide or cap? 
                        // If we return null, it's invisible. 
                        // With startHour=6, 09:00->06:00 (UTC Shift) will be at index 0. Visible!
                        if (gridStartIndex < 0) return null;

                        const topPos = gridStartIndex * 100; // 100px per hour
                        const height = (apt.duration / 60) * 100; // proportional height
                        const config = STATUS_CONFIG[apt.status] || STATUS_CONFIG.PENDING;

                        return (
                            <div
                                key={apt.id}
                                onClick={(e) => { e.stopPropagation(); handleAppointmentClick(apt); }}
                                className={`absolute left-16 right-2 md:left-24 md:right-4 p-2 rounded-lg text-xs md:text-sm cursor-pointer shadow-sm transition-all hover:scale-[1.01] hover:shadow-md hover:z-20 ${config.color} backdrop-blur-sm bg-opacity-90`}
                                style={{
                                    top: `${topPos + 2}px`,
                                    height: `${height - 4}px`,
                                    zIndex: 1
                                }}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="font-bold truncate pr-2">
                                        {format(parseISO(apt.date), 'HH:mm')} - {apt.patient_name}
                                    </div>
                                    <config.icon className="w-3 h-3 md:w-4 md:h-4 opacity-70" />
                                </div>
                                <div className="text-[10px] md:text-xs opacity-80 truncate flex gap-1 mt-0.5 items-center">
                                    <User className="w-3 h-3 inline" /> {apt.doctor_name}
                                </div>
                                {apt.patient_phone && (
                                    <div className="text-[10px] md:text-xs opacity-80 truncate flex gap-1 mt-0.5 items-center">
                                        <b className="w-3 h-3 flex items-center justify-center">📞</b> {apt.patient_phone}
                                    </div>
                                )}
                                {apt.type === 'EVALUATION' && (
                                    <span className="absolute bottom-1 right-2 px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded text-[9px] font-bold border border-yellow-200">
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

    // Force Week view on large screens initially
    useEffect(() => {
        // Only run once on mount
        const width = window.innerWidth;
        if (width >= 1024) {
            setViewMode('week');
        }
    }, []);

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

        // Default: Day View (or Mobile Week View which is DateStrip + DayView)
        return renderDayView();
    };

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
            <div className="flex h-full w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
                {/* Main Agenda Area */}
                <main className="flex-1 flex flex-col overflow-hidden border-r border-gray-200 dark:border-slate-800 relative">
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
                    />

                    {/* Mobile Date Strip (Only visible in Week mode on Mobile) */}
                    {isMobile && viewMode === 'week' && (
                        <DateStrip
                            currentDate={currentDate}
                            onSelectDate={setCurrentDate}
                        />
                    )}

                    {/* SCROLLABLE TIMELINE AREA */}
                    <div className="flex-1 overflow-hidden relative flex flex-col">
                        {renderContent()}
                    </div>
                </main>

                {/* Sidebar da Fila de Espera (Apenas Desktop > 1024px) */}
                <aside className="hidden lg:flex w-96 flex-col bg-white/50 backdrop-blur-lg dark:bg-slate-900/50 shadow-xl border-l border-slate-200 dark:border-slate-800 z-20">
                    <AttendanceSidebar />
                </aside>
            </div>

            <AppointmentSheet
                isOpen={isSheetOpen}
                onClose={() => setIsSheetOpen(false)}
                selectedSlot={selectedSlot}
                appointmentId={selectedAppointmentId}
                onSuccess={loadData}
            />

            {/* Mobile FAB */}
            <button
                onClick={handleCreateClick}
                className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-xl shadow-blue-600/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50"
                aria-label="Novo Agendamento"
            >
                <Plus size={28} />
            </button>
        </div>
    );
};

export default Agenda;
