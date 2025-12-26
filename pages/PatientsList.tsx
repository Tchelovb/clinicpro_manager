import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { NewPatientSheet } from '../components/patients/NewPatientSheet';
import { PatientDetailSheet } from '../components/patients/PatientDetailSheet';
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
    Instagram,
    Briefcase,
    DollarSign,
    TrendingUp,
    Filter,
    X,
    ChevronRight,
    ShieldCheck,
    CheckCircle,
    AlertTriangle,
    Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';

// Definindo a interface Patient de forma robusta
interface Patient {
    id: string;
    name: string;
    phone: string;
    email?: string;
    cpf?: string; // Added CPF support
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

    // Core Data States
    const [patients, setPatients] = useState<Patient[]>([]);
    const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(false);

    // Filter & Search States
    const [searchTerm, setSearchTerm] = useState('');
    const [filterScore, setFilterScore] = useState<string>('ALL');
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

    // Debounce for Query (300ms)
    const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

    // Sheet States
    const [showNewPatientSheet, setShowNewPatientSheet] = useState(false);
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [showDetailSheet, setShowDetailSheet] = useState(false);

    // =========================================================================
    // PROTOCOLO HOLOFOTE 2.0 - Computed States
    // =========================================================================
    // Hero Mode: No search term. Centralized layout.
    const isHero = searchTerm.length === 0;

    // Search Status
    const isTyping = searchTerm.length > 0;
    const isSearching = searchTerm !== debouncedSearchTerm; // Visual feedback for debounce gap
    const hasResults = filteredPatients.length > 0;
    const isSearchSafe = !hasResults && !loading && !isSearching && searchTerm.length >= 3;

    // =========================================================================
    // POWER SEARCH - Supabase Integration
    // =========================================================================
    useEffect(() => {
        // Query trigger only when debounce changes
        if (debouncedSearchTerm.length > 2) {
            searchPatients(debouncedSearchTerm);
        } else if (debouncedSearchTerm.length === 0) {
            // Clear results on empty
            setPatients([]);
            setFilteredPatients([]);
        }
    }, [debouncedSearchTerm, profile?.clinic_id]);

    const searchPatients = async (term: string) => {
        try {
            setLoading(true);
            if (!profile?.clinic_id) return;

            console.log('Searching patients (Power Search):', term);
            const cleanTerm = term.trim().toLowerCase();

            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .eq('clinic_id', profile.clinic_id)
                // Power Search: Name OR Phone OR CPF OR Email
                .or(`name.ilike.%${cleanTerm}%,phone.ilike.%${cleanTerm}%,cpf.ilike.%${cleanTerm}%,email.ilike.%${cleanTerm}%`)
                .order('name', { ascending: true })
                .limit(50);

            if (error) throw error;

            setPatients(data || []);
            setFilteredPatients(data || []); // Sync filtered
        } catch (error) {
            console.error('Search error:', error);
            toast.error('Erro ao buscar pacientes');
        } finally {
            setLoading(false);
        }
    };

    // Client-side Filters (Score/Status)
    useEffect(() => {
        applyFilters();
    }, [filterScore, filterStatus, patients]);

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

    // =========================================================================
    // ACTIONS
    // =========================================================================
    const openDetailSheet = (id: string) => {
        setSelectedPatientId(id);
        setShowDetailSheet(true);
    };

    const handleSmartButtonClick = () => {
        if (isSearchSafe) {
            // Safe: Open Create Sheet directly
            setShowNewPatientSheet(true);
        } else if (hasResults) {
            // Risky: Warn user
            toast((t) => (
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <p className="font-bold text-slate-800">Verifique a duplicidade!</p>
                        <p className="text-sm text-slate-600">O paciente parece já existir na lista.</p>
                        <div className="mt-2 flex gap-2">
                            <button
                                onClick={() => { toast.dismiss(t.id); setShowNewPatientSheet(true) }}
                                className="px-3 py-1 bg-amber-500 text-white text-xs rounded-md font-bold"
                            >
                                Cadastrar Mesmo Assim
                            </button>
                            <button
                                onClick={() => toast.dismiss(t.id)}
                                className="px-3 py-1 bg-slate-200 text-slate-700 text-xs rounded-md font-bold"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            ), { duration: 5000 });
        } else {
            // Neutral/Short (Should be disabled, but if clicked)
            toast('Digite pelo menos 3 caracteres para verificar.');
        }
    };

