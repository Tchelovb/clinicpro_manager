import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import {
    ChevronLeft, ChevronRight, Plus, CheckCircle, Activity,
    UserX, Filter, Calendar as CalendarIcon, Clock, AlertTriangle,
    BriefcaseMedical, Zap, Repeat, MoreVertical, Edit2, X,
    MessageCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Appointment } from '../types';
import { supabase } from '../lib/supabase';
import { useDragAndDrop } from '../hooks/useDragAndDrop';

// Styles for event types
// Styles for event types
const getTypeStyle = (type: string) => {
    switch (type) {
        case 'Consulta':
        case 'Avaliação': return {
            bg: 'bg-violet-50 dark:bg-violet-900/20',
            border: 'border-violet-200 dark:border-violet-800',
            text: 'text-violet-700 dark:text-violet-300',
            icon: CalendarIcon,
            indicator: 'bg-violet-500'
        };
        case 'Procedimento': return {
            bg: 'bg-teal-50 dark:bg-teal-900/20',
            border: 'border-teal-200 dark:border-teal-800',
            text: 'text-teal-700 dark:text-teal-300',
            icon: BriefcaseMedical,
            indicator: 'bg-teal-500'
        };
        case 'Retorno': return {
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-200 dark:border-blue-800',
            text: 'text-blue-700 dark:text-blue-300',
            icon: Repeat,
            indicator: 'bg-blue-500'
        };
        case 'Urgência': return {
            bg: 'bg-rose-50 dark:bg-rose-900/20',
            border: 'border-rose-200 dark:border-rose-800',
            text: 'text-rose-700 dark:text-rose-300',
            icon: Zap,
            indicator: 'bg-rose-500'
        };
        default: return {
            bg: 'bg-slate-50 dark:bg-slate-800',
            border: 'border-slate-200 dark:border-slate-700',
            text: 'text-slate-600 dark:text-slate-400',
            icon: Clock,
            indicator: 'bg-slate-400'
        };
    }
};

