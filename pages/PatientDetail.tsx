import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
    Crown,
    Star,
    AlertCircle,
    CheckCircle,
    Instagram,
    Briefcase,
    MapPin,
    Phone,
    Mail,
    Calendar,
    DollarSign,
    FileText,
    Stethoscope,
    User,
    Edit,
    Heart,
    TrendingUp,
    Gift
} from 'lucide-react';

interface Patient {
    id: string;
    name: string;
    nickname?: string;
    phone: string;
    email?: string;
    birth_date?: string;
    gender?: string;
    occupation?: string;
    instagram_handle?: string;
    city?: string;
    profile_photo_url?: string;
    patient_score: 'DIAMOND' | 'GOLD' | 'STANDARD' | 'RISK' | 'BLACKLIST';
    bad_debtor: boolean;
    total_approved: number;
    total_paid: number;
    balance_due: number;
    vip_notes?: string;
    sentiment_status: 'VERY_HAPPY' | 'HAPPY' | 'NEUTRAL' | 'UNHAPPY' | 'COMPLAINING';
    status: string;
}

type TabType = 'overview' | 'treatments' | 'financial' | 'documents';

export const PatientDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [patient, setPatient] = useState<Patient | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadPatient();
        }
    }, [id]);

    const loadPatient = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setPatient(data);
        } catch (error) {
            console.error('Erro ao carregar paciente:', error);
        } finally {
            setLoading(false);
        }
    };

    const getScoreConfig = (score: string) => {
        switch (score) {
            case 'DIAMOND':
                return {
                    color: 'border-amber-400 bg-amber-50',
                    badge: 'bg-amber-400 text-white',
                    icon: Crown,
                    label: 'Diamond VIP'
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
                    color: 'border-slate-300 bg-slate-50',
                    badge: 'bg-slate-400 text-white',
                    icon: User,
                    label: 'Standard'
                };
        }
    };

    const getSentimentIcon = (sentiment: string) => {
        switch (sentiment) {
            case 'VERY_HAPPY':
                return '😊';
            case 'HAPPY':
                return '🙂';
            case 'UNHAPPY':
                return '😐';
            case 'COMPLAINING':
                return '😠';
            default:
                return '😶';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-600">Paciente não encontrado</p>
            </div>
        );
    }

    const scoreConfig = getScoreConfig(patient.patient_score);
    const ScoreIcon = scoreConfig.icon;
    const age = patient.birth_date
        ? new Date().getFullYear() - new Date(patient.birth_date).getFullYear()
        : null;

    return (
        <div className="space-y-6">
            {/* VIP Alert */}
            {patient.vip_notes && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <Crown className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-semibold text-amber-900">Paciente VIP</p>
                        <p className="text-sm text-amber-700 mt-1">{patient.vip_notes}</p>
                    </div>
                </div>
            )}

            {/* Header Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Cover */}
                <div className="h-24 bg-gradient-to-r from-violet-600 to-violet-700"></div>

                {/* Profile Info */}
                <div className="px-6 pb-6">
                    <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-12">
                        {/* Avatar */}
                        <div className={`relative w-24 h-24 rounded-2xl border-4 ${scoreConfig.color} overflow-hidden bg-white`}>
                            {patient.profile_photo_url ? (
                                <img
                                    src={patient.profile_photo_url}
                                    alt={patient.name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-100 to-violet-200">
                                    <span className="text-3xl font-bold text-violet-600">
                                        {patient.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                            {patient.patient_score === 'DIAMOND' && (
                                <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center shadow-lg">
                                    <Crown className="w-4 h-4 text-white" />
                                </div>
                            )}
                        </div>

                        {/* Name & Info */}
                        <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <h1 className="text-2xl font-bold text-slate-800">
                                    {patient.name}
                                    {patient.nickname && (
                                        <span className="text-lg text-slate-500 ml-2">"{patient.nickname}"</span>
                                    )}
                                </h1>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${scoreConfig.badge}`}>
                                    {scoreConfig.label}
                                </span>
                                <span className="text-2xl">{getSentimentIcon(patient.sentiment_status)}</span>
                            </div>

                            {/* Quick Info */}
                            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                                {patient.occupation && (
                                    <div className="flex items-center gap-1.5">
                                        <Briefcase className="w-4 h-4" />
                                        <span>{patient.occupation}</span>
                                    </div>
                                )}
                                {age && (
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-4 h-4" />
                                        <span>{age} anos</span>
                                    </div>
                                )}
                                {patient.instagram_handle && (
                                    <a
                                        href={`https://instagram.com/${patient.instagram_handle.replace('@', '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1.5 text-violet-600 hover:text-violet-700 transition-colors"
                                    >
                                        <Instagram className="w-4 h-4" />
                                        <span>{patient.instagram_handle}</span>
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Edit Button */}
                        <button
                            onClick={() => navigate(`/dashboard/patients/${id}/edit`)}
                            className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition-colors flex items-center gap-2"
                        >
                            <Edit className="w-4 h-4" />
                            Editar
                        </button>
                    </div>

                    {/* Financial Alerts */}
                    <div className="mt-4 flex flex-wrap gap-2">
                        {patient.bad_debtor && (
                            <div className="px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-rose-600" />
                                <span className="text-sm font-medium text-rose-700">INADIMPLENTE</span>
                            </div>
                        )}
                        {patient.balance_due > 0 && (
                            <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-amber-600" />
                                <span className="text-sm font-medium text-amber-700">
                                    Saldo Devedor: R$ {patient.balance_due.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        )}
                        {patient.balance_due === 0 && patient.total_paid > 0 && (
                            <div className="px-3 py-1.5 bg-teal-50 border border-teal-200 rounded-lg flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-teal-600" />
                                <span className="text-sm font-medium text-teal-700">Em dia</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="border-b border-slate-200">
                    <div className="flex overflow-x-auto">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${activeTab === 'overview'
                                    ? 'border-violet-600 text-violet-600'
                                    : 'border-transparent text-slate-600 hover:text-slate-800'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Visão Geral
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('treatments')}
                            className={`px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${activeTab === 'treatments'
                                    ? 'border-violet-600 text-violet-600'
                                    : 'border-transparent text-slate-600 hover:text-slate-800'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <Stethoscope className="w-4 h-4" />
                                Tratamentos
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('financial')}
                            className={`px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${activeTab === 'financial'
                                    ? 'border-violet-600 text-violet-600'
                                    : 'border-transparent text-slate-600 hover:text-slate-800'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                Financeiro
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('documents')}
                            className={`px-6 py-4 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${activeTab === 'documents'
                                    ? 'border-violet-600 text-violet-600'
                                    : 'border-transparent text-slate-600 hover:text-slate-800'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Documentos
                            </div>
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Contact Info */}
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Informações de Contato</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                        <Phone className="w-5 h-5 text-slate-400" />
                                        <div>
                                            <p className="text-xs text-slate-500">Telefone</p>
                                            <p className="font-medium text-slate-800">{patient.phone}</p>
                                        </div>
                                    </div>
                                    {patient.email && (
                                        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                            <Mail className="w-5 h-5 text-slate-400" />
                                            <div>
                                                <p className="text-xs text-slate-500">Email</p>
                                                <p className="font-medium text-slate-800">{patient.email}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Financial Summary */}
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Resumo Financeiro</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="p-4 bg-teal-50 rounded-lg border border-teal-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <TrendingUp className="w-5 h-5 text-teal-600" />
                                            <p className="text-sm text-teal-700 font-medium">Total Aprovado</p>
                                        </div>
                                        <p className="text-2xl font-bold text-teal-900">
                                            R$ {patient.total_approved.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-violet-50 rounded-lg border border-violet-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle className="w-5 h-5 text-violet-600" />
                                            <p className="text-sm text-violet-700 font-medium">Total Pago</p>
                                        </div>
                                        <p className="text-2xl font-bold text-violet-900">
                                            R$ {patient.total_paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className={`p-4 rounded-lg border ${patient.balance_due > 0 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'
                                        }`}>
                                        <div className="flex items-center gap-2 mb-2">
                                            <DollarSign className={`w-5 h-5 ${patient.balance_due > 0 ? 'text-rose-600' : 'text-slate-600'}`} />
                                            <p className={`text-sm font-medium ${patient.balance_due > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
                                                Saldo Devedor
                                            </p>
                                        </div>
                                        <p className={`text-2xl font-bold ${patient.balance_due > 0 ? 'text-rose-900' : 'text-slate-900'}`}>
                                            R$ {patient.balance_due.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 mb-4">Status do Paciente</h3>
                                <div className="p-4 bg-slate-50 rounded-lg">
                                    <p className="text-slate-600">
                                        <span className="font-medium">Status Atual:</span> {patient.status}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'treatments' && (
                        <div className="text-center py-12 text-slate-500">
                            <Stethoscope className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                            <p>Conteúdo de tratamentos será implementado</p>
                        </div>
                    )}

                    {activeTab === 'financial' && (
                        <div className="text-center py-12 text-slate-500">
                            <DollarSign className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                            <p>Histórico financeiro será implementado</p>
                        </div>
                    )}

                    {activeTab === 'documents' && (
                        <div className="text-center py-12 text-slate-500">
                            <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                            <p>Documentos serão implementados</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PatientDetail;
