import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PatientDetailSheet } from '../components/PatientDetail';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import toast from 'react-hot-toast';
import {
    Users,
    Search,
    Plus,
    Crown,
    Star,
    AlertCircle,
    Phone,
    X,
    Filter,
    ShieldCheck,
    Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '../components/ui/dialog';
import { PatientQuickActions } from '../components/patients/PatientQuickActions';

// Definindo a interface Patient de forma robusta
interface Patient {
    id: string;
    name: string;
    phone: string;
    email?: string;
    cpf?: string;
    occupation?: string;
    instagram_handle?: string;
    patient_score: 'DIAMOND' | 'GOLD' | 'STANDARD' | 'RISK' | 'BLACKLIST';
    bad_debtor: boolean;
    balance_due: number;
    total_approved: number;
    status: string;
    profile_photo_url?: string;
    created_at: string;
}

const PatientsList: React.FC = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();

    // Data States
    const [patients, setPatients] = useState<Patient[]>([]);
    const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true); // FIX: Start loading as true to avoid "empty" flash

    // Filter & Search
    const [searchTerm, setSearchTerm] = useState('');
    const [filterScore, setFilterScore] = useState<string>('ALL');
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

    // Unified Sheet State (The Fix for Flashing)
    const [sheetState, setSheetState] = useState<{
        open: boolean;
        mode: 'view' | 'create' | 'edit';
        patientId?: string;
        initialData?: any;
    }>({
        open: false,
        mode: 'view'
    });

    const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

    // Search Status State (As requested)
    const [isSearching, setIsSearching] = useState(false);
    const hasResults = filteredPatients.length > 0;

    // Sync isSearching with debounce status
    useEffect(() => {
        // isSearching is true if searchTerm has changed but debouncedSearchTerm hasn't caught up yet
        // OR if a search is actively loading data from the backend.
        setIsSearching(searchTerm !== debouncedSearchTerm || loading);
    }, [searchTerm, debouncedSearchTerm, loading]);

    // Update isSearching when typing starts immediately
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        if (e.target.value !== debouncedSearchTerm) {
            setIsSearching(true);
        }
    };

    useEffect(() => {
        if (!profile?.clinic_id) return;

        // If user clears search, go back to recent
        if (debouncedSearchTerm.trim() === '') {
            fetchRecentPatients();
        } else {
            searchPatients(debouncedSearchTerm);
        }
    }, [debouncedSearchTerm, profile?.clinic_id]);

    const fetchRecentPatients = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .eq('clinic_id', profile?.clinic_id)
                .order('created_at', { ascending: false })
                .limit(10);
            if (error) throw error;
            setPatients(data || []);
            setFilteredPatients(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const searchPatients = async (term: string) => {
        try {
            setLoading(true); // Indicate that data fetching is in progress
            const cleanTerm = term.trim().toLowerCase();
            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .eq('clinic_id', profile?.clinic_id)
                .or(`name.ilike.%${cleanTerm}%,phone.ilike.%${cleanTerm}%,cpf.ilike.%${cleanTerm}%,email.ilike.%${cleanTerm}%`)
                .order('name', { ascending: true })
                .limit(50);
            if (error) throw error;
            setPatients(data || []);
            setFilteredPatients(data || []);
        } catch (error) {
            toast.error('Erro na busca');
        } finally {
            setLoading(false); // Indicate that data fetching has completed
        }
    };

    const applyFilters = () => {
        let filtered = [...patients];
        if (filterScore !== 'ALL') {
            filtered = filtered.filter(p => p.patient_score === filterScore);
        }
        if (filterStatus !== 'ALL') {
            if (filterStatus === 'DEBTOR') {
                filtered = filtered.filter(p => p.bad_debtor);
            } else {
                filtered = filtered.filter(p => p.status === filterStatus);
            }
        }
        setFilteredPatients(filtered);
    };

    useEffect(() => applyFilters(), [filterScore, filterStatus, patients]);


    // Actions
    const openDetailSheet = (id: string) => {
        setSheetState({
            open: true,
            mode: 'view',
            patientId: id
        });
    };

    const handleNewPatientClick = () => {
        setSheetState({
            open: true,
            mode: 'create',
            initialData: { name: searchTerm }
        });
    };

    // Helper for Scores (omitted for brevity, assume keeping)
    const getScoreConfig = (score: string) => {
        switch (score) {
            case 'DIAMOND': return { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-800', icon: Crown, label: 'Diamond', cardBorder: 'border-l-4 border-l-purple-500 shadow-purple-100 dark:shadow-none' };
            case 'GOLD': return { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-800', icon: Star, label: 'Gold', cardBorder: 'border-l-4 border-l-amber-500 shadow-amber-100 dark:shadow-none' };
            case 'RISK': return { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-300 dark:border-rose-800', icon: AlertCircle, label: 'Risco', cardBorder: 'border-l-4 border-l-rose-500 shadow-rose-100 dark:shadow-none' };
            case 'BLACKLIST': return { bg: 'bg-slate-900 dark:bg-black', text: 'text-white', border: 'border-slate-700', icon: AlertCircle, label: 'Blacklist', cardBorder: 'border-l-4 border-l-slate-900 shadow-slate-200 dark:shadow-none' };
            default: return { bg: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-600', icon: Users, label: 'Standard', cardBorder: 'border-l-4 border-l-slate-300 dark:border-l-slate-600' };
        }
    };

    // Helper render function
    const renderPatientList = () => {
        if (viewMode === 'grid') {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPatients.map(patient => {
                        const config = getScoreConfig(patient.patient_score);
                        const Icon = config.icon;
                        return (
                            <div
                                key={patient.id}
                                onClick={() => openDetailSheet(patient.id)}
                                className={cn(
                                    "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all cursor-pointer group overflow-hidden",
                                    config.cardBorder
                                )}
                            >
                                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {patient.profile_photo_url ? (
                                            <img src={patient.profile_photo_url} alt={patient.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="font-bold text-slate-500 dark:text-slate-400 text-lg">
                                                {patient.name.substring(0, 2).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-slate-800 dark:text-white truncate group-hover:text-violet-600 transition-colors">{patient.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border", config.bg, config.text, config.border)}>
                                                <Icon size={12} /> {config.label}
                                            </span>
                                            {patient.bad_debtor && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                    <AlertCircle size={12} /> Inadimplente
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <Phone size={14} /> {patient.phone}
                                    </div>
                                    <div className="pt-2 flex justify-between text-xs border-t border-slate-100 dark:border-slate-700 mt-2">
                                        <span className="text-slate-500">Total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(patient.total_approved)}</span>
                                        {patient.balance_due > 0 && <span className="text-rose-600 font-bold">Deve: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(patient.balance_due)}</span>}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            );
        } else {
            return (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-4 py-3">Paciente</th>
                                <th className="px-4 py-3">Contatos</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3 text-right">Financeiro</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredPatients.map(patient => (
                                <tr key={patient.id} onClick={() => openDetailSheet(patient.id)} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                                {patient.profile_photo_url ? <img src={patient.profile_photo_url} className="w-full h-full rounded-full object-cover" /> : patient.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-white">{patient.name}</p>
                                                {patient.occupation && <p className="text-[10px] text-slate-500">{patient.occupation}</p>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-2"><Phone size={12} /> {patient.phone}</div>
                                            {patient.email && <div className="text-xs opacity-70">{patient.email}</div>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                                            {patient.patient_score}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {patient.balance_due > 0 && <span className="text-rose-600 font-bold text-xs bg-rose-50 px-2 py-1 rounded-full">Devendo</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }
    };

    return (
        <div className="flex flex-col min-h-screen relative pb-10 bg-slate-50 dark:bg-slate-900/50">
            {/* Unified Sheet */}
            <PatientDetailSheet
                key={sheetState.patientId}
                open={sheetState.open}
                onClose={() => setSheetState(prev => ({ ...prev, open: false }))}
                mode={sheetState.mode}
                patientId={sheetState.patientId}
                initialData={sheetState.initialData}
                onSuccess={(newId) => {
                    // Smart Entry Logic
                    setSearchTerm('');
                    fetchRecentPatients();

                    if (newId) {
                        // Seamless switch to view mode without closing
                        setSheetState({
                            open: true,
                            mode: 'view',
                            patientId: newId
                        });
                    } else {
                        // Just success feedback or close?
                        // If plain update without ID transition, maybe keep open? 
                        // For now assume if no ID (just edit), keep open. 
                        // If Create, we usually get ID. 
                    }
                }}
            />




            {/* ========================================================================= */}
            {/* PERSISTENT HEADER (AGILE DASHBOARD)                                       */}
            {/* ========================================================================= */}
            <div className="sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 shadow-sm z-30">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">

                    {/* 1. TITLE & COUNT */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="p-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                            <Users className="text-teal-600 dark:text-teal-400" size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Pacientes</h1>
                            <p className="text-xs text-slate-500">
                                {loading ? 'Carregando...' : `${filteredPatients.length} ${searchTerm ? 'encontrados' : 'recentes'}`}
                            </p>
                        </div>
                    </div>

                    {/* 2. SEARCH & ACTIONS */}
                    <div className="flex flex-1 w-full md:w-auto items-center gap-3 justify-end">

                        {/* Search Bar */}
                        <div className="relative flex-1 max-w-xl">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar paciente..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-10 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all shadow-sm"
                            />
                            {/* Loading/Clear Icons */}
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                {(loading || isSearching) ? (
                                    <Loader2 className="text-violet-600 animate-spin" size={16} />
                                ) : searchTerm ? (
                                    <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600">
                                        <X size={16} />
                                    </button>
                                ) : null}
                            </div>
                        </div>

                        {/* Patient Quick Actions (Dual Button) */}
                        <PatientQuickActions
                            onOpenFullRegistration={handleNewPatientClick}
                            onSuccess={() => {
                                setSearchTerm('');
                                fetchRecentPatients();
                            }}
                        />

                        {/* View Toggles */}
                        <div className="hidden md:flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-4 ml-2">
                            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                <button onClick={() => setViewMode('grid')} className={cn("p-1.5 rounded-md transition-all", viewMode === 'grid' ? "bg-white dark:bg-slate-700 shadow-sm text-violet-600" : "text-slate-400")}>
                                    <Users size={16} />
                                </button>
                                <button onClick={() => setViewMode('list')} className={cn("p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-white dark:bg-slate-700 shadow-sm text-violet-600" : "text-slate-400")}>
                                    <Filter size={16} className="rotate-90" />
                                </button>
                            </div>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={cn("p-2 rounded-lg border transition-all", showFilters ? "bg-violet-50 border-violet-200 text-violet-600" : "bg-white border-slate-200 text-slate-500")}
                            >
                                <Filter size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filters Panel Expandable */}
                {showFilters && (
                    <div className="max-w-7xl mx-auto mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Classificação</label>
                            <select value={filterScore} onChange={e => setFilterScore(e.target.value)} className="w-full mt-1 p-2 border rounded-lg bg-white dark:bg-slate-800 text-sm">
                                <option value="ALL">Todos</option>
                                <option value="DIAMOND">💎 Diamond</option>
                                <option value="GOLD">⭐ Gold</option>
                                <option value="STANDARD">👤 Standard</option>
                                <option value="RISK">⚠️ Risco</option>
                                <option value="BLACKLIST">🚫 Blacklist</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full mt-1 p-2 border rounded-lg bg-white dark:bg-slate-800 text-sm">
                                <option value="ALL">Todos</option>
                                <option value="Em Tratamento">Em Tratamento</option>
                                <option value="Finalizado">Finalizado</option>
                                <option value="DEBTOR">Inadimplentes</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* ========================================================================= */}
            {/* CONTENT AREA                                                              */}
            {/* ========================================================================= */}
            {/* ========================================================================= */}
            {/* CONTENT AREA                                                              */}
            {/* ========================================================================= */}
            <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6">

                {(() => {
                    // 1. No Search (or whitespace only) -> Show Recent/Filtered
                    if (!searchTerm.trim()) {
                        return (
                            <div className="animate-in fade-in duration-500">
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                                        {filterScore !== 'ALL' || filterStatus !== 'ALL' ? 'Pacientes Filtrados' : 'Acessados Recentemente'}
                                    </h2>
                                </div>

                                {loading && !hasResults ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {[1, 2, 3, 4, 5, 6].map(i => (
                                            <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
                                        ))}
                                    </div>
                                ) : (
                                    renderPatientList()
                                )}
                            </div>
                        );
                    }

                    // 2. Searching AND Loading -> Show Loader
                    // (Strict Check: if typing or fetching)
                    if (loading || isSearching) {
                        return (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400 animate-pulse">
                                <Loader2 size={40} className="animate-spin mb-4 text-violet-500" />
                                <p>Buscando pacientes...</p>
                            </div>
                        );
                    }

                    // 3. Searching AND No Results -> Show Empty State
                    if (!hasResults) {
                        return (
                            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                    <Search className="text-slate-400" size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Nenhum resultado encontrado</h3>
                                <p className="text-slate-500 max-w-sm mx-auto">
                                    Não encontramos registros para "<strong>{searchTerm}</strong>".
                                </p>
                                {/* Botão removido para evitar redundância com o header */}
                            </div>
                        );
                    }

                    // 4. Searching AND Has Results -> Show Results
                    return (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="mb-4">
                                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                                    Resultados para "{searchTerm}"
                                </h2>
                            </div>
                            {renderPatientList()}
                        </div>
                    );
                })()}
            </div>
        </div >
    );
};

export default PatientsList;
