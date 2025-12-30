import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Filter, Layers } from 'lucide-react';
import { format, addDays, addWeeks, addMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AgendaSearch } from './AgendaSearch';

interface AgendaHeaderProps {
    currentDate: Date;
    setCurrentDate: (date: Date) => void;
    viewMode: 'day' | 'week' | 'month';
    setViewMode: (mode: 'day' | 'week' | 'month') => void;
    filterProfessional: string;
    setFilterProfessional: (id: string) => void;
    professionals: any[];
    onNewAppointment: () => void;
    onSelectAppointment: (id: string) => void;
}

export const AgendaHeader: React.FC<AgendaHeaderProps> = ({
    currentDate,
    setCurrentDate,
    viewMode,
    setViewMode,
    filterProfessional,
    setFilterProfessional,
    professionals,
    onNewAppointment,
    onSelectAppointment
}) => {

    const handleNavigate = (direction: 'prev' | 'next') => {
        const amount = direction === 'next' ? 1 : -1;
        if (viewMode === 'day') setCurrentDate(addDays(currentDate, amount));
        if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, amount));
        if (viewMode === 'month') setCurrentDate(addMonths(currentDate, amount));
    };

    const getPeriodLabel = () => {
        if (viewMode === 'day') return format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR });
        if (viewMode === 'week') {
            const start = startOfWeek(currentDate, { weekStartsOn: 1 });
            const end = endOfWeek(currentDate, { weekStartsOn: 1 });
            return `${format(start, "d MMM", { locale: ptBR })} - ${format(end, "d MMM", { locale: ptBR })}`;
        }
        if (viewMode === 'month') return format(currentDate, "MMMM yyyy", { locale: ptBR });
    };

    return (
        <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 z-10 sticky top-0 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Top Row: Title, Nav, Search */}
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-tight capitalize">
                                {viewMode === 'day' ? 'Agenda Diária' : viewMode === 'week' ? 'Visão Semanal' : 'Visão Mensal'}
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                                {getPeriodLabel()}
                            </p>
                        </div>
                    </div>

                    {/* Search & Actions (Desktop) */}
                    <div className="hidden md:flex items-center gap-3">
                        <AgendaSearch
                            onSelectDate={(d) => {
                                setCurrentDate(d);
                                setViewMode('day'); // Force day view to show details
                            }}
                            onSelectAppointment={onSelectAppointment}
                        />

                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                            <button onClick={() => handleNavigate('prev')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all shadow-sm">
                                <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </button>
                            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                                Hoje
                            </button>
                            <button onClick={() => handleNavigate('next')} className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all shadow-sm">
                                <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </button>
                        </div>

                        <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 ml-2">
                            {['day', 'week', 'month'].map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode as any)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewMode === mode
                                            ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white'
                                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                        }`}
                                >
                                    {mode === 'day' ? 'Dia' : mode === 'week' ? 'Semana' : 'Mês'}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={onNewAppointment}
                            className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg shadow-lg active:scale-95 transition-transform"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Mobile Controls Row */}
                <div className="flex md:hidden items-center justify-between gap-2">
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 flex-1">
                        <button onClick={() => handleNavigate('prev')} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md">
                            <ChevronLeft className="w-4 h-4 text-slate-600" />
                        </button>
                        <button onClick={() => setCurrentDate(new Date())} className="flex-1 text-xs font-bold text-center text-slate-700">
                            Hoje
                        </button>
                        <button onClick={() => handleNavigate('next')} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md">
                            <ChevronRight className="w-4 h-4 text-slate-600" />
                        </button>
                    </div>

                    {/* Mobile View Switcher */}
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                        <button onClick={() => setViewMode('day')} className={`p-2 rounded-md ${viewMode === 'day' ? 'bg-white shadow' : 'text-slate-500'}`}>
                            <span className="text-xs font-bold">1D</span>
                        </button>
                        <button onClick={() => setViewMode('week')} className={`p-2 rounded-md ${viewMode === 'week' ? 'bg-white shadow' : 'text-slate-500'}`}>
                            <span className="text-xs font-bold">7D</span>
                        </button>
                    </div>

                    <AgendaSearch
                        onSelectDate={(d) => {
                            setCurrentDate(d);
                            setViewMode('day');
                        }}
                        onSelectAppointment={onSelectAppointment}
                    />
                </div>

                {/* Filters Row */}
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    <select
                        className="bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 px-3 focus:ring-0 min-w-[140px]"
                        value={filterProfessional}
                        onChange={(e) => setFilterProfessional(e.target.value)}
                    >
                        <option value="ALL">Todos os Profissionais</option>
                        {professionals.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};
