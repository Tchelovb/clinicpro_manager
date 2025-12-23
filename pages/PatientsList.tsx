import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
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
    ChevronRight
} from 'lucide-react';

interface Patient {
    id: string;
    name: string;
    phone: string;
    email?: string;
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
    const [patients, setPatients] = useState<Patient[]>([]);
    const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterScore, setFilterScore] = useState<string>('ALL');
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [showFilters, setShowFilters] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        if (profile?.clinic_id) {
            loadPatients();
        }
    }, [profile?.clinic_id]);

    useEffect(() => {
        applyFilters();
    }, [searchTerm, filterScore, filterStatus, patients]);

    const loadPatients = async () => {
        try {
            setLoading(true);

            if (!profile?.clinic_id) {
                console.warn('LoadPatients: Clinic ID not found in profile', profile);
                setLoading(false);
                return;
            }

            console.log('LoadPatients: Fetching for clinic', profile.clinic_id);

            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .eq('clinic_id', profile.clinic_id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Supabase Error loading patients:', error);
                throw error;
            }

            console.log('Patients loaded:', data?.length);
            setPatients(data || []);
        } catch (error) {
            console.error('Erro ao carregar pacientes:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...patients];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(term) ||
                p.phone.includes(term)
            );
        }

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

    // Score Configuration (High-Ticket Visual Rules)
    const getScoreConfig = (score: string) => {
        switch (score) {
            case 'DIAMOND':
                return {
                    bg: 'bg-purple-50 dark:bg-purple-900/20',
                    text: 'text-purple-700 dark:text-purple-300',
                    border: 'border-purple-300 dark:border-purple-800',
                    icon: Crown,
                    label: 'Diamond',
                    cardBorder: 'border-l-4 border-l-purple-500 shadow-purple-100 dark:shadow-none'
                };
            case 'GOLD':
                return {
                    bg: 'bg-amber-50 dark:bg-amber-900/20',
                    text: 'text-amber-700 dark:text-amber-300',
                    border: 'border-amber-300 dark:border-amber-800',
                    icon: Star,
                    label: 'Gold',
                    cardBorder: 'border-l-4 border-l-amber-500 shadow-amber-100 dark:shadow-none'
                };
            case 'RISK':
                return {
                    bg: 'bg-rose-50 dark:bg-rose-900/20',
                    text: 'text-rose-700 dark:text-rose-300',
                    border: 'border-rose-300 dark:border-rose-800',
                    icon: AlertCircle,
                    label: 'Risco',
                    cardBorder: 'border-l-4 border-l-rose-500 shadow-rose-100 dark:shadow-none'
                };
            case 'BLACKLIST':
                return {
                    bg: 'bg-slate-900 dark:bg-black',
                    text: 'text-white',
                    border: 'border-slate-700',
                    icon: AlertCircle,
                    label: 'Blacklist',
                    cardBorder: 'border-l-4 border-l-slate-900 shadow-slate-200 dark:shadow-none'
                };
            default: // STANDARD
                return {
                    bg: 'bg-slate-50 dark:bg-slate-800',
                    text: 'text-slate-600 dark:text-slate-400',
                    border: 'border-slate-200 dark:border-slate-600',
                    icon: Users,
                    label: 'Standard',
                    cardBorder: 'border-l-4 border-l-slate-300 dark:border-l-slate-600'
                };
        }
    };

    // Loading State
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] animate-pulse">
                <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Carregando pacientes...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ============================================ */}
            {/* HEADER & ACTIONS */}
            {/* ============================================ */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                        <Users className="text-teal-600 dark:text-teal-400" size={32} />
                        Pacientes
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        {filteredPatients.length} {filteredPatients.length === 1 ? 'paciente encontrado' : 'pacientes encontrados'}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/patients/new')}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 md:px-4 md:py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium shadow-sm active:scale-[0.98]"
                >
                    <Plus size={18} />
                    Novo Paciente
                </button>
            </div>

            {/* ============================================ */}
            {/* SEARCH & FILTERS */}
            {/* ============================================ */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 transition-colors">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search Bar */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou telefone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 md:py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-base"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-2"
                            >
                                <X size={18} />
                            </button>
                        )}
                    </div>

                    {/* View Toggles & Filters */}
                    <div className="flex gap-2">
                        <div className="flex p-1 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 flex-shrink-0 hidden md:flex">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'grid'
                                    ? 'bg-white dark:bg-slate-600 text-violet-600 dark:text-violet-400 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                title="Visualização em Grade"
                            >
                                <Users size={20} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'list'
                                    ? 'bg-white dark:bg-slate-600 text-violet-600 dark:text-violet-400 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                title="Visualização em Lista"
                            >
                                <Filter size={20} className="rotate-90" />
                            </button>
                        </div>

                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 md:py-2 rounded-lg border transition-colors ${showFilters || filterScore !== 'ALL' || filterStatus !== 'ALL'
                                ? 'bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-900/30 dark:border-violet-700 dark:text-violet-300'
                                : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                                }`}
                        >
                            <Filter size={20} />
                            <span className="font-medium">Filtros</span>
                            {(filterScore !== 'ALL' || filterStatus !== 'ALL') && (
                                <span className="w-2 h-2 bg-violet-600 rounded-full" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
                        {/* Score Filter */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                                Classificação
                            </label>
                            <select
                                value={filterScore}
                                onChange={(e) => setFilterScore(e.target.value)}
                                className="w-full px-3 py-3 md:py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-base md:text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-white"
                            >
                                <option value="ALL">Todos</option>
                                <option value="DIAMOND">💎 Diamond</option>
                                <option value="GOLD">⭐ Gold</option>
                                <option value="STANDARD">👤 Standard</option>
                                <option value="RISK">⚠️ Risco</option>
                                <option value="BLACKLIST">🚫 Blacklist</option>
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                                Status
                            </label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full px-3 py-3 md:py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-base md:text-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-white"
                            >
                                <option value="ALL">Todos</option>
                                <option value="Em Tratamento">Em Tratamento</option>
                                <option value="Em Orçamento">Em Orçamento</option>
                                <option value="Finalizado">Finalizado</option>
                                <option value="DEBTOR">Inadimplentes</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* ============================================ */}
            {/* PATIENTS CONTENT */}
            {/* ============================================ */}
            {/* ============================================ */}
            {/* PATIENTS CONTENT */}
            {/* ============================================ */}
            {filteredPatients.length > 0 ? (
                <>
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in">
                            {filteredPatients.map((patient) => {
                                const config = getScoreConfig(patient.patient_score);
                                const Icon = config.icon;

                                return (
                                    <div
                                        key={patient.id}
                                        onClick={() => navigate(`/patients/${patient.id}`)}
                                        className={`
                                            bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg 
                                            transition-all cursor-pointer group overflow-hidden
                                            ${config.cardBorder}
                                        `}
                                    >
                                        {/* Card Header */}
                                        <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                                            <div className="flex items-start gap-3">
                                                {/* Avatar */}
                                                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                    {patient.profile_photo_url ? (
                                                        <img
                                                            src={patient.profile_photo_url}
                                                            alt={patient.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="font-bold text-slate-500 dark:text-slate-400 text-lg">
                                                            {patient.name.substring(0, 2).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Name & Score */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-bold text-slate-800 dark:text-white truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                                        {patient.name}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`
                                                            inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold
                                                            ${config.bg} ${config.text} ${config.border} border
                                                        `}>
                                                            <Icon size={12} />
                                                            {config.label}
                                                        </span>
                                                        {patient.bad_debtor && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                                                                <AlertCircle size={12} />
                                                                Inadimplente
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Arrow Icon */}
                                                <ChevronRight className="text-slate-300 dark:text-slate-600 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors flex-shrink-0" size={20} />
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-4 space-y-3">
                                            {/* Contact Info */}
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                    <Phone size={14} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                                                    <span className="truncate">{patient.phone}</span>
                                                </div>
                                                {patient.instagram_handle && (
                                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                        <Instagram size={14} className="text-pink-500 flex-shrink-0" />
                                                        <span className="truncate">@{patient.instagram_handle}</span>
                                                    </div>
                                                )}
                                                {patient.occupation && (
                                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                        <Briefcase size={14} className="text-slate-400 dark:text-slate-500 flex-shrink-0" />
                                                        <span className="truncate">{patient.occupation}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Financial Summary */}
                                            <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Aprovado</p>
                                                        <p className="text-sm font-bold text-green-600 dark:text-green-400 flex items-center gap-1">
                                                            <TrendingUp size={12} />
                                                            {new Intl.NumberFormat('pt-BR', {
                                                                style: 'currency',
                                                                currency: 'BRL'
                                                            }).format(patient.total_approved)}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Saldo Devedor</p>
                                                        <p className={`text-sm font-bold flex items-center gap-1 ${patient.balance_due > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'
                                                            }`}>
                                                            <DollarSign size={12} />
                                                            {new Intl.NumberFormat('pt-BR', {
                                                                style: 'currency',
                                                                currency: 'BRL'
                                                            }).format(patient.balance_due)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        // List Mode
                        <>
                            {/* Mobile: Card View (Always) */}
                            <div className="md:hidden grid grid-cols-1 gap-4 animate-in fade-in">
                                {filteredPatients.map((patient) => {
                                    const config = getScoreConfig(patient.patient_score);
                                    const Icon = config.icon;
                                    // Simplified Card for Mobile List View
                                    return (
                                        <div
                                            key={patient.id}
                                            onClick={() => navigate(`/patients/${patient.id}`)}
                                            className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm flex items-center gap-4 active:scale-[0.98] transition-all"
                                        >
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
                                                <h4 className="font-bold text-slate-800 dark:text-white truncate">{patient.name}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${config.bg} ${config.text} ${config.border}`}>
                                                        {config.label}
                                                    </span>
                                                    <span className="text-xs text-slate-500">{patient.phone}</span>
                                                </div>
                                            </div>
                                            <ChevronRight className="text-slate-300" />
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Desktop: Table View */}
                            <div className="hidden md:block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden animate-in fade-in">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-medium">
                                            <tr>
                                                <th className="px-6 py-4">Paciente</th>
                                                <th className="px-6 py-4">Contato</th>
                                                <th className="px-6 py-4">Classificação</th>
                                                <th className="px-6 py-4">Financeiro</th>
                                                <th className="px-6 py-4 text-right">Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {filteredPatients.map((patient) => {
                                                const config = getScoreConfig(patient.patient_score);
                                                const Icon = config.icon;

                                                return (
                                                    <tr
                                                        key={patient.id}
                                                        className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                                                        onClick={() => navigate(`/patients/${patient.id}`)}
                                                    >
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                                                                    {patient.profile_photo_url ? (
                                                                        <img src={patient.profile_photo_url} alt={patient.name} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <span className="font-bold text-slate-500 dark:text-slate-400 text-sm">
                                                                            {patient.name.substring(0, 2).toUpperCase()}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-slate-800 dark:text-white">{patient.name}</p>
                                                                    {patient.occupation && (
                                                                        <p className="text-xs text-slate-500 dark:text-slate-400">{patient.occupation}</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-slate-600 dark:text-slate-300">
                                                                <div className="flex items-center gap-1.5">
                                                                    <Phone size={14} className="text-slate-400" />
                                                                    {patient.phone}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col gap-1 items-start">
                                                                <span className={`
                                                                    inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold
                                                                    ${config.bg} ${config.text} ${config.border} border
                                                                `}>
                                                                    <Icon size={12} />
                                                                    {config.label}
                                                                </span>
                                                                {patient.bad_debtor && (
                                                                    <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                                                                        <AlertCircle size={10} /> Inadimplente
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div>
                                                                <p className="text-xs text-slate-500 dark:text-slate-400">Total: <span className="text-green-600 dark:text-green-400 font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(patient.total_approved)}</span></p>
                                                                {patient.balance_due > 0 && (
                                                                    <p className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-0.5">
                                                                        Deve: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(patient.balance_due)}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <ChevronRight className="text-slate-300 dark:text-slate-600 inline-block" size={20} />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </>
            ) : (
                // Empty State
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-12 text-center transition-colors">
                    <Users className="text-slate-300 dark:text-slate-600 mx-auto mb-4" size={64} />
                    <h3 className="text-lg font-bold text-slate-600 dark:text-slate-300 mb-2">
                        {searchTerm || filterScore !== 'ALL' || filterStatus !== 'ALL'
                            ? 'Nenhum paciente encontrado'
                            : 'Nenhum paciente cadastrado'}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
                        {searchTerm || filterScore !== 'ALL' || filterStatus !== 'ALL'
                            ? 'Tente ajustar os filtros ou realizar uma nova busca.'
                            : 'Comece cadastrando seu primeiro paciente para começar a usar o sistema.'}
                    </p>
                    {!(searchTerm || filterScore !== 'ALL' || filterStatus !== 'ALL') && (
                        <button
                            onClick={() => navigate('/patients/new')}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors font-medium shadow-sm"
                        >
                            <Plus size={20} />
                            Cadastrar Primeiro Paciente
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default PatientsList;
