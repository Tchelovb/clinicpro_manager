import React from 'react';
import { ChevronLeft, ChevronRight, Search, Users, ShieldCheck } from 'lucide-react';
import { format, isToday, isSameWeek, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useData } from '../../contexts/DataContext';
import { AgendaSearch } from './AgendaSearch';

export const AgendaHeader: React.FC<any> = ({ currentDate, onNavigate, onToday, view, onViewChange, onSelectDate, onSelectAppointment }) => {
    const { profile } = useData();

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

                {/* 1. TÍTULO MASTER */}
                <div className="flex items-center justify-between lg:justify-start min-w-fit">
                    <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        Agenda: <span className="text-primary-600 font-extrabold">{profile?.name || 'Dr. Marcelo'}</span>
                        <ShieldCheck size={20} className="text-blue-500 ml-1" />
                    </h1>
                </div>

                {/* 2. NAVEGAÇÃO COMPACTA (CENTRO) */}
                <div className="flex flex-1 items-center justify-center gap-4 overflow-x-auto no-scrollbar py-1 lg:py-0">
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
                        <button onClick={() => onNavigate('prev')} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm">
                            <ChevronLeft size={18} />
                        </button>
                        <button onClick={onToday} className="px-6 py-2 bg-white dark:bg-slate-700 rounded-lg text-sm font-bold text-primary-700 dark:text-primary-400 shadow-sm transition-all active:scale-95 whitespace-nowrap">
                            {getDynamicLabel()}
                        </button>
                        <button onClick={() => onNavigate('next')} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm">
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold shadow-inner shrink-0">
                        {['day', 'week', 'month'].map((v) => (
                            <button
                                key={v}
                                onClick={() => onViewChange(v as any)}
                                className={`px-4 py-2 rounded-lg transition-all ${view === v ? 'bg-white dark:bg-slate-700 shadow-md text-primary-600' : 'text-slate-500'}`}
                            >
                                {v === 'day' ? '1D' : v === 'week' ? '7D' : 'Mês'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 3. BUSCA SPOTLIGHT (DIREITA) */}
                <div className="hidden lg:block w-80 shrink-0">
                    <AgendaSearch
                        className="w-full h-10 bg-slate-100 dark:bg-slate-800 border-none rounded-full px-4 transition-all focus-within:ring-2 focus-within:ring-primary-500 focus-within:w-96"
                        placeholder="Buscar (⌘+K)"
                        onSelectDate={onSelectDate || (() => { })}
                        onSelectAppointment={onSelectAppointment || (() => { })}
                    />
                </div>

            </div>

            {/* MOBILE SEARCH (LINHA EXTRA APENAS MOBILE) */}
            <div className="lg:hidden w-full relative mt-4">
                <AgendaSearch
                    className="w-full h-12 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl pl-12 pr-4 text-base focus:ring-2 focus:ring-primary-500 transition-all"
                    placeholder="Buscar paciente ou cirurgia..."
                    onSelectDate={onSelectDate || (() => { })}
                    onSelectAppointment={onSelectAppointment || (() => { })}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            </div>
        </header>
    );
};
