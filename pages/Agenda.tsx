import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import {
    Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Filter,
    Clock, User, Phone, CheckCircle, XCircle, AlertCircle, Loader2,
    UserCheck, Edit2, Trash2, MoreVertical
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../components/ui/sheet';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import toast from 'react-hot-toast';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
    PENDING: { label: 'Agendado', color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600', icon: Clock },
    CONFIRMED: { label: 'Confirmado', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700', icon: CheckCircle },
    ARRIVED: { label: 'Chegou', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-400 dark:border-green-700 animate-pulse', icon: UserCheck },
    IN_PROGRESS: { label: 'Em Atendimento', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700', icon: User },
    COMPLETED: { label: 'Atendido', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700', icon: CheckCircle },
    CANCELLED: { label: 'Cancelado', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700', icon: XCircle },
    NO_SHOW: { label: 'Faltou', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700', icon: AlertCircle }
};

const Agenda: React.FC = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [professionals, setProfessionals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [newAppointmentSheetOpen, setNewAppointmentSheetOpen] = useState(false);
    const [filterProfessional, setFilterProfessional] = useState<string>('ALL');

    // New appointment form state
    const [newAppointmentForm, setNewAppointmentForm] = useState({
        patient_id: '',
        patient_name: '',
        doctor_id: '',
        date: '',
        time: '',
        duration: 60,
        type: 'EVALUATION' as const,
        notes: ''
    });

    // Patient search state
    const [patientSearchResults, setPatientSearchResults] = useState<any[]>([]);
    const [showPatientDropdown, setShowPatientDropdown] = useState(false);

    useEffect(() => {
        loadData();
    }, [currentDate, profile?.clinic_id]);

    // Search patients when typing (min 3 characters)
    useEffect(() => {
        const searchPatients = async () => {
            if (newAppointmentForm.patient_name.length >= 3) {
                try {
                    const { data, error } = await supabase
                        .from('patients')
                        .select('id, name, phone')
                        .eq('clinic_id', profile?.clinic_id)
                        .ilike('name', `%${newAppointmentForm.patient_name}%`)
                        .limit(5);

                    if (error) throw error;
                    setPatientSearchResults(data || []);
                    setShowPatientDropdown(true);
                } catch (error) {
                    console.error('Error searching patients:', error);
                }
            } else {
                setPatientSearchResults([]);
                setShowPatientDropdown(false);
            }
        };

        const debounce = setTimeout(searchPatients, 300);
        return () => clearTimeout(debounce);
    }, [newAppointmentForm.patient_name, profile?.clinic_id]);

    const loadData = async () => {
        if (!profile?.clinic_id) return;

        setLoading(true);
        try {
            // Load professionals from users table (users with professional_id)
            const { data: profsData } = await supabase
                .from('users')
                .select('id, name, color, professional_id')
                .eq('clinic_id', profile.clinic_id)
                .not('professional_id', 'is', null)
                .eq('is_active', true);

            setProfessionals(profsData || []);

            // Load appointments for current week/day
            const startDate = viewMode === 'week'
                ? startOfWeek(currentDate, { weekStartsOn: 1 })
                : currentDate;
            const endDate = viewMode === 'week'
                ? endOfWeek(currentDate, { weekStartsOn: 1 })
                : currentDate;

            const { data: appts, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    patients!appointments_patient_id_fkey(name, phone),
                    users!appointments_doctor_id_fkey(name, color)
                `)
                .eq('clinic_id', profile.clinic_id)
                .gte('date', startDate.toISOString())
                .lte('date', endDate.toISOString())
                .order('date');

            if (error) throw error;

            const enrichedAppts = (appts || []).map((apt: any) => ({
                ...apt,
                patient_name: apt.patients?.name || 'Paciente',
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

    const handleStatusChange = async (appointmentId: string, newStatus: Appointment['status']) => {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .update({ status: newStatus })
                .eq('id', appointmentId)
                .select();

            if (error) {
                console.error('Supabase error details:', error);
                throw error;
            }

            // If status is ARRIVED, create attendance queue entry
            if (newStatus === 'ARRIVED') {
                const appointment = appointments.find(a => a.id === appointmentId);
                if (appointment) {
                    // This would trigger the "projection" to AttendanceQueue
                    // For now, just update local state
                    toast.success(`${appointment.patient_name} entrou na fila de atendimento!`, {
                        icon: '🎯',
                        duration: 3000
                    });
                }
            }

            setAppointments(prev => prev.map(apt =>
                apt.id === appointmentId ? { ...apt, status: newStatus } : apt
            ));

            // Update selected appointment if it's the one being changed
            if (selectedAppointment?.id === appointmentId) {
                setSelectedAppointment({ ...selectedAppointment, status: newStatus });
            }

            toast.success('Status atualizado!');
            setSheetOpen(false); // Close sheet after update
        } catch (error: any) {
            console.error('Error updating status:', error);
            toast.error(error?.message || 'Erro ao atualizar status');
        }
    };

    const handleCreateAppointment = async () => {
        if (!newAppointmentForm.patient_name || !newAppointmentForm.doctor_id || !newAppointmentForm.date || !newAppointmentForm.time) {
            toast.error('Preencha todos os campos obrigatórios');
            return;
        }

        try {
            const appointmentDateTime = `${newAppointmentForm.date}T${newAppointmentForm.time}:00`;

            const { data, error } = await supabase
                .from('appointments')
                .insert([{
                    clinic_id: profile?.clinic_id,
                    patient_id: newAppointmentForm.patient_id || null,
                    doctor_id: newAppointmentForm.doctor_id, // Now this is already a user ID
                    date: appointmentDateTime,
                    duration: newAppointmentForm.duration,
                    type: newAppointmentForm.type,
                    status: 'PENDING',
                    notes: newAppointmentForm.notes || null
                }])
                .select();

            if (error) throw error;

            toast.success('Agendamento criado com sucesso!');
            setNewAppointmentSheetOpen(false);
            setNewAppointmentForm({
                patient_id: '',
                patient_name: '',
                doctor_id: '',
                date: '',
                time: '',
                duration: 60,
                type: 'EVALUATION',
                notes: ''
            });
            loadData(); // Reload appointments
        } catch (error: any) {
            console.error('Error creating appointment:', error);
            toast.error(error?.message || 'Erro ao criar agendamento');
        }
    };

    const getWeekDays = () => {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    };

    const getAppointmentsForDay = (date: Date) => {
        return appointments.filter(apt => {
            const aptDate = parseISO(apt.date);
            const matchesDate = isSameDay(aptDate, date);
            const matchesProfessional = filterProfessional === 'ALL' || apt.doctor_id === filterProfessional;
            return matchesDate && matchesProfessional;
        }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    };

    const getTimeSlots = () => {
        return Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
            {/* ============================================ */}
            {/* HEADER - JIRA STYLE */}
            {/* ============================================ */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <CalendarIcon className="text-blue-600" size={28} />
                            Agenda
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Gestão de Agendamentos • {appointments.length} compromissos
                        </p>
                    </div>
                    <button
                        onClick={() => setNewAppointmentSheetOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm shadow-md"
                    >
                        <Plus size={16} />
                        Novo Agendamento
                    </button>
                </div>

                {/* Navigation & Filters */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentDate(prev => addDays(prev, viewMode === 'week' ? -7 : -1))}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <ChevronLeft size={20} className="text-slate-600 dark:text-slate-400" />
                        </button>
                        <button
                            onClick={() => setCurrentDate(new Date())}
                            className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            Hoje
                        </button>
                        <button
                            onClick={() => setCurrentDate(prev => addDays(prev, viewMode === 'week' ? 7 : 1))}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <ChevronRight size={20} className="text-slate-600 dark:text-slate-400" />
                        </button>
                        <span className="ml-4 text-lg font-bold text-slate-900 dark:text-white">
                            {format(currentDate, viewMode === 'week' ? "'Semana de' dd/MM/yyyy" : "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Professional Filter */}
                        <select
                            value={filterProfessional}
                            onChange={(e) => setFilterProfessional(e.target.value)}
                            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                        >
                            <option value="ALL">Todos Profissionais</option>
                            {professionals.map(prof => (
                                <option key={prof.id} value={prof.id}>{prof.name}</option>
                            ))}
                        </select>

                        {/* View Mode Toggle */}
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg">
                            <button
                                onClick={() => setViewMode('week')}
                                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${viewMode === 'week'
                                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow'
                                    : 'text-slate-600 dark:text-slate-400'
                                    }`}
                            >
                                Semana
                            </button>
                            <button
                                onClick={() => setViewMode('day')}
                                className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${viewMode === 'day'
                                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow'
                                    : 'text-slate-600 dark:text-slate-400'
                                    }`}
                            >
                                Dia
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ============================================ */}
            {/* CALENDAR GRID */}
            {/* ============================================ */}
            <div className="flex-1 overflow-auto p-4">
                {viewMode === 'week' ? (
                    <div className="grid grid-cols-7 gap-2">
                        {getWeekDays().map((day, idx) => {
                            const dayAppts = getAppointmentsForDay(day);
                            const isToday = isSameDay(day, new Date());

                            return (
                                <div
                                    key={idx}
                                    className={`bg-white dark:bg-slate-900 rounded-xl border ${isToday
                                        ? 'border-blue-400 dark:border-blue-600 shadow-md'
                                        : 'border-slate-200 dark:border-slate-800'
                                        } overflow-hidden transition-colors`}
                                >
                                    {/* Day Header */}
                                    <div className={`p-3 border-b ${isToday
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                        }`}>
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                                            {format(day, 'EEE', { locale: ptBR })}
                                        </p>
                                        <p className={`text-2xl font-black ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-900 dark:text-white'
                                            }`}>
                                            {format(day, 'dd')}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {dayAppts.length} agend.
                                        </p>
                                    </div>

                                    {/* Appointments List */}
                                    <div className="p-2 space-y-2 max-h-[600px] overflow-y-auto">
                                        {dayAppts.map(apt => {
                                            const StatusIcon = STATUS_CONFIG[apt.status].icon;
                                            return (
                                                <div
                                                    key={apt.id}
                                                    onClick={() => { setSelectedAppointment(apt); setSheetOpen(true); }}
                                                    className={`p-2 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-all ${STATUS_CONFIG[apt.status].color
                                                        }`}
                                                    style={{ borderLeftColor: apt.doctor_color }}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                                            {format(parseISO(apt.date), 'HH:mm')}
                                                        </span>
                                                        <StatusIcon size={12} />
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                                        {apt.patient_name}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                        {apt.doctor_name}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                        {dayAppts.length === 0 && (
                                            <p className="text-center text-xs text-slate-400 dark:text-slate-600 py-4">
                                                Sem agendamentos
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    // DAY VIEW - Timeline
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                        <div className="space-y-1">
                            {getTimeSlots().map(time => {
                                const hourAppts = getAppointmentsForDay(currentDate).filter(apt =>
                                    format(parseISO(apt.date), 'HH:mm').startsWith(time.split(':')[0])
                                );

                                return (
                                    <div key={time} className="flex gap-4 border-b border-slate-100 dark:border-slate-800 py-2">
                                        <div className="w-16 text-sm font-bold text-slate-500 dark:text-slate-400">
                                            {time}
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            {hourAppts.map(apt => {
                                                const StatusIcon = STATUS_CONFIG[apt.status].icon;
                                                return (
                                                    <div
                                                        key={apt.id}
                                                        onClick={() => { setSelectedAppointment(apt); setSheetOpen(true); }}
                                                        className={`p-3 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-all ${STATUS_CONFIG[apt.status].color
                                                            }`}
                                                        style={{ borderLeftColor: apt.doctor_color }}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1">
                                                                <p className="font-bold text-slate-900 dark:text-white">
                                                                    {apt.patient_name}
                                                                </p>
                                                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                                                    {apt.doctor_name} • {apt.duration} min
                                                                </p>
                                                            </div>
                                                            <StatusIcon size={20} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* ============================================ */}
            {/* APPOINTMENT DETAIL SHEET */}
            {/* ============================================ */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent className="w-full sm:max-w-lg overflow-auto">
                    <SheetHeader>
                        <SheetTitle>Detalhes do Agendamento</SheetTitle>
                    </SheetHeader>
                    {selectedAppointment && (
                        <div className="mt-6 space-y-6">
                            {/* Patient Info */}
                            <div>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Paciente</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedAppointment.patient_name}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2 mt-1">
                                    <Phone size={14} />
                                    {selectedAppointment.patient_phone}
                                </p>
                            </div>

                            {/* Appointment Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Data/Hora</p>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                                        {format(parseISO(selectedAppointment.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Duração</p>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                                        {selectedAppointment.duration} minutos
                                    </p>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Profissional</p>
                                <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedAppointment.doctor_name}</p>
                            </div>

                            {/* Status Change */}
                            <div>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Alterar Status</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                                        const Icon = config.icon;
                                        return (
                                            <button
                                                key={status}
                                                onClick={() => handleStatusChange(selectedAppointment.id, status as Appointment['status'])}
                                                className={`p-3 rounded-lg border-2 text-left transition-all hover:shadow-md ${selectedAppointment.status === status
                                                    ? config.color + ' border-current'
                                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                                    }`}
                                            >
                                                <Icon size={16} className="mb-1" />
                                                <p className="text-xs font-bold">{config.label}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Notes */}
                            {selectedAppointment.notes && (
                                <div>
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Observações</p>
                                    <p className="text-sm text-slate-700 dark:text-slate-300">{selectedAppointment.notes}</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 font-medium text-sm">
                                    <Edit2 size={16} />
                                    Editar
                                </button>
                                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm">
                                    <Trash2 size={16} />
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* ============================================ */}
            {/* NEW APPOINTMENT SHEET */}
            {/* ============================================ */}
            <Sheet open={newAppointmentSheetOpen} onOpenChange={setNewAppointmentSheetOpen}>
                <SheetContent className="w-full sm:max-w-lg overflow-auto">
                    <SheetHeader>
                        <SheetTitle>Novo Agendamento</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-4">
                        {/* Patient Name with Autocomplete */}
                        <div className="relative">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                                Nome do Paciente *
                            </label>
                            <input
                                type="text"
                                value={newAppointmentForm.patient_name}
                                onChange={(e) => setNewAppointmentForm({ ...newAppointmentForm, patient_name: e.target.value, patient_id: '' })}
                                onFocus={() => newAppointmentForm.patient_name.length >= 3 && setShowPatientDropdown(true)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                placeholder="Digite pelo menos 3 letras..."
                            />
                            {showPatientDropdown && patientSearchResults.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                    {patientSearchResults.map((patient) => (
                                        <button
                                            key={patient.id}
                                            type="button"
                                            onClick={() => {
                                                setNewAppointmentForm({
                                                    ...newAppointmentForm,
                                                    patient_id: patient.id,
                                                    patient_name: patient.name
                                                });
                                                setShowPatientDropdown(false);
                                            }}
                                            className="w-full px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-0"
                                        >
                                            <p className="font-medium text-slate-900 dark:text-white">{patient.name}</p>
                                            {patient.phone && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{patient.phone}</p>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                            {newAppointmentForm.patient_name.length > 0 && newAppointmentForm.patient_name.length < 3 && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Digite mais {3 - newAppointmentForm.patient_name.length} letra(s) para buscar
                                </p>
                            )}
                        </div>

                        {/* Professional */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                                Profissional *
                            </label>
                            <select
                                value={newAppointmentForm.doctor_id}
                                onChange={(e) => setNewAppointmentForm({ ...newAppointmentForm, doctor_id: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Selecione um profissional</option>
                                {professionals.map(prof => (
                                    <option key={prof.id} value={prof.id}>{prof.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Date & Time */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                                    Data *
                                </label>
                                <input
                                    type="date"
                                    value={newAppointmentForm.date}
                                    onChange={(e) => setNewAppointmentForm({ ...newAppointmentForm, date: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                                    Horário *
                                </label>
                                <input
                                    type="time"
                                    value={newAppointmentForm.time}
                                    onChange={(e) => setNewAppointmentForm({ ...newAppointmentForm, time: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Type */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                                Tipo de Atendimento *
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {['EVALUATION', 'PROCEDURE', 'FOLLOW_UP', 'EMERGENCY'].map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setNewAppointmentForm({ ...newAppointmentForm, type: type as any })}
                                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${newAppointmentForm.type === type
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                            }`}
                                    >
                                        {type === 'EVALUATION' ? 'Avaliação' : type === 'PROCEDURE' ? 'Procedimento' : type === 'FOLLOW_UP' ? 'Retorno' : 'Urgência'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                                Observações
                            </label>
                            <textarea
                                value={newAppointmentForm.notes}
                                onChange={(e) => setNewAppointmentForm({ ...newAppointmentForm, notes: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                                placeholder="Observações adicionais (opcional)"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <button
                                onClick={() => setNewAppointmentSheetOpen(false)}
                                className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 font-medium text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateAppointment}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm flex items-center justify-center gap-2"
                            >
                                <CalendarIcon size={16} />
                                Criar Agendamento
                            </button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
};

export default Agenda;
