import React from 'react';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Appointment {
    id: string;
    date: string;
    type: string;
    status: string;
}

interface MonthViewProps {
    currentDate: Date;
    appointments: Appointment[];
    onSelectDate: (date: Date) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({ currentDate, appointments, onSelectDate }) => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const dateFormat = "d";
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-950 overflow-hidden">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800">
                {weekDays.map(day => (
                    <div key={day} className="py-2 text-center text-xs font-bold text-slate-500 uppercase">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 grid grid-cols-7 grid-rows-5 md:grid-rows-6">
                {days.map((day, i) => {
                    const dayAppointments = appointments.filter(apt => isSameDay(new Date(apt.date), day));
                    const isCurrentMonth = isSameMonth(day, monthStart);

                    // Heatmap Stats
                    const procedures = dayAppointments.filter(a => a.type === 'TREATMENT').length;
                    const evaluations = dayAppointments.filter(a => a.type === 'EVALUATION').length;
                    const others = dayAppointments.length - procedures - evaluations;

                    return (
                        <div
                            key={day.toString()}
                            className={`
                                relative border-r border-b border-slate-100 dark:border-slate-800 p-2 transition-colors cursor-pointer
                                ${!isCurrentMonth ? 'bg-slate-50/50 dark:bg-slate-900/50 text-slate-400' : 'bg-white dark:bg-slate-950'}
                                ${isToday(day) ? 'bg-blue-50/30' : ''}
                                hover:bg-slate-50 dark:hover:bg-slate-800
                            `}
                            onClick={() => onSelectDate(day)}
                        >
                            {/* Day Number */}
                            <div className="flex justify-between items-start">
                                <span className={`
                                    text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                                    ${isToday(day) ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-300'}
                                `}>
                                    {format(day, dateFormat)}
                                </span>

                                {/* Desktop: Mini Counts */}
                                <div className="hidden md:flex flex-col items-end gap-0.5">
                                    {dayAppointments.length > 0 && (
                                        <span className="text-[10px] font-bold text-slate-400">{dayAppointments.length} agend.</span>
                                    )}
                                </div>
                            </div>

                            {/* Dots Container */}
                            <div className="mt-2 flex flex-wrap gap-1 content-start">
                                {/* Create visual dots up to a max amount to prevent overflow */}
                                {dayAppointments.slice(0, 12).map((apt, idx) => {
                                    let colorClass = 'bg-slate-300';
                                    if (apt.type === 'TREATMENT') colorClass = 'bg-purple-500 shadow-sm shadow-purple-200';
                                    else if (apt.type === 'EVALUATION') colorClass = 'bg-blue-500 shadow-sm shadow-blue-200';
                                    else if (apt.type === 'RETURN') colorClass = 'bg-green-500';
                                    else if (apt.type === 'URGENCY') colorClass = 'bg-red-500';

                                    return (
                                        <div
                                            key={idx}
                                            className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${colorClass}`}
                                            title={apt.type}
                                        />
                                    );
                                })}
                                {dayAppointments.length > 12 && (
                                    <span className="text-[9px] text-slate-400 font-bold">+</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
