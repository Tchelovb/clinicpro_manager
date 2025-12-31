
import React, { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { useData } from '../../contexts/DataContext';
import { Check, Search, User, Phone, DollarSign } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface PatientSearchProps {
    onSelect: (patient: any) => void;
    onAddNew?: (name: string) => void;
    selectedId?: string;
    className?: string;
}

export const PatientSearch: React.FC<PatientSearchProps> = ({ onSelect, onAddNew, selectedId, className }) => {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("");
    const [search, setSearch] = useState("");
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { profile } = useAuth();
    const wrapperRef = React.useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (search.length >= 2) {
            setLoading(true);
            const fetchPatients = async () => {
                try {
                    const { data, error } = await supabase
                        .from('patients')
                        .select('id, name, phone, profile_photo_url')
                        .eq('clinic_id', profile?.clinic_id)
                        .ilike('name', `%${search}%`)
                        .limit(5); // Limit slightly to leave room for "Add New"

                    if (error) throw error;
                    setPatients(data || []);
                } catch (error) {
                    console.error("Error searching patients:", error);
                } finally {
                    setLoading(false);
                }
            };

            const debounce = setTimeout(fetchPatients, 300);
            return () => clearTimeout(debounce);
        } else {
            setPatients([]);
        }
    }, [search, profile?.clinic_id]);

    return (
        <div ref={wrapperRef} className={cn("relative w-full", className)}>
            <div className="relative border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 shadow-sm">
                <div className="flex items-center px-3 border-b border-slate-100 dark:border-slate-800">
                    <Search className="w-4 h-4 text-slate-400 mr-2" />
                    <input
                        className="flex-1 py-2.5 bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-900 dark:text-white scroll-mt-20"
                        placeholder="Buscar ou cadastrar..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setOpen(true);
                        }}
                        onFocus={() => {
                            setOpen(true);
                            if (search.length >= 2 && patients.length === 0 && !loading) {
                                // Trigger search again if needed or just show
                            }
                        }}
                    />
                </div>

                {open && search.length >= 2 && (
                    <div className="max-h-[180px] overflow-y-auto p-1 z-[100] absolute w-full bg-white dark:bg-slate-900 border border-t-0 border-slate-200 dark:border-slate-700 rounded-b-lg shadow-xl">
                        {loading ? (
                            <div className="p-3 text-xs text-center text-slate-400">Buscando...</div>
                        ) : (
                            <>
                                {patients.length > 0 ? (
                                    patients.map((patient) => (
                                        <div
                                            key={patient.id}
                                            className={cn(
                                                "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors text-sm",
                                                "hover:bg-slate-100 dark:hover:bg-slate-800",
                                                selectedId === patient.id && "bg-blue-50 dark:bg-blue-900/20"
                                            )}
                                            onClick={() => {
                                                onSelect(patient);
                                                setSearch(patient.name);
                                                setOpen(false);
                                            }}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                                                {patient.profile_photo_url ? (
                                                    <img src={patient.profile_photo_url} alt={patient.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-4 h-4 text-slate-500" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-900 dark:text-white truncate">{patient.name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                    <Phone className="w-3 h-3" /> {patient.phone || 'Sem telefone'}
                                                </p>
                                            </div>
                                            {selectedId === patient.id && (
                                                <Check className="w-4 h-4 text-blue-600" />
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-3 text-xs text-center text-slate-400">Nenhum paciente encontrado.</div>
                                )}

                                {/* Always show "Add New" option if searching */}
                                {onAddNew && (
                                    <div
                                        className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-800"
                                        onClick={() => {
                                            onAddNew(search);
                                            setOpen(false);
                                        }}
                                    >
                                        <div className="flex items-center gap-3 p-2 rounded-md cursor-pointer text-sm hover:bg-violet-50 dark:hover:bg-violet-900/20 text-violet-600 dark:text-violet-400 font-medium transition-colors">
                                            <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                                                <span className="text-lg leading-none">+</span>
                                            </div>
                                            <span>Cadastrar "{search}"</span>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
