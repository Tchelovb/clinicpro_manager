import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import {
    ChevronLeft, ChevronRight, Plus, CheckCircle, Activity,
    UserX, Filter, Calendar as CalendarIcon, Clock, AlertTriangle, AlertCircle,
    BriefcaseMedical, Zap, Repeat, MoreVertical, MessageCircle, Edit2, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Appointment } from '../types';
import { supabase } from '../lib/supabase';
import AgendaEmptyState from './agenda/AgendaEmptyState';
import QuickSearch from './agenda/QuickSearch';
import { useDragAndDrop } from '../hooks/useDragAndDrop';

const Agenda: React.FC = () => {
    const navigate = useNavigate();
    const { appointments, professionals, agendaConfig, updateAppointment } = useData();
    const professionalNames = useMemo(() => professionals.filter(p => p.active).map(p => p.name), [professionals]);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'day' | 'week' | 'month'>('week');

    // Filters
    const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>([]);
    // ... existing code ...

    // --- QUICK ACTIONS HANDLERS ---
    const handleConfirmAppointment = async (id: string) => {
        try {
            await supabase
                .from('appointments')
                .update({ status: 'Confirmado' })
                .eq('id', id);
            updateAppointment(id, { status: 'Confirmado' });
        } catch (error) {
            console.error('Erro ao confirmar:', error);
            alert('Erro ao confirmar agendamento');
        }
    };
    // ...
    const handleCancelAppointment = async (id: string) => {
        if (!confirm('Tem certeza que deseja cancelar este agendamento?')) return;

        try {
            await supabase
                .from('appointments')
                .update({ status: 'Cancelado' })
                .eq('id', id);
            updateAppointment(id, { status: 'Cancelado' });
        } catch (error) {
            console.error('Erro ao cancelar:', error);
            alert('Erro ao cancelar agendamento');
        }
    };

    const handleCompleteAppointment = async (id: string) => {
        try {
            await supabase
                .from('appointments')
                .update({ status: 'Concluído' })
                .eq('id', id);
            updateAppointment(id, { status: 'Concluído' });
        } catch (error) {
            console.error('Erro ao concluir:', error);
            alert('Erro ao marcar como concluído');
        }
    };

    // --- DRAG & DROP HANDLER ---
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

            updateAppointment(aptId, { date: newDate, time: newTime, doctorName: newProfessional });
            alert('✅ Agendamento reagendado com sucesso!');
        } catch (error) {
            console.error('Erro ao reagendar:', error);
            alert('Erro ao reagendar agendamento');
        }
    };

    const {
        isDragging,
        draggedAppointment,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        handleDragLeave,
        isDragOverSlot,
    } = useDragAndDrop(handleReschedule);

    // --- COMPONENTS ---
    const KpiCard = ({ label, value, sub, color, icon: Icon }: any) => (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3 min-w-[140px] flex-1 md:flex-none">
            <div className={`p-2 rounded-lg ${color} bg-opacity-10 dark:bg-opacity-20`}>
                <Icon size={18} className={color.replace('bg-', 'text-')} />
            </div>
            <div>
                <p className="text-[10px] uppercase font-bold text-gray-400">{label}</p>
                <p className="text-lg font-bold text-gray-800 dark:text-gray-100 leading-tight">{value}</p>
                {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
            </div>
        </div>
    );

    const getTypeStyle = (type: string) => {
        switch (type) {
            case 'Avaliação': return { bg: 'bg-blue-100 dark:bg-blue-900/40', border: 'border-blue-500 dark:border-blue-400', text: 'text-blue-800 dark:text-blue-200', icon: CalendarIcon };
            case 'Procedimento': return { bg: 'bg-green-100 dark:bg-green-900/40', border: 'border-green-500 dark:border-green-400', text: 'text-green-800 dark:text-green-200', icon: BriefcaseMedical };
            case 'Retorno': return { bg: 'bg-purple-100 dark:bg-purple-900/40', border: 'border-purple-500 dark:border-purple-400', text: 'text-purple-800 dark:text-purple-200', icon: Repeat };
            case 'Urgência': return { bg: 'bg-red-100 dark:bg-red-900/40', border: 'border-red-500 dark:border-red-400', text: 'text-red-800 dark:text-red-200', icon: Zap };
            default: return { bg: 'bg-gray-100 dark:bg-gray-700', border: 'border-gray-400 dark:border-gray-500', text: 'text-gray-700 dark:text-gray-200', icon: Clock };
        }
    };

    // Quick Actions Menu Component (Inline)
    const QuickActionsMenu: React.FC<{ apt: Appointment }> = ({ apt }) => {
        const [isOpen, setIsOpen] = useState(false);

        return (
            <div className="relative">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors opacity-0 group-hover:opacity-100"
                >
                    <MoreVertical size={14} />
                </button>

                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 py-1">
                            {apt.status !== 'Confirmado' && apt.status !== 'Concluído' && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleConfirmAppointment(apt.id); setIsOpen(false); }}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                                >
                                    <CheckCircle size={16} className="text-green-600" />
                                    Confirmar
                                </button>
                            )}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleSendReminder(apt.id); setIsOpen(false); }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                            >
                                <MessageCircle size={16} className="text-blue-600" />
                                Enviar Lembrete
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); navigate(`/agenda/${apt.id}`); setIsOpen(false); }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                            >
                                <Edit2 size={16} className="text-gray-600" />
                                Editar
                            </button>
                            {apt.status !== 'Concluído' && apt.status !== 'Cancelado' && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleCompleteAppointment(apt.id); setIsOpen(false); }}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-700 dark:text-gray-300"
                                >
                                    <Clock size={16} className="text-green-600" />
                                    Marcar como Concluído
                                </button>
                            )}
                            {apt.status !== 'Cancelado' && (
                                <>
                                    <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleCancelAppointment(apt.id); setIsOpen(false); }}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-red-600 dark:text-red-400"
                                    >
                                        <X size={16} />
                                        Cancelar
                                    </button>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        );
    };

    const AppointmentItem: React.FC<{ apt: Appointment }> = ({ apt }) => {
        const style = getTypeStyle(apt.type);
        const isCanceled = apt.status === 'Cancelado';
        const isNoShow = apt.status === 'Faltou';
        const isCompleted = apt.status === 'Concluído';

        let opacityClass = '';
        if (isCanceled) opacityClass = 'opacity-50 grayscale';
        if (isCompleted) opacityClass = 'opacity-80';

        return (
            <div
                draggable
                onDragStart={(e) => {
                    e.stopPropagation();
                    handleDragStart(apt);
                }}
                onDragEnd={handleDragEnd}
                onClick={(e) => { e.stopPropagation(); navigate(`/agenda/${apt.id}`); }}
                className={`
                rounded px-2 py-1 mb-1 border-l-4 text-xs shadow-sm cursor-move hover:brightness-95 dark:hover:brightness-110 transition-all
                ${style.bg} ${style.border} ${style.text} ${opacityClass}
                ${isNoShow ? 'bg-red-50 dark:bg-red-900/20 border-red-600 text-red-900 dark:text-red-300 ring-1 ring-red-200 dark:ring-red-900' : ''}
                relative group h-full flex flex-col justify-center overflow-hidden
            `}
                title={`${apt.time} - ${apt.patientName} (${apt.type}) - ${apt.doctorName} - ${apt.status}`}
            >
                <div className="flex justify-between items-center gap-1">
                    <span className="font-bold truncate">{apt.patientName}</span>
                    <div className="flex items-center gap-1">
                        {isNoShow && <AlertTriangle size={10} className="text-red-600 dark:text-red-400 shrink-0" />}
                        {isCompleted && <CheckCircle size={10} className="text-green-600 dark:text-green-400 shrink-0" />}
                        {apt.status === 'Confirmado' && <CheckCircle size={10} className="text-blue-600 dark:text-blue-400 shrink-0" />}
                        <QuickActionsMenu apt={apt} />
                    </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] opacity-80 truncate">
                    <style.icon size={8} /> <span>{apt.type}</span>
                </div>
                {selectedProfessionals.length > 1 && (
                    <div className="text-[9px] opacity-70 truncate mt-0.5">{apt.doctorName.split(' ')[0]}</div>
                )}
            </div>
        );
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col bg-gray-50/50 dark:bg-gray-900 pb-20 md:pb-0 relative overflow-hidden transition-colors">
            {/* --- HEADER --- */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex flex-col md:flex-row justify-between items-center gap-4 z-10 transition-colors">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                        <button onClick={handlePrev} className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded shadow-sm transition text-gray-600 dark:text-gray-300"><ChevronLeft size={18} /></button>
                        <button onClick={() => setCurrentDate(new Date())} className="px-3 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">Hoje</button>
                        <button onClick={handleNext} className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded shadow-sm transition text-gray-600 dark:text-gray-300"><ChevronRight size={18} /></button>
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white capitalize w-48 text-center md:text-left">
                        {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', day: view === 'day' ? 'numeric' : undefined })}
                    </h2>
                </div>

                <div className="flex overflow-x-auto gap-2 w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                    <KpiCard label="Faltas / No-Show" value={rangeKPIs.noShows} sub={`${rangeKPIs.noShowRate.toFixed(1)}%`} color="bg-red-500" icon={UserX} />
                    <KpiCard label="Confirmados" value={rangeKPIs.confirmed} sub={`de ${rangeKPIs.total}`} color="bg-green-500" icon={CheckCircle} />
                    <KpiCard label="Ocupação" value={`${rangeKPIs.occupancy.toFixed(0)}%`} color="bg-blue-500" icon={Activity} />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                    {/* QUICK SEARCH */}
                    <QuickSearch appointments={appointments} />

                    <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-lg flex text-xs font-medium">
                        <button onClick={() => setView('day')} className={`px-3 py-1.5 rounded transition-colors ${view === 'day' ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>Dia</button>
                        <button onClick={() => setView('week')} className={`px-3 py-1.5 rounded transition-colors ${view === 'week' ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>Semana</button>
                        <button onClick={() => setView('month')} className={`px-3 py-1.5 rounded transition-colors ${view === 'month' ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}>Mês</button>
                    </div>
                    <button
                        onClick={() => navigate('/agenda/new')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap ml-auto"
                    >
                        <Plus size={16} /> <span className="hidden sm:inline">Agendar</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* --- SIDEBAR FILTER --- */}
                <div className="w-60 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 hidden lg:flex flex-col gap-6 overflow-y-auto transition-colors">
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Filter size={12} /> Profissionais</h3>
                        <div className="space-y-2">
                            {professionalNames.map(prof => (
                                <label key={prof} className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        className="rounded text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                                        checked={selectedProfessionals.includes(prof)}
                                        onChange={() => {
                                            if (selectedProfessionals.includes(prof)) {
                                                setSelectedProfessionals(selectedProfessionals.filter(p => p !== prof));
                                            } else {
                                                setSelectedProfessionals([...selectedProfessionals, prof]);
                                            }
                                        }}
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{prof}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Status</h3>
                        <div className="space-y-2">
                            {['Confirmado', 'Pendente', 'Concluído', 'Faltou', 'Cancelado'].map(status => (
                                <label key={status} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="rounded text-blue-600 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                                        checked={selectedStatuses.includes(status)}
                                        onChange={() => {
                                            if (selectedStatuses.includes(status)) {
                                                setSelectedStatuses(selectedStatuses.filter(s => s !== status));
                                            } else {
                                                setSelectedStatuses([...selectedStatuses, status]);
                                            }
                                        }}
                                    />
                                    <span className={`text-sm ${status === 'Faltou' ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>{status}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Tipo</h3>
                        <div className="space-y-2">
                            {['Avaliação', 'Procedimento', 'Retorno', 'Urgência'].map(type => (
                                <div key={type} className="flex items-center gap-2">
                                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                                        <input
                                            type="checkbox"
                                            className="rounded text-blue-600 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                                            checked={selectedTypes.includes(type)}
                                            onChange={() => {
                                                if (selectedTypes.includes(type)) {
                                                    setSelectedTypes(selectedTypes.filter(t => t !== type));
                                                } else {
                                                    setSelectedTypes([...selectedTypes, type]);
                                                }
                                            }}
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{type}</span>
                                    </label>
                                    <div className={`w-3 h-3 rounded-full ${getTypeStyle(type).bg} ${getTypeStyle(type).border} border`}></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- MAIN CALENDAR AREA --- */}
                <div className="flex-1 overflow-auto bg-white dark:bg-gray-800 relative transition-colors">

                    {/* EMPTY STATE */}
                    {!hasAppointmentsInView ? (
                        <AgendaEmptyState view={view} onNewAppointment={handleNewAppointment} />
                    ) : (
                        <>
                            {/* === DAY VIEW === */}
                            {view === 'day' && (
                                <div className="min-w-[600px] h-full flex flex-col">
                                    <div className="flex border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-20 shadow-sm ml-14">
                                        {selectedProfessionals.map(prof => (
                                            <div key={prof} className="flex-1 py-3 px-2 text-center border-r border-gray-100 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-300 text-sm truncate">{prof}</div>
                                        ))}
                                    </div>
                                    <div className="flex-1 relative">
                                        {timeSlots.map(time => (
                                            <div key={time} className="flex min-h-[80px] border-b border-gray-50 dark:border-gray-700 group">
                                                <div className="w-14 border-r border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-start justify-center pt-2 text-xs text-gray-500 dark:text-gray-400 font-bold shrink-0 sticky left-0 z-10">{time}</div>
                                                {selectedProfessionals.map(prof => {
                                                    const apt = filteredAppointments.find(a => a.doctorName === prof && a.date === formatDate(currentDate) && a.time === time);
                                                    const dateStr = formatDate(currentDate);
                                                    const isOver = isDragOverSlot(dateStr, time, prof);

                                                    return (
                                                        <div
                                                            key={`${prof}-${time}`}
                                                            className={`flex-1 border-r border-gray-50 dark:border-gray-700 relative p-1 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${isOver ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-400' : ''}`}
                                                            onClick={() => !apt && handleNewAppointment(dateStr, time)}
                                                            onDragOver={(e) => { e.preventDefault(); handleDragOver(dateStr, time, prof); }}
                                                            onDragLeave={handleDragLeave}
                                                            onDrop={(e) => { e.preventDefault(); handleDragEnd(); }}
                                                        >
                                                            {apt ? (
                                                                <AppointmentItem apt={apt} />
                                                            ) : (
                                                                <div className="w-full h-full opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer text-gray-300 dark:text-gray-600 hover:text-blue-400">
                                                                    <Plus size={20} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* === WEEK VIEW === */}
                            {view === 'week' && (
                                <div className="min-w-[900px] h-full flex flex-col">
                                    <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-20 shadow-sm ml-14">
                                        {getWeekDates(currentDate).map((date, idx) => {
                                            const isToday = date.toDateString() === new Date().toDateString();
                                            return (
                                                <div key={idx} className={`py-3 px-2 text-center border-r border-gray-100 dark:border-gray-700 ${isToday ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
                                                    <p className={`text-xs uppercase font-semibold ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][date.getDay()]}
                                                    </p>
                                                    <div className={`text-lg font-bold inline-block w-8 h-8 leading-8 rounded-full ${isToday ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-800 dark:text-gray-200'}`}>
                                                        {date.getDate()}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="flex-1 relative">
                                        {timeSlots.map(time => (
                                            <div key={time} className="flex min-h-[60px] border-b border-gray-50 dark:border-gray-700 group">
                                                <div className="w-14 border-r border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-start justify-center pt-2 text-xs text-gray-500 dark:text-gray-400 font-bold shrink-0 sticky left-0 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                                                    {time}
                                                </div>

                                                <div className="flex-1 grid grid-cols-7">
                                                    {getWeekDates(currentDate).map((date, idx) => {
                                                        const dateStr = formatDate(date);
                                                        const slotApts = filteredAppointments.filter(a => a.date === dateStr && a.time === time);
                                                        const isOver = slotApts.length === 0 && isDragOverSlot(dateStr, time, selectedProfessionals[0] || '');

                                                        return (
                                                            <div
                                                                key={`${dateStr}-${time}`}
                                                                className={`border-r border-gray-50 dark:border-gray-700 p-1 relative hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${isOver ? 'bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-400' : ''}`}
                                                                onClick={() => slotApts.length === 0 && handleNewAppointment(dateStr, time)}
                                                                onDragOver={(e) => { e.preventDefault(); handleDragOver(dateStr, time, selectedProfessionals[0] || ''); }}
                                                                onDragLeave={handleDragLeave}
                                                                onDrop={(e) => { e.preventDefault(); handleDragEnd(); }}
                                                            >
                                                                {slotApts.map(apt => (
                                                                    <AppointmentItem key={apt.id} apt={apt} />
                                                                ))}

                                                                {slotApts.length === 0 && (
                                                                    <div className="w-full h-full opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer text-gray-300 dark:text-gray-600 hover:text-blue-400">
                                                                        <Plus size={14} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* === MONTH VIEW === */}
                            {view === 'month' && (
                                <div className="h-full flex flex-col p-4">
                                    <div className="grid grid-cols-7 gap-2 mb-2">
                                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                                            <div key={day} className="text-center text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">{day}</div>
                                        ))}
                                    </div>
                                    <div className="flex-1 grid grid-cols-7 grid-rows-5 gap-2">
                                        {getMonthDays(currentDate).map((date, idx) => {
                                            if (!date) return <div key={idx} className="bg-transparent"></div>;

                                            const dayStr = formatDate(date);
                                            const dayApts = filteredAppointments.filter(a => a.date === dayStr);
                                            const isToday = date.toDateString() === new Date().toDateString();

                                            return (
                                                <div key={idx} className={`bg-white dark:bg-gray-800 border rounded-lg p-2 flex flex-col overflow-hidden relative transition-all hover:shadow-md hover:border-blue-300 ${isToday ? 'border-blue-300 dark:border-blue-500 ring-1 ring-blue-100 dark:ring-blue-900' : 'border-gray-200 dark:border-gray-700'}`}>
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className={`text-xs font-bold ${isToday ? 'bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-full' : 'text-gray-700 dark:text-gray-300'}`}>
                                                            {date.getDate()}
                                                        </span>
                                                        {dayApts.length > 0 && <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{dayApts.length}</span>}
                                                    </div>

                                                    {/* Indicadores de Tipo (Dots) */}
                                                    <div className="flex gap-0.5 mb-1">
                                                        {['Avaliação', 'Procedimento', 'Retorno', 'Urgência'].map(type => {
                                                            const count = dayApts.filter(a => a.type === type).length;
                                                            if (count === 0) return null;
                                                            const style = getTypeStyle(type);
                                                            return (
                                                                <div
                                                                    key={type}
                                                                    className={`w-1.5 h-1.5 rounded-full ${style.bg} border ${style.border}`}
                                                                    title={`${count} ${type}`}
                                                                />
                                                            );
                                                        })}
                                                    </div>

                                                    <div className="flex-1 space-y-1 overflow-y-auto scrollbar-hide">
                                                        {dayApts.slice(0, 3).map(apt => {
                                                            const style = getTypeStyle(apt.type);
                                                            return (
                                                                <div key={apt.id} onClick={() => navigate(`/agenda/${apt.id}`)} className={`text-[9px] px-1 py-0.5 rounded border-l-2 truncate cursor-pointer ${style.bg} ${style.border} ${style.text}`}>
                                                                    <span className="font-bold">{apt.time}</span> {apt.patientName}
                                                                </div>
                                                            );
                                                        })}
                                                        {dayApts.length > 3 && (
                                                            <div className="text-[10px] text-center text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/30 rounded py-0.5 cursor-pointer">
                                                                +{dayApts.length - 3} mais
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Agenda;
