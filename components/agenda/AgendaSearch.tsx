import React, { useState, useEffect } from 'react';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '../../components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '../../components/ui/popover';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Search, User, Clock } from 'lucide-react';

interface AgendaSearchProps {
    onSelectDate: (date: Date) => void;
    onSelectAppointment: (id: string) => void;
}

export const AgendaSearch: React.FC<AgendaSearchProps> = ({ onSelectDate, onSelectAppointment }) => {
    const { profile } = useAuth();
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (query.length < 3) {
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
            // First search patients
            const { data: patients } = await supabase
                .from('patients')
                .select('id')
                .ilike('name', `%${query}%`)
                .eq('clinic_id', profile.clinic_id)
                .limit(5);

            const patientIds = patients?.map(p => p.id) || [];

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
                .limit(10);

            if (patientIds.length > 0) {
                apptQuery = apptQuery.in('patient_id', patientIds);
            } else {
                setResults([]);
                setLoading(false);
                return;
            }

            const { data: appts } = await apptQuery;

            setResults(appts || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                        className="flex h-9 w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-800 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300 pl-9"
                        placeholder="Buscar agendamento..."
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setOpen(true);
                        }}
                        onFocus={() => setOpen(true)}
                    />
                </div>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[300px] md:w-[400px]" align="start">
                <Command>
                    <CommandList>
                        {loading && (
                            <div className="py-6 text-center text-sm text-slate-500">
                                Buscando...
                            </div>
                        )}
                        {!loading && results.length === 0 && (
                            <div className="py-6 text-center text-sm text-slate-500">
                                {query.length < 3 ? 'Digite 3 letras para buscar...' : 'Nenhum resultado.'}
                            </div>
                        )}
                        {results.length > 0 && (
                            <CommandGroup heading="Resultados">
                                {results.map((apt) => (
                                    <CommandItem
                                        key={apt.id}
                                        onSelect={() => {
                                            onSelectDate(parseISO(apt.date));
                                            onSelectAppointment(apt.id);
                                            setOpen(false);
                                            setQuery('');
                                        }}
                                        className="gap-3 cursor-pointer"
                                    >
                                        <div className={`p-2 rounded-full ${apt.type === 'TREATMENT' ? 'bg-purple-100 text-purple-600' :
                                                apt.type === 'EVALUATION' ? 'bg-blue-100 text-blue-600' :
                                                    'bg-slate-100 text-slate-600'
                                            }`}>
                                            {apt.type === 'TREATMENT' ? <User size={16} /> : <Calendar size={16} />}
                                        </div>
                                        <div className="flex-1 flex flex-col">
                                            <span className="font-medium">{apt.patients?.name || 'Sem nome'}</span>
                                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                                <Clock size={12} />
                                                {format(parseISO(apt.date), "dd/MM HH:mm", { locale: ptBR })}
                                                {' • '}
                                                {apt.users?.name}
                                            </span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};
