/**
 * PatientsList.tsx
 * SCR-04: Lista de Pacientes
 * 
 * FEATURES:
 * - Grid responsivo com cards
 * - Filtros por status e score
 * - Busca por nome/telefone
 * - Badges visuais (DIAMOND, GOLD, Inadimplente)
 * - Click para navegar ao perfil (SCR-04-A)
 * 
 * ACESSO: TODOS
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
    Users,
    Search,
    Filter,
    Plus,
    Crown,
    Star,
    AlertCircle,
    Phone,
    Instagram,
    Briefcase,
    DollarSign
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
}

export const PatientsList: React.FC = () => {
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
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

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.phone.includes(searchTerm)
            );
        }

        // Score filter
        if (filterScore !== 'ALL') {
            filtered = filtered.filter(p => p.patient_score === filterScore);
        }

        // Status filter
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
                    color: 'border-amber-400 bg-amber-50',
                    badge: 'bg-amber-400 text-white',
                    icon: Crown,
                    label: 'Diamond'
                };
            case 'GOLD':
                return {
                    color: 'border-yellow-400 bg-yellow-50',
                    badge: 'bg-yellow-400 text-white',
                    icon: Star,
                    label: 'Gold'
                };
            case 'RISK':
                return {
                    color: 'border-rose-400 bg-rose-50',
                    badge: 'bg-rose-400 text-white',
                    icon: AlertCircle,
                    label: 'Risco'
                };
            default:
                return {
                    color: 'border-slate-200 bg-white',
                    badge: 'bg-slate-400 text-white',
                    icon: Users,
                    label: 'Standard'
                };
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Pacientes</h2>
                    <p className="text-sm text-slate-500 mt-1">
                        {filteredPatients.length} de {patients.length} pacientes
                    </p>
                </div>
                <button
                    onClick={() => navigate('/dashboard/patients/new')}
                    className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Novo Paciente
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nome ou telefone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>
                    </div>

                    {/* Score Filter */}
                    <div>
                        <select
                            value={filterScore}
                            onChange={(e) => setFilterScore(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                            <option value="ALL">Todos os Scores</option>
                            <option value="DIAMOND">💎 Diamond</option>
                            <option value="GOLD">⭐ Gold</option>
                            <option value="STANDARD">👤 Standard</option>
                            <option value="RISK">⚠️ Risco</option>
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        >
                            <option value="ALL">Todos os Status</option>
                            <option value="Em Tratamento">Em Tratamento</option>
                            <option value="Ativo">Ativo</option>
                            <option value="DEBTOR">Inadimplentes</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Patients Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPatients.map((patient) => {
                    const scoreConfig = getScoreConfig(patient.patient_score);
                    const ScoreIcon = scoreConfig.icon;

                    return (
                        <button
                            key={patient.id}
                            onClick={() => navigate(`/dashboard/patients/${patient.id}`)}
                            className={`group relative bg-white rounded-xl border-2 ${scoreConfig.color} shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden text-left`}
                        >
                            {/* VIP Badge */}
                            {(patient.patient_score === 'DIAMOND' || patient.patient_score === 'GOLD') && (
                                <div className="absolute top-3 right-3 z-10">
                                    <div className={`p-2 ${scoreConfig.badge} rounded-full shadow-lg`}>
                                        <ScoreIcon className="w-4 h-4" />
                                    </div>
                                </div>
                            )}

                            {/* Inadimplente Badge */}
                            {patient.bad_debtor && (
                                <div className="absolute top-3 left-3 z-10">
                                    <span className="px-2 py-1 bg-rose-600 text-white text-xs font-bold rounded-full">
                                        INADIMPLENTE
                                    </span>
                                </div>
                            )}

                            <div className="p-5">
                                {/* Avatar + Name */}
                                <div className="flex items-start gap-3 mb-4">
                                    <div className={`w-14 h-14 rounded-xl border-2 ${scoreConfig.color} overflow-hidden flex-shrink-0`}>
                                        {patient.profile_photo_url ? (
                                            <img
                                                src={patient.profile_photo_url}
                                                alt={patient.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-100 to-violet-200">
                                                <span className="text-xl font-bold text-violet-600">
                                                    {patient.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-slate-800 truncate group-hover:text-violet-600 transition-colors">
                                            {patient.name}
                                        </h3>
                                        <span className={`inline-block px-2 py-0.5 ${scoreConfig.badge} text-xs rounded-full mt-1`}>
                                            {scoreConfig.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Contact Info */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                        <Phone className="w-4 h-4 text-slate-400" />
                                        <span>{patient.phone}</span>
                                    </div>
                                    {patient.occupation && (
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Briefcase className="w-4 h-4 text-slate-400" />
                                            <span className="truncate">{patient.occupation}</span>
                                        </div>
                                    )}
                                    {patient.instagram_handle && (
                                        <div className="flex items-center gap-2 text-sm text-violet-600">
                                            <Instagram className="w-4 h-4" />
                                            <span className="truncate">{patient.instagram_handle}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Financial Summary */}
                                <div className="pt-4 border-t border-slate-100">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Total Aprovado</span>
                                        <span className="font-bold text-teal-600">
                                            R$ {patient.total_approved.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                    {patient.balance_due > 0 && (
                                        <div className="flex items-center justify-between text-sm mt-2">
                                            <span className="text-slate-500">Saldo Devedor</span>
                                            <span className="font-bold text-rose-600">
                                                R$ {patient.balance_due.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Hover Effect */}
                            <div className="absolute inset-0 border-2 border-violet-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                        </button>
                    );
                })}
            </div>

            {/* Empty State */}
            {filteredPatients.length === 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                    <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Nenhum paciente encontrado</h3>
                    <p className="text-sm text-slate-500 mb-6">
                        {searchTerm || filterScore !== 'ALL' || filterStatus !== 'ALL'
                            ? 'Tente ajustar os filtros de busca'
                            : 'Comece cadastrando seu primeiro paciente'}
                    </p>
                    {!searchTerm && filterScore === 'ALL' && filterStatus === 'ALL' && (
                        <button
                            onClick={() => navigate('/dashboard/patients/new')}
                            className="px-6 py-3 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors inline-flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Cadastrar Primeiro Paciente
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default PatientsList;
