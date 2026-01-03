import React, { useState, useEffect } from 'react';
import {
    Activity, Calendar, CheckCircle2, Clock,
    AlertCircle, Search, ChevronRight, User, Filter,
    LayoutGrid, List as ListIcon, MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../../utils/format';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// --- COMPONENTES VISUAIS ---

const StatusBadge = ({ status }: { status: string }) => {
    const styles: any = {
        'NOT_STARTED': 'bg-purple-100 text-purple-700',
        'IN_PROGRESS': 'bg-blue-100 text-blue-700',
        'COMPLETED': 'bg-emerald-100 text-emerald-700',
        'WAITING_LAB': 'bg-amber-100 text-amber-700'
    };

    const labels: any = {
        'NOT_STARTED': 'A Fazer',
        'IN_PROGRESS': 'Em Andamento',
        'COMPLETED': 'Concluído',
        'WAITING_LAB': 'Laboratório'
    };

    return (
        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${styles[status] || 'bg-gray-100'}`}>
            {labels[status] || status}
        </span>
    );
};

// VISTA KANBAN (Card)
const TreatmentCard = ({ item, onClick }: any) => {
    const borderColors: any = {
        'NOT_STARTED': 'border-l-purple-500',
        'IN_PROGRESS': 'border-l-blue-500',
        'COMPLETED': 'border-l-emerald-500',
        'WAITING_LAB': 'border-l-amber-500'
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onClick}
            className={`p-4 bg-white rounded-xl shadow-sm border border-gray-100 mb-3 cursor-pointer hover:shadow-md transition-all border-l-4 ${borderColors[item.status]}`}
        >
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                        {item.patient?.name?.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold text-slate-800 truncate w-32">{item.patient?.name}</p>
                        <p className="text-[10px] text-gray-400">Desde {new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            <div className="mt-2">
                <p className="text-sm font-bold text-slate-700 line-clamp-2">{item.procedure_name}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-medium">
                        Dente {item.region || 'Geral'}
                    </span>
                    {item.face && (
                        <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-medium">
                            {item.face}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// VISTA LISTA (Tabela)
const TreatmentTable = ({ items, onOpen }: any) => (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                <tr>
                    <th className="p-4 pl-6">Paciente</th>
                    <th className="p-4">Procedimento</th>
                    <th className="p-4">Região/Face</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Data Venda</th>
                    <th className="p-4 text-right">Ação</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {items.map((item: any) => (
                    <tr key={item.id} className="hover:bg-indigo-50/30 transition-colors group">
                        <td className="p-4 pl-6 font-bold text-slate-700">{item.patient?.name}</td>
                        <td className="p-4 text-slate-600">{item.procedure_name}</td>
                        <td className="p-4 text-slate-500 text-xs">
                            <span className="bg-gray-100 px-2 py-1 rounded">
                                {item.region || '-'} {item.face ? `(${item.face})` : ''}
                            </span>
                        </td>
                        <td className="p-4"><StatusBadge status={item.status} /></td>
                        <td className="p-4 text-gray-400 text-xs">{new Date(item.created_at).toLocaleDateString()}</td>
                        <td className="p-4 text-right">
                            <button onClick={() => onOpen(item.patient_id)} className="text-indigo-600 hover:text-indigo-800 font-bold text-xs flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                Prontuário <ChevronRight size={14} />
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

// --- PÁGINA PRINCIPAL ---
export default function ClinicalDashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<any[]>([]);

    // Controles de Filtro
    const [viewMode, setViewMode] = useState<'KANBAN' | 'LIST'>('KANBAN');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProfessional, setSelectedProfessional] = useState('ALL');
    const [selectedProcedure, setSelectedProcedure] = useState('ALL');

    // Opções de Filtro (Derivadas)
    const [filterOptions, setFilterOptions] = useState({
        professionals: [] as string[],
        patients: [] as string[],
        procedures: [] as string[]
    });

    // Busca Dados
    const fetchProduction = async () => {
        if (!user?.clinic_id) return;
        try {
            const { data, error } = await supabase
                .from('treatment_items')
                .select(`
                    *, 
                    patient:patients(id, name, profile_photo_url),
                    budget:budgets!inner(
                        id, 
                        doctor:users!doctor_id(name)
                    )
                `)
                .eq('clinic_id', user.clinic_id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const fetchedItems = data || [];

            // Extrair opções únicas para filtros
            const uniqueProfs = Array.from(new Set(fetchedItems.map((i: any) => i.budget?.doctor?.name).filter(Boolean)));
            const uniquePatients = Array.from(new Set(fetchedItems.map((i: any) => i.patient?.name).filter(Boolean)));
            const uniqueProcs = Array.from(new Set(fetchedItems.map((i: any) => i.procedure_name).filter(Boolean)));

            setFilterOptions({
                professionals: uniqueProfs,
                patients: uniquePatients,
                procedures: uniqueProcs
            });

            setItems(fetchedItems);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProduction();
        const channel = supabase.channel('clinical_dash')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'treatment_items', filter: `clinic_id=eq.${user?.clinic_id}` }, fetchProduction)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [user?.clinic_id]);

    // Lógica de Filtragem
    const filteredItems = items.filter(item => {
        const matchSearch = item.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchProf = selectedProfessional === 'ALL' || item.budget?.doctor?.name === selectedProfessional;
        const matchProc = selectedProcedure === 'ALL' || item.procedure_name === selectedProcedure;

        return matchSearch && matchProf && matchProc;
    });

    const todoItems = filteredItems.filter(i => i.status === 'NOT_STARTED');
    const inProgressItems = filteredItems.filter(i => i.status === 'IN_PROGRESS' || i.status === 'WAITING_LAB');
    const completedItems = filteredItems.filter(i => i.status === 'COMPLETED');

    // Totais
    const totalBacklog = todoItems.length + inProgressItems.length;
    const totalValueBacklog = [...todoItems, ...inProgressItems].reduce((acc, i) => acc + (Number(i.total_value) || 0), 0);

    const handleOpenChart = (patientId: string) => navigate(`/patients/${patientId}/clinical`);

    return (
        <div className="h-screen bg-gray-50 flex flex-col font-sans overflow-hidden">

            {/* Header Avançado */}
            <header className="bg-white border-b border-gray-200 px-8 py-5 shrink-0 shadow-sm z-20">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <Activity className="text-indigo-600" />
                            Gestão de Produção
                        </h1>
                        <p className="text-sm text-gray-500">Monitoramento de fluxo clínico em tempo real</p>
                    </div>

                    <div className="flex items-center gap-3 bg-gray-100 p-1 rounded-xl self-start md:self-auto">
                        <button
                            onClick={() => setViewMode('KANBAN')}
                            className={`p-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${viewMode === 'KANBAN' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <LayoutGrid size={16} /> Kanban
                        </button>
                        <button
                            onClick={() => setViewMode('LIST')}
                            className={`p-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-all ${viewMode === 'LIST' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <ListIcon size={16} /> Lista
                        </button>
                    </div>
                </div>

                {/* Barra de Ferramentas / Filtros */}
                <div className="mt-6 flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
                    <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">

                        {/* Busca Textual (Paciente) */}
                        <div className="relative min-w-[250px]">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Buscar Paciente..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                            />
                        </div>

                        {/* Filtro Profissional */}

                        {/* Filtro Profissional */}
                        <div className="relative min-w-[200px]">
                            <User className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <select
                                value={selectedProfessional}
                                onChange={e => setSelectedProfessional(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-700 appearance-none font-medium"
                            >
                                <option value="ALL">Todos Profissionais</option>
                                {filterOptions.professionals.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>



                        {/* Filtro Procedimento */}
                        <div className="relative min-w-[200px]">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <select
                                value={selectedProcedure}
                                onChange={e => setSelectedProcedure(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-700 appearance-none font-medium"
                            >
                                <option value="ALL">Todos Procedimentos</option>
                                {filterOptions.procedures.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>

                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right hidden md:block">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Itens na Fila</p>
                            <p className="text-xl font-bold text-slate-800">{totalBacklog}</p>
                        </div>
                        <div className="w-px h-8 bg-gray-200 hidden md:block"></div>
                        <div className="text-right hidden md:block">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Valor em Produção</p>
                            <p className="text-xl font-bold text-indigo-600">{formatCurrency(totalValueBacklog)}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Conteúdo Dinâmico */}
            <div className="flex-1 overflow-hidden p-6 relative">
                <AnimatePresence mode="wait">
                    {viewMode === 'KANBAN' ? (
                        <motion.div
                            key="kanban"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="flex gap-6 h-full min-w-[1000px] overflow-x-auto pb-4"
                        >
                            {/* Coluna A FAZER */}
                            <div className="flex-1 flex flex-col bg-gray-100 rounded-2xl border border-gray-200 h-full min-w-[300px]">
                                <div className="p-4 border-b border-gray-200 bg-white rounded-t-2xl flex justify-between items-center sticky top-0 z-10">
                                    <span className="font-bold text-slate-700 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500"></div> A Fazer</span>
                                    <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-full">{todoItems.length}</span>
                                </div>
                                <div className="p-3 flex-1 overflow-y-auto space-y-2">
                                    {todoItems.map(item => <TreatmentCard key={item.id} item={item} onClick={() => handleOpenChart(item.patient_id)} />)}
                                </div>
                            </div>

                            {/* Coluna EM ANDAMENTO */}
                            <div className="flex-1 flex flex-col bg-gray-100 rounded-2xl border border-gray-200 h-full min-w-[300px]">
                                <div className="p-4 border-b border-gray-200 bg-white rounded-t-2xl flex justify-between items-center sticky top-0 z-10">
                                    <span className="font-bold text-slate-700 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div> Em Andamento</span>
                                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">{inProgressItems.length}</span>
                                </div>
                                <div className="p-3 flex-1 overflow-y-auto space-y-2">
                                    {inProgressItems.map(item => <TreatmentCard key={item.id} item={item} onClick={() => handleOpenChart(item.patient_id)} />)}
                                </div>
                            </div>

                            {/* Coluna CONCLUÍDOS */}
                            <div className="flex-1 flex flex-col bg-gray-100 rounded-2xl border border-gray-200 h-full min-w-[300px]">
                                <div className="p-4 border-b border-gray-200 bg-white rounded-t-2xl flex justify-between items-center sticky top-0 z-10">
                                    <span className="font-bold text-slate-700 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Finalizados</span>
                                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">{completedItems.length}</span>
                                </div>
                                <div className="p-3 flex-1 overflow-y-auto space-y-2">
                                    {completedItems.map(item => <TreatmentCard key={item.id} item={item} onClick={() => handleOpenChart(item.patient_id)} />)}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="h-full overflow-y-auto"
                        >
                            <TreatmentTable items={filteredItems} onOpen={handleOpenChart} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
