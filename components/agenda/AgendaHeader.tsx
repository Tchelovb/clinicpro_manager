import React from 'react';
import { ChevronLeft, ChevronRight, Search, Users, ShieldCheck, ChevronDown } from 'lucide-react';
import { format, isToday, isSameWeek, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useData } from '../../contexts/DataContext';
import { AgendaSearch } from './AgendaSearch';

export const AgendaHeader: React.FC<any> = ({
    currentDate,
    onNavigate,
    onToday,
    view,
    onViewChange,
    onSelectDate,
    onSelectAppointment,
    professionals = [],
    filterProfessional,
    onFilterProfessionalChange
}) => {
    const { profile } = useData() as any;

    const getDynamicLabel = () => {
        const now = new Date();
        if (view === 'day') return isToday(currentDate) ? 'Hoje' : 'Dia';
        if (view === 'week') return isSameWeek(currentDate, now) ? 'Esta Semana' : 'Semana';
        if (view === 'month') return isSameMonth(currentDate, now) ? 'Este Mês' : 'Mês';
        return 'Hoje';
    };

    return (
        <header className="bg-white/80 backdrop-blur-md dark:bg-slate-900/80 sticky top-0 z-40 border-b border-gray-200 dark:border-slate-800 p-4">
            <div className="max-w-[1800px] mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                {/* 1. TÍTULO E SELETOR DE PROFISSIONAL */}
                <div className="flex items-center justify-between lg:justify-start min-w-fit">
                    <div className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <span className="hidden md:inline">Agenda:</span>

                        <div className="relative inline-flex items-center group">
                            <select
                                value={filterProfessional || 'ALL'}
                                onChange={(e) => onFilterProfessionalChange && onFilterProfessionalChange(e.target.value)}
                                className="appearance-none bg-transparent text-primary-600 font-extrabold pr-8 pl-2 py-1 cursor-pointer outline-none focus:ring-2 focus:ring-primary-100 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                            >
                                <option value="ALL" className="text-slate-900 font-bold">Todos os Dentistas</option>
                                <option disabled className="text-slate-400">─── Selecione ───</option>
                                {professionals.map((prof: any) => (
                                    <option key={prof.id} value={prof.id} className="text-slate-900">
                                        Dr(a). {prof.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={20} className="absolute right-2 text-primary-600 pointer-events-none group-hover:translate-y-0.5 transition-transform" />
                        </div>
                    </div>
                </div>

                {/* 2. NAVEGAÇÃO COMPACTA (CENTRO) */}
                <div className="flex flex-1 items-center justify-center gap-4 overflow-x-auto no-scrollbar py-1 lg:py-0">
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
                        <button onClick={() => onNavigate('prev')} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm text-slate-600 dark:text-slate-300">
                            <ChevronLeft size={18} />
                        </button>
                        <button onClick={onToday} className="px-6 py-2 bg-white dark:bg-slate-700 rounded-lg text-sm font-bold text-primary-700 dark:text-primary-400 shadow-sm transition-all active:scale-95 whitespace-nowrap border border-slate-200 dark:border-slate-600">
                            {getDynamicLabel()}
                        </button>
                        <button onClick={() => onNavigate('next')} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm text-slate-600 dark:text-slate-300">
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold shadow-inner shrink-0">
                        {['day', 'week', 'month'].map((v) => (
                            <button
                                key={v}
                                onClick={() => onViewChange(v as any)}
                                className={`px-4 py-2 rounded-lg transition-all ${view === v ? 'bg-white dark:bg-slate-700 shadow-md text-primary-600 scale-105' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {v === 'day' ? 'Dia' : v === 'week' ? 'Semana' : 'Mês'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. BUSCA SPOTLIGHT (DIREITA) */}
                <div className="hidden lg:block w-80 shrink-0">
                    <AgendaSearch
                        className="w-full h-10 bg-slate-100 dark:bg-slate-800 border-none rounded-full px-4 transition-all focus-within:ring-2 focus-within:ring-primary-500 focus-within:w-96 placeholder:text-slate-400"
                        placeholder="Buscar paciente (⌘+K)"
                        onSelectDate={onSelectDate || (() => { })}
                        onSelectAppointment={onSelectAppointment || (() => { })}
                    />
                </div>

            </div>

            {/* MOBILE SEARCH (LINHA EXTRA APENAS MOBILE) */}
            <div className="lg:hidden w-full relative mt-4">
                <AgendaSearch
                    className="w-full h-12 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl pl-12 pr-4 text-base focus:ring-2 focus:ring-primary-500 transition-all"
                    placeholder="Buscar paciente..."
                    onSelectDate={onSelectDate || (() => { })}
                    onSelectAppointment={onSelectAppointment || (() => { })}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            </div>
        </header>
    );
};
