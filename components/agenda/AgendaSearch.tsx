import { cn } from '../../lib/utils';
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Search, User, Clock } from 'lucide-react';

interface AgendaSearchProps {
    onSelectDate: (date: Date) => void;
    onSelectAppointment: (id: string) => void;
    className?: string;
    placeholder?: string;
}

// Custom hook for clicking outside
function useOnClickOutside(ref: React.RefObject<HTMLDivElement>, handler: () => void) {
    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            if (!ref.current || ref.current.contains(event.target as Node)) {
                return;
            }
            handler();
        };
        document.addEventListener("mousedown", listener);
        document.addEventListener("touchstart", listener);
        return () => {
            document.removeEventListener("mousedown", listener);
            document.removeEventListener("touchstart", listener);
        };
    }, [ref, handler]);
}

export const AgendaSearch: React.FC<AgendaSearchProps> = ({ onSelectDate, onSelectAppointment, className, placeholder }) => {
    const { profile } = useAuth();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    useOnClickOutside(containerRef, () => setOpen(false));

    useEffect(() => {
        if (query.length < 2) {
            setResults([]);
            return;
        }

        const h = setTimeout(async () => {
            await searchAppointments();
        }, 300);

        return () => clearTimeout(h);
    }, [query]);

    const searchAppointments = async () => {
        if (!profile?.clinic_id) return;
        setLoading(true);

        try {
            // Flexible Search: by Patient Name or Date
            let apptQuery = supabase
                .from('appointments')
                .select(`
                    id,
                    date,
                    status,
                    type,
                    patients!appointments_patient_id_fkey(name),
                    users!appointments_doctor_id_fkey(name)
                `)
                .eq('clinic_id', profile.clinic_id)
                .order('date', { ascending: false })
                .limit(15);

            // Filter logic
            // We'll filter by patient name match
            // Since Supabase join filtering is tricky, we can search patients first or use a join filter syntax if setup.
            // Simplified approach: Search patients, get IDs, then appointments.

            const { data: patients } = await supabase
                .from('patients')
                .select('id')
                .ilike('name', `%${query}%`)
                .eq('clinic_id', profile.clinic_id)
                .limit(10);

            const pIds = patients?.map(p => p.id) || [];

            if (pIds.length > 0) {
                apptQuery = apptQuery.in('patient_id', pIds);
                const { data: appts } = await apptQuery;
                setResults(appts || []);
            } else {
                setResults([]);
            }

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div ref={containerRef} className={cn("relative w-full", className)}>
            {/* Input Wrapper - No PopoverTrigger */}
            <input
                className="w-full h-full bg-transparent border-none text-base outline-none placeholder:text-slate-400 text-slate-900 dark:text-white"
                placeholder={placeholder || "Buscar..."}
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    if (e.target.value.length > 0) setOpen(true);
                }}
                onFocus={() => {
                    if (query.length > 0) setOpen(true);
                }}
            />

            {/* Results Dropdown - Absolute & Floating */}
            {open && (query.length > 1) && (
                <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-800 p-2 max-h-[350px] overflow-y-auto no-scrollbar z-[100] animate-in fade-in zoom-in-95 duration-200">

                    {loading && (
                        <div className="py-8 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                            Buscando...
                        </div>
                    )}

                    {!loading && results.length === 0 && (
                        <div className="py-8 text-center text-slate-400 text-sm">
                            Nenhum agendamento encontrado para "{query}"
                        </div>
                    )}

                    {!loading && results.map((apt) => (
                        <button
                            key={apt.id}
                            onClick={() => {
                                onSelectDate(parseISO(apt.date));
                                onSelectAppointment(apt.id);
                                setOpen(false);
                                setQuery(''); // Clear search to avoid overlay
                            }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors group text-left"
                        >
                            <div className={`p-2 rounded-full shrink-0 ${apt.type === 'TREATMENT' ? 'bg-purple-100 text-purple-600' :
                                apt.type === 'EVALUATION' ? 'bg-blue-100 text-blue-600' :
                                    'bg-slate-100 text-slate-500'
                                }`}>
                                {apt.type === 'TREATMENT' ? <User size={16} /> : <Calendar size={16} />}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white truncate">
                                    {apt.patients?.name || 'Sem Nome'}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    <Clock size={12} />
                                    <span>{format(parseISO(apt.date), "dd 'de' MMM, HH:mm", { locale: ptBR })}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                    <span className="truncate">{apt.users?.name}</span>
                                </div>
                            </div>

                            <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${apt.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                                apt.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-slate-100 text-slate-600'
                                }`}>
                                {apt.status === 'PENDING' ? 'Pendente' : apt.status === 'CONFIRMED' ? 'Confirmado' : apt.status}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
