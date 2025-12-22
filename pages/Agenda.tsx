import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import {
    ChevronLeft, ChevronRight, Plus, Users, Stethoscope,
    Calendar as CalendarIcon, Clock, CheckCircle, Activity, UserX
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Appointment } from '../types';
import { supabase } from '../lib/supabase';
import { useDragAndDrop } from '../hooks/useDragAndDrop';

// Specialty Colors (CEO Standard)
const getSpecialtyStyle = (type: string) => {
    const typeUpper = type.toUpperCase();

    // CIRURGIAS (HIGH-TICKET) - Royal Blue
    if (typeUpper.includes('CIRURG') || typeUpper.includes('LIFTING') || typeUpper.includes('CERVICO')) {
        return {
            bg: 'bg-blue-900/30 dark:bg-blue-900/20',
            border: 'border-blue-600 dark:border-blue-500',
            text: 'text-blue-100 dark:text-blue-200',
            indicator: 'bg-blue-500'
        };
    }

    // HOF (Harmonização Orofacial) - Purple
    if (typeUpper.includes('HOF') || typeUpper.includes('HARMON') || typeUpper.includes('BOTOX') || typeUpper.includes('PREENCH')) {
        return {
            bg: 'bg-purple-900/30 dark:bg-purple-900/20',
            border: 'border-purple-600 dark:border-purple-500',
            text: 'text-purple-100 dark:text-purple-200',
            indicator: 'bg-purple-500'
        };
    }

    // CLÍNICA GERAL - Emerald Green
    return {
        bg: 'bg-emerald-900/30 dark:bg-emerald-900/20',
        border: 'border-emerald-600 dark:border-emerald-500',
        text: 'text-emerald-100 dark:text-emerald-200',
        indicator: 'bg-emerald-500'
    };
};

// Status Indicators
const getStatusIndicator = (status: string) => {
    switch (status) {
        case 'Confirmado': return { color: 'bg-teal-500', label: '✓' };
        case 'Em Atendimento': return { color: 'bg-blue-500 animate-pulse', label: '●' };
        case 'Finalizado': return { color: 'bg-slate-500', label: '✓' };
        case 'Falta': return { color: 'bg-rose-500', label: '✗' };
        default: return { color: 'bg-amber-500', label: '?' };
    }
};

