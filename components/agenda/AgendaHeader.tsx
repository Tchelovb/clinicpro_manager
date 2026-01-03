import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search, Users, ShieldCheck, ChevronDown, CheckSquare, Activity, Plus } from 'lucide-react';
import { format, isToday, isSameWeek, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useData } from '../../contexts/DataContext';
import { AgendaSearch } from './AgendaSearch';
import { cn } from '../../src/lib/utils';

interface AgendaHeaderProps {
    currentDate: Date;
    onNavigate: (direction: 'prev' | 'next') => void;
    onToday: () => void;
    view: 'day' | 'week' | 'month';
    onViewChange: (view: 'day' | 'week' | 'month') => void;
    onSelectDate?: (date: Date) => void;
    onSelectAppointment?: (appointment: any) => void;
    professionals?: any[];
    filterProfessional?: string;
    onFilterProfessionalChange?: (professionalId: string) => void;
    onOpenTasks?: () => void;
    onOpenProfessionals?: () => void;
    onOpenFlow?: () => void;
    onNewAppointment?: () => void;
}

export const AgendaHeader: React.FC<AgendaHeaderProps> = ({
    currentDate,
    onNavigate,
    onToday,
    view,
    onViewChange,
    onSelectDate,
    onSelectAppointment,
    professionals = [],
    filterProfessional,
    onFilterProfessionalChange,
    onOpenTasks,
    onOpenFlow,
    onOpenProfessionals,
    onNewAppointment
}) => {

    // ... (helper functions stay same) ...
    const getProfessionalLabel = () => {
        if (!filterProfessional || filterProfessional === 'ALL') return 'Profissionais';
        const prof = professionals.find(p => p.id === filterProfessional);
        return prof ? prof.name : 'Profissionais';
    };

    const getDynamicLabel = () => {
        const now = new Date();
        if (view === 'day') return isToday(currentDate) ? 'Hoje' : 'Dia';
        if (view === 'week') return isSameWeek(currentDate, now) ? 'Esta Semana' : 'Semana';
        if (view === 'month') return isSameMonth(currentDate, now) ? 'Este Mês' : 'Mês';
        return 'Hoje';
    };

    return (
        <header className="bg-[#F5F5F7] dark:bg-slate-950 sticky top-0 z-40 p-4 md:p-6 transition-all">
            <div className="max-w-[1800px] mx-auto space-y-4 md:space-y-6">

                {/* LINHA 1: Título, Profissionais e Ações Rápidas */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                    {/* Seletor de Profissional (Minimalista e Tátil) */}
                    <div className="flex items-center justify-between lg:justify-start min-w-fit">
                        <button
                            onClick={onOpenProfessionals}
                            className={cn(
                                "group relative inline-flex items-center gap-3",
                                "bg-white/40 dark:bg-white/5 backdrop-blur-xl",
                                "hover:bg-white/60 dark:hover:bg-white/10",
                                "px-5 py-3 rounded-2xl transition-all duration-300",
                                "border border-white/50 dark:border-white/10",
                                "active:scale-95"
                            )}
                        >
                            <span className="text-xl md:text-2xl font-medium text-slate-900 dark:text-white tracking-tight">
                                {getProfessionalLabel()}
                            </span>
                            <ChevronDown size={20} className="text-slate-400 group-hover:translate-y-0.5 transition-transform" />
                        </button>
                    </div>

                    {/* Ações Rápidas (Direita) */}
                    <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
                        {/* Botão Ver Fluxo */}
                        <button
                            onClick={onOpenFlow}
                            className={cn(
                                "px-5 py-3 rounded-2xl font-medium text-sm whitespace-nowrap",
                                "bg-white/40 dark:bg-white/5 backdrop-blur-xl",
                                "border border-white/50 dark:border-white/10",
                                "hover:bg-white/60 dark:hover:bg-white/10",
                                "transition-all duration-300 active:scale-95",
                                "hidden md:flex items-center gap-2",
                                "text-slate-700 dark:text-slate-300"
                            )}
                        >
                            <Activity className="h-4 w-4" />
                            <span className="hidden md:inline">Fluxo</span>
                        </button>

                        {/* Botão Tarefas - Hidden on Mobile (Moved to TabBar) */}
                        <button
                            onClick={onOpenTasks}
                            className={cn(
                                "hidden md:flex px-5 py-3 rounded-2xl font-medium text-sm whitespace-nowrap",
                                "bg-white/40 dark:bg-white/5 backdrop-blur-xl",
                                "border border-white/50 dark:border-white/10",
                                "hover:bg-white/60 dark:hover:bg-white/10",
                                "transition-all duration-300 active:scale-95",
                                "items-center gap-2",
                                "text-slate-700 dark:text-slate-300"
                            )}
                        >
                            <CheckSquare className="h-4 w-4" />
                            <span>Tarefas</span>
                        </button>

                        {/* Botão NOVO AGENDAMENTO (Primary Action) - Hidden on Mobile (Moved to TabBar FAB) */}
                        <button
                            onClick={onNewAppointment}
                            className={cn(
                                "hidden md:flex px-6 py-3 rounded-2xl font-bold text-sm whitespace-nowrap",
                                "bg-blue-600 hover:bg-blue-700 text-white",
                                "shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40",
                                "transition-all duration-300 active:scale-95 hover:-translate-y-0.5",
                                "items-center gap-2 ml-2"
                            )}
                        >
                            <Plus className="h-5 w-5" />
                            <span>Agendar</span>
                        </button>
                    </div>
                </div>

                {/* LINHA 2: Navegação e Indicador de Faturamento */}
                <div className="flex flex-col lg:flex-row items-center gap-4">

                    {/* Navegação Temporal */}
                    <div className="flex flex-1 items-center justify-center gap-4 overflow-x-auto no-scrollbar py-1 lg:py-0">
                        <div className="flex items-center gap-1 bg-white/40 dark:bg-white/5 backdrop-blur-xl p-1 rounded-xl shrink-0 border border-white/50 dark:border-white/10">
                            <button
                                onClick={() => onNavigate('prev')}
                                className="p-2 hover:bg-white/60 dark:hover:bg-white/10 rounded-lg transition-all text-slate-600 dark:text-slate-300"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={onToday}
                                className="px-6 py-2 bg-white/60 dark:bg-white/10 rounded-lg text-sm font-semibold text-blue-600 dark:text-blue-400 transition-all active:scale-95 whitespace-nowrap"
                            >
                                {getDynamicLabel()}
                            </button>
                            <button
                                onClick={() => onNavigate('next')}
                                className="p-2 hover:bg-white/60 dark:hover:bg-white/10 rounded-lg transition-all text-slate-600 dark:text-slate-300"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        <div className="flex bg-white/40 dark:bg-white/5 backdrop-blur-xl p-1 rounded-xl text-xs font-semibold shrink-0 border border-white/50 dark:border-white/10">
                            {['day', 'week', 'month'].map((v) => (
                                <button
                                    key={v}
                                    onClick={() => onViewChange(v as any)}
                                    className={cn(
                                        "px-4 py-2 rounded-lg transition-all",
                                        view === v
                                            ? 'bg-white/80 dark:bg-white/20 shadow-md text-blue-600 dark:text-blue-400 scale-105'
                                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    )}
                                >
                                    {v === 'day' ? 'Dia' : v === 'week' ? 'Semana' : 'Mês'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* LINHA 3: Busca (Desktop) */}
                <div className="hidden lg:block">
                    <AgendaSearch
                        className="w-full max-w-md h-12 bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-xl px-4 transition-all focus-within:ring-2 focus-within:ring-blue-500 placeholder:text-slate-400"
                        placeholder="Buscar paciente (⌘+K)"
                        onSelectDate={onSelectDate || (() => { })}
                        onSelectAppointment={onSelectAppointment || (() => { })}
                    />
                </div>
            </div>

            {/* MOBILE SEARCH (LINHA EXTRA APENAS MOBILE) */}
            <div className="lg:hidden w-full relative mt-4">
                <AgendaSearch
                    className="w-full h-12 bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-xl pl-12 pr-4 text-base focus:ring-2 focus:ring-blue-500 transition-all"
                    placeholder="Buscar paciente..."
                    onSelectDate={onSelectDate || (() => { })}
                    onSelectAppointment={onSelectAppointment || (() => { })}
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            </div>
        </header>
    );
};
