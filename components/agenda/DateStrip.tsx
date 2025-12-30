import React, { useRef, useEffect } from 'react';
import { format, isSameDay, isToday, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DateStripProps {
    currentDate: Date;
    onSelectDate: (date: Date) => void;
}

export const DateStrip: React.FC<DateStripProps> = ({ currentDate, onSelectDate }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));

    useEffect(() => {
        // Simple scroll to view if needed, though for 7 days usually fits or scroll is minor
        if (scrollRef.current) {
            // Logic to center the selected day could go here
        }
    }, [currentDate]);

    return (
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-2">
            <div
                ref={scrollRef}
                className="flex items-center gap-2 overflow-x-auto px-4 no-scrollbar snap-x"
            >
                {days.map(day => {
                    const isSelected = isSameDay(day, currentDate);
                    const isDayToday = isToday(day);

                    return (
                        <button
                            key={day.toISOString()}
                            onClick={() => onSelectDate(day)}
                            className={`
                                flex-shrink-0 flex flex-col items-center justify-center w-14 h-16 rounded-xl transition-all snap-center
                                ${isSelected
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-none'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}
                                ${isDayToday && !isSelected ? 'border border-blue-200 text-blue-600' : ''}
                            `}
                        >
                            <span className="text-[10px] uppercase font-bold opacity-80">
                                {format(day, 'EEE', { locale: ptBR })}
                            </span>
                            <span className="text-xl font-bold">
                                {format(day, 'd')}
                            </span>
                            {isDayToday && <div className={`w-1 h-1 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-blue-600'}`} />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