    // Helper for Scores
    const getScoreConfig = (score: string) => {
        // ... (Keep existing Score Logic intact)
        switch (score) {
            case 'DIAMOND': return { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-800', icon: Crown, label: 'Diamond', cardBorder: 'border-l-4 border-l-purple-500 shadow-purple-100 dark:shadow-none' };
            case 'GOLD': return { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-800', icon: Star, label: 'Gold', cardBorder: 'border-l-4 border-l-amber-500 shadow-amber-100 dark:shadow-none' };
            case 'RISK': return { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-300 dark:border-rose-800', icon: AlertCircle, label: 'Risco', cardBorder: 'border-l-4 border-l-rose-500 shadow-rose-100 dark:shadow-none' };
            case 'BLACKLIST': return { bg: 'bg-slate-900 dark:bg-black', text: 'text-white', border: 'border-slate-700', icon: AlertCircle, label: 'Blacklist', cardBorder: 'border-l-4 border-l-slate-900 shadow-slate-200 dark:shadow-none' };
            default: return { bg: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-600', icon: Users, label: 'Standard', cardBorder: 'border-l-4 border-l-slate-300 dark:border-l-slate-600' };
        }
    };

    return (
        <div className="flex flex-col min-h-screen relative pb-10">
            {/* Sheets */}
            <PatientDetailSheet
                patientId={selectedPatientId}
                open={showDetailSheet}
                onOpenChange={setShowDetailSheet}
            />
            <NewPatientSheet
                open={showNewPatientSheet}
                onOpenChange={setShowNewPatientSheet}
                onSuccess={() => toast.success('Paciente cadastrado!')}
            />

            {/* ========================================================================= */}
            {/* UNIFIED SEARCH HEADER (HOLOFOTE 2.0)                                      */}
            {/* ========================================================================= */}
            <div className={cn(
                "transition-all duration-500 ease-in-out z-30 flex flex-col items-center",
                isHero
                    ? "min-h-[60vh] justify-center p-8 bg-transparent"
                    : "sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4 shadow-sm"
            )}>
                <div className={cn(
                    "w-full transition-all duration-500",
                    isHero
                        ? "max-w-2xl flex flex-col gap-6"
                        : "max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between"
                )}>
                    {/* 1. HERO TITLE (Only visible in Hero Mode) */}
                    <div className={cn("text-center space-y-2 transition-all duration-300", isHero ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 hidden")}>
                        <h1 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                            Gestão de Clientes
                        </h1>
                        <p className="text-lg text-slate-500 dark:text-slate-400">
                            Busque por Nome, Telefone, CPF ou Email
                        </p>
                    </div>

                    {/* 2. HEADER TITLE (Only visible in Top Mode) */}
                    <div className={cn("flex items-center gap-3 transition-opacity duration-300", !isHero ? "opacity-100" : "opacity-0 hidden w-0")}>
                        <div className="p-2 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                            <Users className="text-teal-600 dark:text-teal-400" size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Pacientes</h1>
                            <p className="text-xs text-slate-500">{filteredPatients.length} encontrados</p>
                        </div>
                    </div>

                    {/* 3. SEARCH BAR (THE ANCHOR) */}
                    <div className={cn("relative transition-all duration-500", isHero ? "w-full" : "flex-1 max-w-xl")}>
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={isHero ? 24 : 20} />
                        <input
                            type="text"
                            placeholder={isHero ? "🔍 Digite para buscar..." : "Buscar paciente..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            // No autoFocus to prevent mobile keyboard jump, or yes?
                            // Keep focus stable.
                            className={cn(
                                "w-full transition-all duration-300 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-violet-500/20 focus:border-violet-500",
                                isHero
                                    ? "pl-14 pr-4 py-5 text-xl rounded-2xl border-2 shadow-lg"
                                    : "pl-10 pr-10 py-2.5 text-base rounded-lg border shadow-sm"
                            )}
                        />
                        {/* Loading/Clear Icons */}
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            {(loading || isSearching) ? (
                                <Loader2 className="text-violet-600 animate-spin" size={20} />
                            ) : searchTerm ? (
                                <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600">
                                    <X size={20} />
                                </button>
                            ) : null}
                        </div>
                    </div>

                    {/* 4. SMART BUTTON (Protocolo Anti-Duplicidade) */}
                    {/* In Hero mode, show below input. In Top mode, show right. */}
                    {/* Actually, unified flow: Button logic is complex. */}
                    {/* To adhere to "Unified Layout" requests, it's easier to conditional render position 
                        but effectively it's the same component logic. */}

                    <div className={cn("transition-all duration-300",
                        isHero ? "w-full max-w-md mx-auto mt-4 opacity-50 pointer-events-none grayscale" : "w-full md:w-auto"
                    )}>
                        <button
                            onClick={handleSmartButtonClick}
                            disabled={!isTyping && !hasResults} // Disabled if empty
                            className={cn(
                                "w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 md:px-4 md:py-2.5 rounded-lg transition-all font-bold shadow-md active:scale-[0.98]",
                                // Dynamic Colors
                                isSearchSafe
                                    ? "bg-emerald-600 text-white hover:bg-emerald-700 ring-2 ring-emerald-500/50" // Green (Free)
                                    : hasResults
                                        ? "bg-amber-500 text-white hover:bg-amber-600 ring-2 ring-amber-500/50" // Yellow (Risk)
                                        : "bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800" // Neutral
                            )}
                        >
                            {isSearchSafe ? (
                                <>
                                    <CheckCircle size={18} />
                                    Cadastrar Novo Paciente
                                </>
                            ) : hasResults ? (
                                <>
                                    <ShieldCheck size={18} />
                                    Verifique Duplicidade ({filteredPatients.length})
                                </>
                            ) : (
                                <>
                                    <Plus size={18} />
                                    Novo Paciente
                                </>
                            )}
                        </button>
                    </div>

                    {/* 5. VIEW TOGGLES (Only Top Mode) */}
                    {!isHero && (
                        <div className="hidden md:flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-4">
                            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                <button onClick={() => setViewMode('grid')} className={cn("p-2 rounded-md transition-all", viewMode === 'grid' ? "bg-white dark:bg-slate-700 shadow-sm text-violet-600" : "text-slate-400")}>
                                    <Users size={18} />
                                </button>
                                <button onClick={() => setViewMode('list')} className={cn("p-2 rounded-md transition-all", viewMode === 'list' ? "bg-white dark:bg-slate-700 shadow-sm text-violet-600" : "text-slate-400")}>
                                    <Filter size={18} className="rotate-90" />
                                </button>
                            </div>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={cn("p-2.5 rounded-lg border transition-all", showFilters ? "bg-violet-50 border-violet-200 text-violet-600" : "bg-white border-slate-200 text-slate-500")}
                            >
                                <Filter size={18} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Filters Panel Expandable */}
                {showFilters && !isHero && (
                    <div className="w-full max-w-7xl mx-auto mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Classificação</label>
                            <select value={filterScore} onChange={e => setFilterScore(e.target.value)} className="w-full mt-1 p-2 border rounded-lg bg-white dark:bg-slate-800">
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
                            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full mt-1 p-2 border rounded-lg bg-white dark:bg-slate-800">
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
            <div className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6">
                {!isHero && (
                    <>
                        {loading && !hasResults ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400 animate-pulse">
                                <Loader2 size={40} className="animate-spin mb-4 text-violet-500" />
                                <p>Buscando na base de dados...</p>
                            </div>
                        ) : hasResults ? (
                            // Existing List/Grid Logic
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {viewMode === 'grid' ? (
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
                                ) : (
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
                                                                {patient.cpf && <div className="text-[10px] opacity-50">CPF: {patient.cpf}</div>}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            {/* Simple Status Pills */}
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
                                )}
                            </div>
                        ) : (
                            // Empty Search Result State (But not Hero)
                            // Means we searched but found nothing (Top mode -> 0 results)
                            // This confirms "Green Light" for New Patient
                            <div className="text-center py-20 animate-in fade-in zoom-in">
                                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={40} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Nenhum paciente encontrado</h3>
                                <p className="text-slate-500 max-w-sm mx-auto mb-8">
                                    Não encontramos registros para "<strong>{searchTerm}</strong>".
                                    Seu caminho está livre para cadastrar um novo paciente.
                                </p>
                                {/* This redundancy button is optional, as the main button is Green now */}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default PatientsList;
