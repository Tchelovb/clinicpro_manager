import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Plus, Phone, Calendar, Clock,
    User, ArrowRight, Activity, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { PageContainer } from '../components/layout/PageContainer';
import { GlassCard } from '../components/ui/GlassCard';
// 1. DATA FETCHING (Hook Centralizado)
import { usePatients } from '../hooks/usePatients';

export const PatientsList = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('Todos');

    const { patients, isLoading } = usePatients();

    // 1. A MÁGICA VISUAL (Copia exata do Orçamento)
    const getCardStyle = (status: string | null) => {
        switch (status) {
            case 'Em Tratamento':
                // AZUL (Igual WAITING_CLOSING)
                return 'border-2 border-blue-500 shadow-[0_4px_20px_-10px_rgba(59,130,246,0.3)]';

            case 'Avaliação':
                // LARANJA (Igual PENDING)
                return 'border-2 border-orange-400 shadow-[0_4px_20px_-10px_rgba(251,146,60,0.3)]';

            case 'Alta':
                // VERDE (Igual APPROVED)
                return 'border-2 border-green-500 shadow-[0_4px_20px_-10px_rgba(34,197,94,0.3)]';

            case 'Inativo':
                // CINZA (Igual REJECTED)
                return 'border border-slate-200 opacity-70 grayscale hover:grayscale-0';

            default:
                // Default para status null ou desconhecido ("Avaliação" visualmente)
                return 'border-2 border-orange-400 shadow-[0_4px_20px_-10px_rgba(251,146,60,0.3)]';
        }
    };

    // 2. BADGES DE STATUS
    const renderStatusBadge = (status: string | null) => {
        switch (status) {
            case 'Em Tratamento':
                return <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-100 flex items-center"><Activity size={12} className="mr-1" /> Em Tratamento</span>;
            case 'Avaliação':
                return <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs font-bold border border-orange-100 flex items-center"><Clock size={12} className="mr-1" /> Avaliação</span>;
            case 'Alta':
                return <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-100 flex items-center"><User size={12} className="mr-1" /> Alta Clínica</span>;
            default:
                // Fallback badge
                return <span className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs font-bold border border-orange-100 flex items-center"><Clock size={12} className="mr-1" /> Avaliação</span>;
        }
    };

    // Helper para cor do avatar
    const getAvatarColor = (status: string | null) => {
        switch (status) {
            case 'Em Tratamento': return 'bg-blue-100 text-blue-700';
            case 'Avaliação': return 'bg-orange-100 text-orange-700';
            case 'Alta': return 'bg-green-100 text-green-700';
            default: return 'bg-orange-100 text-orange-700';
        }
    }

    // Filtragem
    const filteredPatients = patients?.filter(patient => {
        const sTerm = searchTerm.toLowerCase();
        const matchesSearch = (patient.name || '').toLowerCase().includes(sTerm) ||
            (patient.phone && patient.phone.includes(searchTerm));

        // Tratamento de Status NULL (assume Avaliação para filtro)
        const currentStatus = patient.status || 'Avaliação';
        const matchesStatus = filterStatus === 'Todos' || currentStatus === filterStatus;

        return matchesSearch && matchesStatus;
    }) || [];

    if (isLoading) {
        return (
            <PageContainer title="Meus Pacientes" subtitle="Carregando...">
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </PageContainer>
        )
    }

    return (
        <PageContainer
            title="Meus Pacientes"
            subtitle="Gerencie prontuários e históricos clínicos"
            action={
                <button
                    onClick={() => navigate('/patients/new')}
                    className="bg-primary hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all flex items-center active:scale-95"
                >
                    <Plus size={18} className="mr-2" /> Novo Paciente
                </button>
            }
        >

            {/* FILTROS (Igual Orçamentos) */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 items-center bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar paciente..."
                        className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-slate-700 font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-1 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 px-2">
                    {['Todos', 'Em Tratamento', 'Avaliação', 'Alta'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setFilterStatus(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors
                 ${filterStatus === tab
                                    ? 'bg-slate-800 text-white shadow-md'
                                    : 'text-slate-500 hover:bg-slate-100'}
               `}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* GRID DE CARDS (Layout Idêntico ao Orçamento) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                {filteredPatients.map((patient) => {
                    const status = patient.status || 'Avaliação'; // Normalização

                    return (
                        <GlassCard
                            key={patient.id}
                            onClick={() => navigate(`/patients/${patient.id}`)}
                            hover
                            className="p-6 relative overflow-hidden group"
                        >
                            {/* CABEÇALHO */}
                            <div className="flex justify-between items-start mb-5">
                                <div className="flex items-center gap-4">
                                    <div className={`
                            w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-inner
                            ${getAvatarColor(status)}
                        `}>
                                        {(patient.name || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-base line-clamp-1">{patient.name || 'Sem Nome'}</h3>
                                        <p className="text-xs text-slate-500 flex items-center mt-0.5">
                                            <Phone size={10} className="mr-1" /> {patient.phone || 'Sem telefone'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* INFO CENTRAL */}
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400 font-medium">Cadastrado em</span>
                                    <span className="text-slate-700 font-bold flex items-center">
                                        <Calendar size={14} className="mr-1 text-slate-400" />
                                        {patient.created_at ? format(new Date(patient.created_at), 'dd/MM/yyyy') : '-'}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-400 font-medium">Financeiro</span>
                                    <span className={`font-bold flex items-center text-green-600`}>
                                        Em dia
                                    </span>
                                </div>
                            </div>

                            {/* RODAPÉ */}
                            <div className="flex items-center justify-between pt-4 border-t border-slate-100 border-dashed">
                                {renderStatusBadge(status)}

                                <button className="text-xs font-bold text-slate-600 group-hover:text-primary flex items-center bg-slate-50 group-hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors">
                                    Prontuário <ArrowRight size={14} className="ml-1 opacity-50 group-hover:opacity-100" />
                                </button>
                            </div>

                        </GlassCard>
                    );
                })}
                {filteredPatients.length === 0 && (
                    <div className="col-span-full text-center py-20 text-slate-400 italic">
                        Nenhum paciente encontrado.
                    </div>
                )}
            </div>

        </PageContainer>
    );
};
