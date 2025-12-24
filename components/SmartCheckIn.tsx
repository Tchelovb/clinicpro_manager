import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
    Search,
    AlertCircle,
    User,
    Phone,
    Mail,
    MapPin,
    Crown,
    Star,
    Users,
    ChevronRight,
    X,
    Loader2,
    ShieldAlert
} from 'lucide-react';

interface SearchResult {
    id: string;
    name: string;
    phone: string;
    email?: string;
    cpf?: string;
    address?: string;
    patient_score: 'DIAMOND' | 'GOLD' | 'STANDARD' | 'RISK' | 'BLACKLIST';
    profile_photo_url?: string;
    created_at: string;
    status: string;
    bad_debtor: boolean;
}

interface SmartCheckInProps {
    onSearchComplete: (hasResults: boolean) => void;
    onPatientSelect?: (patientId: string) => void;
}

const SmartCheckIn: React.FC<SmartCheckInProps> = ({ onSearchComplete, onPatientSelect }) => {
    const { profile } = useAuth();
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [showWarning, setShowWarning] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm.trim().length >= 3) {
                performSearch(searchTerm);
            } else if (searchTerm.trim().length === 0) {
                setSearchResults([]);
                setHasSearched(false);
                onSearchComplete(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm]);

    const performSearch = async (term: string) => {
        if (!profile?.clinic_id) return;

        setIsSearching(true);
        setShowWarning(false);

        try {
            const cleanTerm = term.trim().toLowerCase();

            // Buscar por nome, telefone, CPF ou email
            const { data, error } = await supabase
                .from('patients')
                .select('id, name, phone, email, cpf, address, patient_score, profile_photo_url, created_at, status, bad_debtor')
                .eq('clinic_id', profile.clinic_id)
                .or(`name.ilike.%${cleanTerm}%,phone.ilike.%${cleanTerm}%,cpf.ilike.%${cleanTerm}%,email.ilike.%${cleanTerm}%`)
                .order('name', { ascending: true })
                .limit(10);

            if (error) throw error;

            setSearchResults(data || []);
            setHasSearched(true);

            // Notificar componente pai sobre o resultado da busca
            onSearchComplete(data && data.length > 0);

            // Se encontrou resultados, mostrar aviso
            if (data && data.length > 0) {
                setShowWarning(true);
            }
        } catch (error) {
            console.error('Erro ao buscar pacientes:', error);
            setSearchResults([]);
            onSearchComplete(false);
        } finally {
            setIsSearching(false);
        }
    };

    const handlePatientClick = (patientId: string) => {
        if (onPatientSelect) {
            onPatientSelect(patientId);
        } else {
            navigate(`/patients/${patientId}`);
        }
    };

    const clearSearch = () => {
        setSearchTerm('');
        setSearchResults([]);
        setHasSearched(false);
        setShowWarning(false);
        onSearchComplete(false);
    };

    const getScoreConfig = (score: string) => {
        switch (score) {
            case 'DIAMOND':
                return {
                    bg: 'bg-purple-50 dark:bg-purple-900/20',
                    text: 'text-purple-700 dark:text-purple-300',
                    border: 'border-purple-300 dark:border-purple-800',
                    icon: Crown,
                    label: 'Diamond'
                };
            case 'GOLD':
                return {
                    bg: 'bg-amber-50 dark:bg-amber-900/20',
                    text: 'text-amber-700 dark:text-amber-300',
                    border: 'border-amber-300 dark:border-amber-800',
                    icon: Star,
                    label: 'Gold'
                };
            case 'RISK':
                return {
                    bg: 'bg-rose-50 dark:bg-rose-900/20',
                    text: 'text-rose-700 dark:text-rose-300',
                    border: 'border-rose-300 dark:border-rose-800',
                    icon: AlertCircle,
                    label: 'Risco'
                };
            case 'BLACKLIST':
                return {
                    bg: 'bg-slate-900 dark:bg-black',
                    text: 'text-white',
                    border: 'border-slate-700',
                    icon: ShieldAlert,
                    label: 'Blacklist'
                };
            default:
                return {
                    bg: 'bg-slate-50 dark:bg-slate-800',
                    text: 'text-slate-600 dark:text-slate-400',
                    border: 'border-slate-200 dark:border-slate-600',
                    icon: Users,
                    label: 'Standard'
                };
        }
    };

    return (
        <div className="space-y-4">
            {/* Search Bar com Holofote */}
            <div className="relative">
                <div className={`relative transition-all duration-300 ${showWarning ? 'ring-4 ring-amber-500/50' : ''}`}>
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={20} />
                    <input
                        type="text"
                        placeholder="🔍 BUSQUE ANTES DE CADASTRAR - Digite nome, telefone, CPF ou e-mail..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`
              w-full pl-12 pr-12 py-4 text-base font-medium
              border-2 rounded-xl
              focus:outline-none focus:ring-4 focus:ring-violet-500/50 focus:border-violet-500
              bg-white dark:bg-slate-800 
              text-slate-900 dark:text-white 
              placeholder-slate-500 dark:placeholder-slate-400
              transition-all duration-200
              ${showWarning
                                ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-900/10'
                                : 'border-slate-300 dark:border-slate-600'
                            }
            `}
                        autoFocus
                    />
                    {isSearching && (
                        <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 text-violet-600 animate-spin" size={20} />
                    )}
                    {searchTerm && !isSearching && (
                        <button
                            onClick={clearSearch}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Warning Badge */}
                {showWarning && searchResults.length > 0 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 animate-in fade-in zoom-in duration-200">
                        <div className="bg-amber-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-2">
                            <AlertCircle size={14} />
                            ATENÇÃO: {searchResults.length} paciente{searchResults.length > 1 ? 's' : ''} encontrado{searchResults.length > 1 ? 's' : ''}!
                        </div>
                    </div>
                )}
            </div>

            {/* Instruções */}
            {!hasSearched && !searchTerm && (
                <div className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border-2 border-violet-200 dark:border-violet-800 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-violet-100 dark:bg-violet-900/40 rounded-full flex-shrink-0">
                            <Search className="text-violet-600 dark:text-violet-400" size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-violet-900 dark:text-violet-100 mb-2">
                                🔍 Smart Check-in (Holofote)
                            </h3>
                            <p className="text-sm text-violet-700 dark:text-violet-300 mb-3">
                                <strong>IMPORTANTE:</strong> Antes de cadastrar um novo paciente, você <strong>DEVE</strong> realizar uma busca para evitar duplicidade de cadastros.
                            </p>
                            <ul className="text-sm text-violet-600 dark:text-violet-400 space-y-1">
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-violet-500 rounded-full"></div>
                                    Digite pelo menos 3 caracteres para iniciar a busca
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-violet-500 rounded-full"></div>
                                    Busque por: Nome, Telefone, CPF ou E-mail
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-violet-500 rounded-full"></div>
                                    Se não encontrar ninguém, o botão "Novo Paciente" será liberado
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Search Results */}
            {hasSearched && searchResults.length > 0 && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                            📋 {searchResults.length} Resultado{searchResults.length > 1 ? 's' : ''} Encontrado{searchResults.length > 1 ? 's' : ''}
                        </h3>
                        <button
                            onClick={clearSearch}
                            className="text-xs text-violet-600 dark:text-violet-400 hover:underline font-medium"
                        >
                            Limpar busca
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {searchResults.map((patient) => {
                            const config = getScoreConfig(patient.patient_score);
                            const Icon = config.icon;

                            return (
                                <div
                                    key={patient.id}
                                    onClick={() => handlePatientClick(patient.id)}
                                    className="bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 p-4 hover:border-violet-500 dark:hover:border-violet-500 hover:shadow-lg transition-all cursor-pointer group"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Avatar */}
                                        <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-slate-200 dark:ring-slate-600 group-hover:ring-violet-500 transition-all">
                                            {patient.profile_photo_url ? (
                                                <img
                                                    src={patient.profile_photo_url}
                                                    alt={patient.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="font-bold text-slate-500 dark:text-slate-400 text-xl">
                                                    {patient.name.substring(0, 2).toUpperCase()}
                                                </span>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-slate-800 dark:text-white truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                                    {patient.name}
                                                </h4>
                                                <span className={`
                          inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold
                          ${config.bg} ${config.text} ${config.border} border flex-shrink-0
                        `}>
                                                    <Icon size={12} />
                                                    {config.label}
                                                </span>
                                            </div>

                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                    {patient.status && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                                                            {patient.status}
                                                        </span>
                                                    )}
                                                    {patient.bad_debtor && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 animate-pulse">
                                                            <AlertCircle size={10} />
                                                            INADIMPLENTE
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                    <Phone size={14} className="text-slate-400 flex-shrink-0" />
                                                    <span className="truncate">{patient.phone}</span>
                                                </div>
                                                {patient.email && (
                                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                        <Mail size={14} className="text-slate-400 flex-shrink-0" />
                                                        <span className="truncate">{patient.email}</span>
                                                    </div>
                                                )}
                                                {patient.cpf && (
                                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                        <User size={14} className="text-slate-400 flex-shrink-0" />
                                                        <span className="truncate">CPF: {patient.cpf}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Arrow */}
                                        <ChevronRight className="text-slate-300 dark:text-slate-600 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors flex-shrink-0" size={24} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Warning Footer */}
                    <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" size={20} />
                            <div className="text-sm">
                                <p className="font-bold text-amber-900 dark:text-amber-100 mb-1">
                                    ⚠️ Paciente já cadastrado?
                                </p>
                                <p className="text-amber-700 dark:text-amber-300">
                                    Clique no card acima para acessar a ficha existente. <strong>Não crie um cadastro duplicado!</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* No Results */}
            {hasSearched && searchResults.length === 0 && searchTerm.length >= 3 && !isSearching && (
                <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="text-green-600 dark:text-green-400" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-green-900 dark:text-green-100 mb-2">
                            ✅ Nenhum paciente encontrado
                        </h3>
                        <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                            Não há nenhum cadastro com "<strong>{searchTerm}</strong>" no sistema.
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                            ✓ Busca realizada com sucesso. Você pode prosseguir com o cadastro.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SmartCheckIn;