const Agenda: React.FC = () => {
    const navigate = useNavigate();
    const { appointments, professionals, agendaConfig } = useData();

    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'day' | 'week'>('week');
    const [selectedProfessional, setSelectedProfessional] = useState<string>('all');

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    const getWeekDates = (baseDate: Date) => {
        const dates = [];
        const start = new Date(baseDate);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(start.setDate(diff));

        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            dates.push(d);
        }
        return dates;
    };

    const timeSlots = useMemo(() => {
        const slots = [];
        const [startHour] = agendaConfig.startHour.split(':').map(Number);
        const [endHour] = agendaConfig.endHour.split(':').map(Number);
        const duration = agendaConfig.slotDuration;

        let currentMinutes = startHour * 60;
        const endMinutes = endHour * 60;

        while (currentMinutes < endMinutes) {
            const h = Math.floor(currentMinutes / 60);
            const m = currentMinutes % 60;
            slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
            currentMinutes += duration;
        }
        return slots;
    }, [agendaConfig]);

    const activeProfessionals = useMemo(() =>
        professionals.filter(p => p.active),
        [professionals]
    );

    const filteredAppointments = useMemo(() => {
        return appointments.filter(apt =>
            (selectedProfessional === 'all' || apt.doctorName === selectedProfessional) &&
            apt.status !== 'Cancelado'
        );
    }, [appointments, selectedProfessional]);

    const handlePrev = () => {
        const newDate = new Date(currentDate);
        if (view === 'day') newDate.setDate(currentDate.getDate() - 1);
        if (view === 'week') newDate.setDate(currentDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(currentDate);
        if (view === 'day') newDate.setDate(currentDate.getDate() + 1);
        if (view === 'week') newDate.setDate(currentDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    const handleNewAppointment = (date?: string, time?: string) => {
        const params = new URLSearchParams();
        if (date) params.append('date', date);
        if (time) params.append('time', time);
        navigate(`/dashboard/schedule/new?${params.toString()}`);
    };

    const handleReschedule = async (aptId: string, newDate: string, newTime: string, newProfessional: string) => {
        try {
            await supabase
                .from('appointments')
                .update({ date: newDate, time: newTime, doctorName: newProfessional })
                .eq('id', aptId);
        } catch (error) {
            console.error('Erro ao reagendar:', error);
        }
    };

    const { handleDragStart, handleDragOver, handleDragEnd, handleDragLeave, isDragOverSlot } = useDragAndDrop(handleReschedule);

    // Professionals to display in columns (for multiprofessional view)
    const displayProfessionals = selectedProfessional === 'all' ? activeProfessionals.map(p => p.name) : [selectedProfessional];

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.20))] bg-slate-950">
            {/* HEADER - DARK MODE */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4 bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-lg">

                {/* Date Navigation */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-slate-800 rounded-lg p-1">
                        <button onClick={handlePrev} className="p-1.5 hover:bg-slate-700 rounded-md transition text-slate-300">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-4 py-1.5 text-sm font-medium text-slate-300 hover:text-blue-400 transition-colors">
                            Hoje
                        </button>
                        <button onClick={handleNext} className="p-1.5 hover:bg-slate-700 rounded-md transition text-slate-300">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                    <h2 className="text-xl font-bold text-white capitalize w-48 text-center">
                        {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </h2>
                </div>

                {/* Professional Selector (MULTIPROFESSIONAL) */}
                <div className="flex items-center gap-2">
                    <Users size={18} className="text-slate-400" />
                    <select
                        value={selectedProfessional}
                        onChange={(e) => setSelectedProfessional(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-slate-200 rounded-lg px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="all">Todos os Profissionais</option>
                        {activeProfessionals.map(prof => (
                            <option key={prof.id} value={prof.name}>{prof.name}</option>
                        ))}
                    </select>
                </div>

                {/* View Switcher */}
                <div className="flex bg-slate-800 p-1 rounded-lg">
                    {(['day', 'week'] as const).map((v) => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === v
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            {{ day: 'Dia', week: 'Semana' }[v]}
                        </button>
                    ))}
                </div>

                {/* New Appointment Button */}
                <button
                    onClick={() => navigate('/dashboard/schedule/new')}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-lg"
                >
                    <Plus size={18} />
                    <span>Novo Agendamento</span>
                </button>
            </div>

            {/* CALENDAR GRID - DARK MODE */}
            <div className="flex-1 bg-slate-900 rounded-xl border border-slate-800 shadow-lg overflow-hidden flex flex-col">

                {/* Week View Header */}
                {view === 'week' && (
                    <div className="grid border-b border-slate-800" style={{ gridTemplateColumns: `80px repeat(${displayProfessionals.length > 1 ? 7 : 7}, 1fr)` }}>
                        <div className="p-4 bg-slate-950 border-r border-slate-800"></div>
                        {getWeekDates(currentDate).map((date, idx) => {
                            const isToday = date.toDateString() === new Date().toDateString();
                            return (
                                <div key={idx} className={`py-4 text-center border-r border-slate-800 last:border-r-0 ${isToday ? 'bg-blue-900/20' : ''}`}>
                                    <p className={`text-xs uppercase font-bold mb-1 ${isToday ? 'text-blue-400' : 'text-slate-500'}`}>
                                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][date.getDay()]}
                                    </p>
                                    <div className={`w-8 h-8 flex items-center justify-center rounded-full mx-auto text-sm font-bold ${isToday ? 'bg-blue-600 text-white' : 'text-slate-300'
                                        }`}>
                                        {date.getDate()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Time Slots Area */}
                <div className="flex-1 overflow-y-auto">
                    {timeSlots.map((time) => (
                        <div key={time} className="grid min-h-[60px] border-b border-slate-800 last:border-b-0 hover:bg-slate-800/30 transition-colors" style={{ gridTemplateColumns: view === 'week' ? `80px repeat(7, 1fr)` : `80px repeat(${displayProfessionals.length}, 1fr)` }}>
                            <div className="flex items-center justify-center text-xs font-medium text-slate-500 border-r border-slate-800 bg-slate-950">
                                {time}
                            </div>

                            {view === 'week' && (
                                <>
                                    {getWeekDates(currentDate).map((date) => {
                                        const dateStr = formatDate(date);
                                        const slotApts = filteredAppointments.filter(
                                            a => a.date === dateStr && a.time === time
                                        );

                                        return (
                                            <div
                                                key={`${dateStr}-${time}`}
                                                className="border-r border-slate-800 last:border-r-0 relative p-1 transition-colors cursor-pointer"
                                                onClick={() => slotApts.length === 0 && handleNewAppointment(dateStr, time)}
                                            >
                                                {slotApts.map(apt => {
                                                    const style = getSpecialtyStyle(apt.type);
                                                    const status = getStatusIndicator(apt.status);
                                                    return (
                                                        <div
                                                            key={apt.id}
                                                            onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/schedule/${apt.id}`); }}
                                                            className={`rounded-md p-2 text-xs mb-1 cursor-pointer shadow-md border-l-4 hover:shadow-lg transition-all ${style.bg} ${style.border} ${style.text}`}
                                                        >
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="font-bold truncate">{apt.patientName}</span>
                                                                <span className={`w-2 h-2 rounded-full ${status.color}`} title={apt.status}></span>
                                                            </div>
                                                            <div className="flex items-center gap-1 opacity-80">
                                                                <Stethoscope size={10} />
                                                                <span className="truncate">{apt.type}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </>
                            )}

                            {view === 'day' && (
                                <>
                                    {displayProfessionals.map(prof => {
                                        const dateStr = formatDate(currentDate);
                                        const slotApt = filteredAppointments.find(
                                            a => a.date === dateStr && a.time === time && a.doctorName === prof
                                        );

                                        return (
                                            <div
                                                key={`${prof}-${time}`}
                                                className="border-r border-slate-800 last:border-r-0 relative p-2 transition-colors min-h-[70px] cursor-pointer"
                                                onClick={() => !slotApt && handleNewAppointment(dateStr, time)}
                                            >
                                                {slotApt && (
                                                    <div
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/schedule/${slotApt.id}`); }}
                                                        className={`h-full rounded-md p-3 text-sm cursor-pointer shadow-md border-l-4 hover:shadow-lg transition-all ${getSpecialtyStyle(slotApt.type).bg} ${getSpecialtyStyle(slotApt.type).border} ${getSpecialtyStyle(slotApt.type).text}`}
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="font-bold">{slotApt.patientName}</span>
                                                            <span className={`w-3 h-3 rounded-full ${getStatusIndicator(slotApt.status).color}`}></span>
                                                        </div>
                                                        <div className="flex items-center gap-1 opacity-80 text-xs">
                                                            <Clock size={12} />
                                                            <span>{slotApt.time} - {slotApt.type}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Agenda;
