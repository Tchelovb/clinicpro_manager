import React, { useState, useEffect } from 'react';
import { Search, Loader2, Filter, User } from 'lucide-react';
import { supabase } from '../../src/lib/supabase';
import { useDebounce } from '../../hooks/useDebounce';
import { cn } from '../../src/lib/utils';

interface PatientFinderProps {
    onSelect: (patient: any) => void;
}

export const PatientFinder: React.FC<PatientFinderProps> = ({ onSelect }) => {
    const [term, setTerm] = useState('');
    const debouncedTerm = useDebounce(term, 300);
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [recentPatients, setRecentPatients] = useState<any[]>([]);

    // 1. Load recent patients (simulate "cache" or last accessed)
    useEffect(() => {
        const fetchRecent = async () => {
            // In proper app, this comes from a 'last_viewed' table or local storage
            const { data } = await supabase.from('patients').select('id, name, cpf, phone').limit(5).order('created_at', { ascending: false });
            if (data) setRecentPatients(data);
        };
        fetchRecent();
    }, []);

    // 2. Search Logic
    useEffect(() => {
        const search = async () => {
            if (!debouncedTerm || debouncedTerm.length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            const { data } = await supabase
                .from('patients')
                .select('id, name, cpf, phone')
                .or(`name.ilike.%${debouncedTerm}%,cpf.ilike.%${debouncedTerm}%`)
                .limit(10);

            if (data) setResults(data);
            setLoading(false);
        };

        search();
    }, [debouncedTerm]);

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
                <input
                    type="text"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="Buscar Paciente (Nome, CPF)..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm font-medium transition-all"
                    autoFocus
                />
                {loading ? (
                    <Loader2 className="absolute right-3 top-3.5 text-blue-500 animate-spin" size={20} />
                ) : (
                    <div className="absolute right-2 top-2 bg-slate-100 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-500 flex items-center gap-1 cursor-pointer hover:bg-slate-200 transition-colors">
                        <Filter size={12} /> Filtros
                    </div>
                )}
            </div>

            <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                {term.length < 2 && recentPatients.length > 0 && (
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Recentes</h3>
                )}

                {(term.length >= 2 ? results : recentPatients).map(patient => (
                    <button
                        key={patient.id}
                        onClick={() => {
                            setTerm('');
                            onSelect(patient);
                        }}
                        className="w-full text-left p-3 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-200 group-hover:text-blue-600 transition-colors">
                                <User size={16} />
                            </div>
                            <div>
                                <p className="font-bold text-slate-700 group-hover:text-blue-700">{patient.name}</p>
                                <p className="text-xs text-slate-400 group-hover:text-blue-500">
                                    {patient.cpf || 'Sem CPF'}
                                </p>
                            </div>
                        </div>
                    </button>
                ))}

                {term.length >= 2 && results.length === 0 && !loading && (
                    <p className="text-center text-sm text-slate-400 py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        Nenhum paciente encontrado.
                    </p>
                )}
            </div>
        </div>
    );
};