const Agenda: React.FC = () => {
    const navigate = useNavigate();
    const { appointments, professionals, agendaConfig } = useData();
    // Assuming refreshAppointments might not be available or handled differently
    // If it is available in useData return type, we can ignore the lint if it complains, or handle it safely.
    // For now, I'll rely on real-time subscriptions or manual refresh if implemented in DataContext.

    const professionalNames = useMemo(() => professionals.filter(p => p.active).map(p => p.name), [professionals]);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'day' | 'week' | 'month'>('week');

    // Filters
    const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>([]);

    // Initialize selected professionals
    React.useEffect(() => {
        if (professionals.length > 0 && selectedProfessionals.length === 0) {
            setSelectedProfessionals(professionals.filter(p => p.active).map(p => p.name));
        }
    }, [professionals]);

    // Helpers
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    const getWeekDates = (baseDate: Date) => {
        const dates = [];
        const start = new Date(baseDate);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
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

    // Filter Logic
    const filteredAppointments = useMemo(() => {
        return appointments.filter(apt =>
            selectedProfessionals.includes(apt.doctorName) &&
            apt.status !== 'Cancelado' // Optionally hide cancelled or include based on filter
        );
    }, [appointments, selectedProfessionals]);

    // Navigation
    const handlePrev = () => {
        const newDate = new Date(currentDate);
        if (view === 'day') newDate.setDate(currentDate.getDate() - 1);
        if (view === 'week') newDate.setDate(currentDate.getDate() - 7);
        if (view === 'month') newDate.setMonth(currentDate.getMonth() - 1);
        setCurrentDate(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(currentDate);
        if (view === 'day') newDate.setDate(currentDate.getDate() + 1);
        if (view === 'week') newDate.setDate(currentDate.getDate() + 7);
        if (view === 'month') newDate.setMonth(currentDate.getMonth() + 1);
        setCurrentDate(newDate);
    };

    // Actions
    const handleNewAppointment = (date?: string, time?: string) => {
        // Here we would navigate to a dedicated route instead of a modal
        // Passing state via location state or query params
        const params = new URLSearchParams();
        if (date) params.append('date', date);
        if (time) params.append('time', time);
        navigate(`/dashboard/schedule/new?${params.toString()}`);
    };

    // Drag & Drop
    const handleReschedule = async (aptId: string, newDate: string, newTime: string, newProfessional: string) => {
        try {
            await supabase
                .from('appointments')
                .update({
                    date: newDate,
                    time: newTime,
                    doctorName: newProfessional
                })
                .eq('id', aptId);

            // Optimistic update or refresh would happen here via DataContext subscription
        } catch (error) {
            console.error('Erro ao reagendar:', error);
            alert('Erro ao reagendar');
        }
    };

    const {
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        handleDragLeave,
        isDragOverSlot,
    } = useDragAndDrop(handleReschedule);

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.20))]">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">

                {/* Date Navigation */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-slate-100 rounded-lg p-1">
                        <button onClick={handlePrev} className="p-1 hover:bg-white rounded-md shadow-sm transition text-slate-600">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-4 py-1 text-sm font-medium text-slate-600 hover:text-violet-600 transition-colors">
                            Hoje
                        </button>
                        <button onClick={handleNext} className="p-1 hover:bg-white rounded-md shadow-sm transition text-slate-600">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 capitalize w-40 text-center">
                        {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </h2>
                </div>

                {/* View Switcher */}
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    {(['day', 'week', 'month'] as const).map((v) => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === v
                                ? 'bg-white text-violet-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-800'
                                }`}
                        >
                            {{ day: 'Dia', week: 'Semana', month: 'Mês' }[v]}
                        </button>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate('/dashboard/schedule/new')}
                        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors font-medium shadow-sm"
                    >
                        <Plus size={18} />
                        <span>Novo Agendamento</span>
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">

                {/* Week View Header */}
                {view === 'week' && (
                    <div className="grid grid-cols-[60px_1fr] border-b border-slate-200">
                        <div className="p-4 bg-slate-50 border-r border-slate-200"></div>
                        <div className="grid grid-cols-7">
                            {getWeekDates(currentDate).map((date, idx) => {
                                const isToday = date.toDateString() === new Date().toDateString();
                                return (
                                    <div key={idx} className={`py-4 text-center border-r border-slate-100 last:border-r-0 ${isToday ? 'bg-violet-50' : ''}`}>
                                        <p className={`text-xs uppercase font-bold mb-1 ${isToday ? 'text-violet-600' : 'text-slate-400'}`}>
                                            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][date.getDay()]}
                                        </p>
                                        <div className={`w-8 h-8 flex items-center justify-center rounded-full mx-auto text-sm font-bold ${isToday ? 'bg-violet-600 text-white' : 'text-slate-700'
                                            }`}>
                                            {date.getDate()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Time Slots Area */}
                <div className="flex-1 overflow-y-auto">
                    {timeSlots.map((time) => (
                        <div key={time} className="grid grid-cols-[60px_1fr] min-h-[50px] border-b border-slate-50 last:border-b-0 hover:bg-slate-50/30 transition-colors">
                            <div className="flex items-center justify-center text-xs font-medium text-slate-400 border-r border-slate-100 bg-slate-50/50">
                                {time}
                            </div>

                            {view === 'week' && (
                                <div className="grid grid-cols-7">
                                    {getWeekDates(currentDate).map((date) => {
                                        const dateStr = formatDate(date);
                                        const slotApts = filteredAppointments.filter(
                                            a => a.date === dateStr && a.time === time
                                        );
                                        const isOver = isDragOverSlot(dateStr, time, selectedProfessionals[0] || '');

                                        return (
                                            <div
                                                key={`${dateStr}-${time}`}
                                                className={`
                                                    border-r border-slate-100 last:border-r-0 relative p-1 transition-colors
                                                    ${isOver ? 'bg-violet-50 ring-2 ring-violet-200 ring-inset z-10' : ''}
                                                `}
                                                onDragOver={(e) => { e.preventDefault(); handleDragOver(dateStr, time, selectedProfessionals[0] || ''); }}
                                                onDragLeave={handleDragLeave}
                                                onDrop={(e) => { e.preventDefault(); handleDragEnd(); }}
                                                onClick={() => slotApts.length === 0 && handleNewAppointment(dateStr, time)}
                                            >
                                                {slotApts.map(apt => {
                                                    const style = getTypeStyle(apt.type);
                                                    return (
                                                        <div
                                                            key={apt.id}
                                                            draggable
                                                            onDragStart={(e) => { e.stopPropagation(); handleDragStart(apt); }}
                                                            onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/schedule/${apt.id}`); }}
                                                            className={`
                                                                rounded-md p-1.5 text-xs mb-1 cursor-pointer shadow-sm border-l-4
                                                                hover:shadow-md transition-all group
                                                                ${style.bg} ${style.border} ${style.text}
                                                                ${apt.status === 'Confirmado' ? 'border-l-teal-500' : ''}
                                                            `}
                                                            style={{ borderLeftColor: apt.status === 'Confirmado' ? undefined : '' }} // Override if needed
                                                        >
                                                            <div className="font-bold truncate">{apt.patientName}</div>
                                                            <div className="flex justify-between items-center opacity-70 mt-0.5">
                                                                <span>{apt.type}</span>
                                                                <style.icon size={10} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {view === 'day' && (
                                <div className="grid" style={{ gridTemplateColumns: `repeat(${Math.max(1, selectedProfessionals.length)}, 1fr)` }}>
                                    {selectedProfessionals.map(prof => {
                                        const dateStr = formatDate(currentDate);
                                        const slotApt = filteredAppointments.find(
                                            a => a.date === dateStr && a.time === time && a.doctorName === prof
                                        );
                                        const isOver = isDragOverSlot(dateStr, time, prof);

                                        return (
                                            <div
                                                key={`${prof}-${time}`}
                                                className={`
                                                    border-r border-slate-100 last:border-r-0 relative p-1 transition-colors min-h-[60px]
                                                    ${isOver ? 'bg-violet-50 ring-2 ring-violet-200 ring-inset' : ''}
                                                `}
                                                onDragOver={(e) => { e.preventDefault(); handleDragOver(dateStr, time, prof); }}
                                                onDragLeave={handleDragLeave}
                                                onDrop={(e) => { e.preventDefault(); handleDragEnd(); }}
                                                onClick={() => !slotApt && handleNewAppointment(dateStr, time)}
                                            >
                                                {slotApt && (
                                                    <div
                                                        draggable
                                                        onDragStart={(e) => { e.stopPropagation(); handleDragStart(slotApt); }}
                                                        onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/schedule/${slotApt.id}`); }}
                                                        className={`
                                                            h-full rounded-md p-2 text-xs cursor-pointer shadow-sm border-l-4
                                                            hover:shadow-md transition-all
                                                            ${getTypeStyle(slotApt.type).bg} 
                                                            ${getTypeStyle(slotApt.type).text}
                                                            ${slotApt.status === 'Confirmado' ? 'border-l-teal-500' : 'border-l-slate-300'}
                                                        `}
                                                    >
                                                        <div className="font-bold text-sm">{slotApt.patientName}</div>
                                                        <div className="flex items-center gap-1 mt-1 opacity-80">
                                                            <Clock size={12} />
                                                            <span>{slotApt.time} - {slotApt.type}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Agenda;
