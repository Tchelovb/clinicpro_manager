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
    LayoutGrid,
    List
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
            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .eq('clinic_id', profile!.clinic_id)
                .order('created_at', { ascending: false });

            if (error) throw error;
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

    const getScoreConfig = (score: string) => {
        switch (score) {
            case 'DIAMOND':
                return {
                    borderColor: 'border-amber-400',
                    bgColor: 'bg-amber-50',
                    textColor: 'text-amber-700',
                    badge: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-md',
                    icon: Crown,
                    label: 'Diamond'
                };
            case 'GOLD':
                return {
                    borderColor: 'border-yellow-400',
                    bgColor: 'bg-yellow-50',
                    textColor: 'text-yellow-700',
                    badge: 'bg-yellow-400 text-white',
                    icon: Star,
                    label: 'Gold'
                };
            case 'RISK':
                return {
                    borderColor: 'border-rose-300',
                    bgColor: 'bg-rose-50',
                    textColor: 'text-rose-700',
                    badge: 'bg-rose-500 text-white',
                    icon: AlertCircle,
                    label: 'Risco'
                };
            default:
                return {
                    borderColor: 'border-slate-200',
                    bgColor: 'bg-white',
                    textColor: 'text-slate-600',
                    badge: 'bg-slate-100 text-slate-600',
                    icon: Users,
                    label: 'Standard'
                };
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400 animate-pulse">
                <Users size={48} className="mb-4 opacity-50" />
                <p>Carregando pacientes...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Pacientes</h1>
                    <p className="text-slate-500 mt-1">
                        Gerencie sua base de {patients.length} pacientes
                    </p>
                </div>
                <button
                    onClick={() => navigate('/patients/new')}
                    className="group bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-violet-200 hover:-translate-y-0.5 flex items-center gap-2"
                >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                    Novo Paciente
                </button>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome, telefone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all font-medium text-slate-700"
                    />
                </div>

                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <select
                        value={filterScore}
                        onChange={(e) => setFilterScore(e.target.value)}
                        className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium text-slate-600 cursor-pointer"
                    >
                        <option value="ALL">Todos os Scores</option>
                        <option value="DIAMOND">💎 Diamond</option>
                        <option value="GOLD">⭐ Gold</option>
                        <option value="STANDARD">👤 Standard</option>
                        <option value="RISK">⚠️ Risco</option>
                    </select>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 font-medium text-slate-600 cursor-pointer"
                    >
                        <option value="ALL">Todos os Status</option>
                        <option value="Ativo">✅ Ativos</option>
                        <option value="Em Tratamento">🩺 Em Tratamento</option>
                        <option value="DEBTOR">🔴 Inadimplentes</option>
                    </select>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredPatients.map(patient => {
                    const config = getScoreConfig(patient.patient_score);
                    const Icon = config.icon;

                    return (
                        <div
                            key={patient.id}
                            onClick={() => navigate(`/patients/${patient.id}`)}
                            className={`group bg-white rounded-2xl border-2 ${config.borderColor} p-6 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden`}
                        >
                            {/* Decorative Background for High Scores */}
                            {(patient.patient_score === 'DIAMOND' || patient.patient_score === 'GOLD') && (
                                <div className={`absolute top-0 right-0 w-32 h-32 ${config.bgColor} rounded-bl-full -mr-16 -mt-16 opacity-50`} />
                            )}

                            <div className="relative flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className={`w-16 h-16 rounded-2xl ${config.bgColor} flex items-center justify-center overflow-hidden border-2 border-white shadow-sm`}>
                                        {patient.profile_photo_url ? (
                                            <img src={patient.profile_photo_url} alt={patient.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className={`text-2xl font-bold ${config.textColor}`}>
                                                {patient.name.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800 group-hover:text-violet-600 transition-colors line-clamp-1">
                                            {patient.name}
                                        </h3>
                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold mt-1 ${config.badge}`}>
                                            <Icon size={12} />
                                            {config.label}
                                        </div>
                                    </div>
                                </div>
                                {patient.bad_debtor && (
                                    <div className="absolute top-0 right-0">
                                        <span className="flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 text-slate-500 text-sm">
                                    <Phone size={16} className="text-slate-400" />
                                    {patient.phone}
                                </div>
                                {patient.instagram_handle && (
                                    <div className="flex items-center gap-3 text-slate-500 text-sm">
                                        <Instagram size={16} className="text-pink-500" />
                                        {patient.instagram_handle}
                                    </div>
                                )}
                                {patient.occupation && (
                                    <div className="flex items-center gap-3 text-slate-500 text-sm">
                                        <Briefcase size={16} className="text-slate-400" />
                                        <span className="truncate">{patient.occupation}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                <div>
                                    <p className="text-xs text-slate-400 font-medium uppercase">Aprovado</p>
                                    <p className="font-bold text-teal-600">
                                        R$ {patient.total_approved.toLocaleString('pt-BR')}
                                    </p>
                                </div>
                                {patient.balance_due > 0 && (
                                    <div className="text-right">
                                        <p className="text-xs text-rose-400 font-medium uppercase">Pendente</p>
                                        <p className="font-bold text-rose-600">
                                            R$ {patient.balance_due.toLocaleString('pt-BR')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredPatients.length === 0 && !loading && (
                <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="text-slate-400" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-700">Nenhum paciente encontrado</h3>
                    <p className="text-slate-500">
                        {searchTerm ? `Não encontramos ninguém com "${searchTerm}"` : 'Sua lista de pacientes está vazia.'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default PatientsList;
