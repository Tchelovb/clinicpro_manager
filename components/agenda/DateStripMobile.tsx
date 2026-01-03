import React, { useRef, useEffect } from 'react';
import { format, addDays, isSameDay, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../../src/lib/utils';

interface DateStripMobileProps {
    currentDate: Date;
    onDateChange: (date: Date) => void;
    appointmentDates?: Date[]; // Datas com agendamentos (para mostrar indicadores)
}

export function DateStripMobile({ currentDate, onDateChange, appointmentDates = [] }: DateStripMobileProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Gerar 30 dias (15 antes, dia atual, 14 depois)
    const dates = Array.from({ length: 30 }, (_, i) => {
        const baseDate = startOfWeek(currentDate, { weekStartsOn: 0 });
        return addDays(baseDate, i - 15);
    });

    // Auto-scroll para data selecionada
    useEffect(() => {
        if (scrollContainerRef.current) {
            const selectedIndex = dates.findIndex(date => isSameDay(date, currentDate));
            const container = scrollContainerRef.current;
            const itemWidth = 72; // w-18 = 72px
            const scrollPosition = (selectedIndex * itemWidth) - (container.clientWidth / 2) + (itemWidth / 2);

            container.scrollTo({
                left: scrollPosition,
                behavior: 'smooth'
            });
        }
    }, [currentDate]);

    const hasAppointments = (date: Date) => {
        return appointmentDates.some(aptDate => isSameDay(aptDate, date));
    };

    return (
        <div className="md:hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-700">
            <div
                ref={scrollContainerRef}
                className="flex overflow-x-auto scrollbar-hide px-4 py-3 gap-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {dates.map((date, index) => {
                    const isSelected = isSameDay(date, currentDate);
                    const isToday = isSameDay(date, new Date());
                    const hasApts = hasAppointments(date);

                    return (
                        <button
                            key={index}
                            onClick={() => onDateChange(date)}
                            className={cn(
                                "flex-shrink-0 w-18 h-20 rounded-[16px] flex flex-col items-center justify-center",
                                "transition-all duration-300",
                                "border-2",
                                isSelected
                                    ? "bg-blue-500 border-blue-500 shadow-lg scale-105"
                                    : "bg-white/40 dark:bg-slate-800/40 border-transparent hover:border-blue-200"
                            )}
                        >
                            {/* Dia da Semana */}
                            <span className={cn(
                                "text-xs font-medium uppercase tracking-wider",
                                isSelected ? "text-white" : "text-slate-500 dark:text-slate-400"
                            )}>
                                {format(date, 'EEE', { locale: ptBR })}
                            </span>

                            {/* Número do Dia */}
                            <span className={cn(
                                "text-2xl font-light mt-1",
                                isSelected ? "text-white" : isToday ? "text-blue-500 font-semibold" : "text-slate-900 dark:text-white"
                            )}>
                                {format(date, 'd')}
                            </span>

                            {/* Indicador de Agendamentos */}
                            {hasApts && !isSelected && (
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
