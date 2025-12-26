import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useAttendanceNotifications } from '../hooks/useAttendanceNotifications';
import {
    UserCheck, Stethoscope, DollarSign, Clock, FileText, ChevronRight,
    Loader2, Phone, AlertCircle, CheckCircle2, Play, X
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../components/ui/sheet';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface QueueItem {
    id: string;
    appointment_id: string;
    patient_id: string;
    patient_name: string;
    patient_phone: string;
    doctor_id: string;
    doctor_name: string;
    type: 'ORCAMENTO' | 'CLINICA';
    status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED';
    arrived_at: string;
    called_at?: string;
    completed_at?: string;
    risk_level?: 'A' | 'B' | 'C' | 'D';
    estimated_value?: number;
    notes?: string;
}

const AttendanceQueue: React.FC = () => {
    const { profile } = useAuth();
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);
    const [sheetOpen, setSheetOpen] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Enable real-time notifications
    useAttendanceNotifications(profile?.clinic_id, profile?.id);

    useEffect(() => {
        loadQueue();

        // Auto-refresh every 30 seconds
        const interval = autoRefresh ? setInterval(loadQueue, 30000) : null;
        return () => { if (interval) clearInterval(interval); };
    }, [profile?.clinic_id, autoRefresh]);

    const loadQueue = async () => {
        if (!profile?.clinic_id) return;

        try {
            // Get all appointments with status ARRIVED or IN_PROGRESS for today
            const today = new Date().toISOString().split('T')[0];

            const { data: appointments, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    patients!appointments_patient_id_fkey(name, phone),
                    users!appointments_doctor_id_fkey(name)
                `)
                .eq('clinic_id', profile.clinic_id)
                .gte('date', `${today}T00:00:00`)
                .lte('date', `${today}T23:59:59`)
                .or('status.eq.ARRIVED,status.eq.IN_PROGRESS')
                .order('date');

            if (error) throw error;

            // Transform to queue items
            const queueItems: QueueItem[] = (appointments || []).map((apt: any) => ({
                id: apt.id,
                appointment_id: apt.id,
                patient_id: apt.patient_id,
                patient_name: apt.patients?.name || 'Paciente',
                patient_phone: apt.patients?.phone || '',
                doctor_id: apt.doctor_id,
                doctor_name: apt.users?.name || 'Profissional',
                type: apt.type === 'EVALUATION' ? 'ORCAMENTO' : 'CLINICA',
                status: apt.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'WAITING',
                arrived_at: apt.date,
                risk_level: 'B' // Would come from credit_profiles table
            }));

            setQueue(queueItems);
        } catch (error) {
            console.error('Error loading queue:', error);
            toast.error('Erro ao carregar fila de atendimento');
        } finally {
            setLoading(false);
        }
    };

    const handleCallPatient = async (item: QueueItem) => {
        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'IN_PROGRESS' })
                .eq('id', item.appointment_id);

            if (error) throw error;

            setQueue(prev => prev.map(q =>
                q.id === item.id ? { ...q, status: 'IN_PROGRESS', called_at: new Date().toISOString() } : q
            ));

            toast.success(`${item.patient_name} foi chamado!`, {
                icon: '📢',
                duration: 3000
            });
        } catch (error) {
            console.error('Error calling patient:', error);
            toast.error('Erro ao chamar paciente');
        }
    };

    const handleCompleteAttendance = async (item: QueueItem) => {
        try {
            const { error } = await supabase
                .from('appointments')
                .update({ status: 'COMPLETED' })
                .eq('id', item.appointment_id);

            if (error) throw error;

            setQueue(prev => prev.filter(q => q.id !== item.id));

            toast.success('Atendimento finalizado!', {
                icon: '✅',
                duration: 3000
            });
        } catch (error) {
            console.error('Error completing attendance:', error);
            toast.error('Erro ao finalizar atendimento');
        }
    };

    const getWaitingTime = (arrivedAt: string) => {
        return formatDistanceToNow(new Date(arrivedAt), {
            addSuffix: false,
            locale: ptBR
        });
    };

    const budgetQueue = queue.filter(q => q.type === 'ORCAMENTO');
    const clinicalQueue = queue.filter(q => q.type === 'CLINICA');

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 p-6 gap-6">
            {/* ============================================ */}
            {/* HEADER ESTATÍSTICO */}
            {/* ============================================ */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <UserCheck className="text-green-600" size={28} />
                        Fila de Atendimento
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Pacientes que chegaram hoje • Atualização automática
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="rounded"
                        />
                        Auto-refresh
                    </label>
                    <button
                        onClick={loadQueue}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Loader2 size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-blue-100 dark:border-blue-900 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Fila de Orçamentos</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">
                            {budgetQueue.length} {budgetQueue.length === 1 ? 'Paciente' : 'Pacientes'}
                        </p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-purple-100 dark:border-purple-900 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                        <Stethoscope size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Em Atendimento Clínico</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">
                            {clinicalQueue.filter(q => q.status === 'IN_PROGRESS').length} {clinicalQueue.filter(q => q.status === 'IN_PROGRESS').length === 1 ? 'Paciente' : 'Pacientes'}
                        </p>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-green-100 dark:border-green-900 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Total na Fila</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">
                            {queue.length} {queue.length === 1 ? 'Paciente' : 'Pacientes'}
                        </p>
                    </div>
                </div>
            </div>

            {/* ============================================ */}
            {/* DUAL COLUMN LAYOUT - JIRA STYLE */}
            {/* ============================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">

                {/* COLUNA: ORÇAMENTISTA (FOCO EM VENDA) */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-t-2xl flex justify-between items-center">
                        <h2 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <DollarSign size={18} className="text-green-600 dark:text-green-400" />
                            Lista de Orçamentos (Prioridade)
                        </h2>
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full font-black">
                            HIGH TICKET
                        </span>
                    </div>

                    <div className="p-4 space-y-3 overflow-y-auto flex-1">
                        {budgetQueue.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-600">
                                <AlertCircle size={48} className="mb-4 opacity-50" />
                                <p className="text-sm font-medium">Nenhum orçamento na fila</p>
                            </div>
                        ) : (
                            budgetQueue.map(item => (
                                <div
                                    key={item.id}
                                    className={`group p-4 border rounded-xl transition-all cursor-pointer ${item.status === 'IN_PROGRESS'
                                        ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 shadow-md'
                                        : 'border-slate-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md bg-white dark:bg-slate-800'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-slate-900 dark:text-white">{item.patient_name}</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                                                <Clock size={12} />
                                                Espera: <span className="text-orange-600 dark:text-orange-400 font-bold">
                                                    {getWaitingTime(item.arrived_at)}
                                                </span>
                                            </p>
                                            {item.risk_level && (
                                                <span className={`inline-block mt-2 text-xs font-bold px-2 py-0.5 rounded ${item.risk_level === 'A'
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                    : item.risk_level === 'B'
                                                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                                        : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                                                    }`}>
                                                    Risco {item.risk_level}
                                                </span>
                                            )}
                                        </div>
                                        {item.status === 'IN_PROGRESS' && (
                                            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                                <Play size={16} className="animate-pulse" />
                                                <span className="text-xs font-bold">EM ATENDIMENTO</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Ações Rápidas */}
                                    <div className="mt-4 flex gap-2">
                                        <button
                                            onClick={() => { setSelectedItem(item); setSheetOpen(true); }}
                                            className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-600 dark:text-slate-300 flex items-center gap-1 transition-colors"
                                        >
                                            <FileText size={12} /> Abrir Ficha
                                        </button>
                                        {item.status === 'WAITING' ? (
                                            <button
                                                onClick={() => handleCallPatient(item)}
                                                className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-1 transition-colors"
                                            >
                                                <UserCheck size={12} /> Chamar Agora
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleCompleteAttendance(item)}
                                                className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1 transition-colors"
                                            >
                                                <CheckCircle2 size={12} /> Finalizar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* COLUNA: CLÍNICA (FOCO EM EXECUÇÃO) */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-t-2xl">
                        <h2 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <Stethoscope size={18} className="text-purple-600 dark:text-purple-400" />
                            Lista de Atendimento Clínico
                        </h2>
                    </div>

                    <div className="p-4 space-y-3 overflow-y-auto flex-1">
                        {clinicalQueue.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-600">
                                <AlertCircle size={48} className="mb-4 opacity-50" />
                                <p className="text-sm font-medium">Nenhum paciente clínico na fila</p>
                            </div>
                        ) : (
                            clinicalQueue.map(item => (
                                <div
                                    key={item.id}
                                    className={`p-4 rounded-xl border transition-all ${item.status === 'IN_PROGRESS'
                                        ? 'border-l-4 border-l-purple-500 dark:border-l-purple-400 bg-purple-50/30 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800'
                                        : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800'
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-slate-900 dark:text-white">{item.patient_name}</h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                {item.doctor_name}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                                                <Clock size={12} />
                                                Espera: <span className="text-orange-600 dark:text-orange-400 font-bold">
                                                    {getWaitingTime(item.arrived_at)}
                                                </span>
                                            </p>
                                        </div>
                                        {item.status === 'IN_PROGRESS' && (
                                            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                                                EM ATENDIMENTO
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-3 flex gap-2">
                                        {item.status === 'WAITING' ? (
                                            <button
                                                onClick={() => handleCallPatient(item)}
                                                className="text-xs font-bold text-purple-700 dark:text-purple-300 underline hover:no-underline"
                                            >
                                                Chamar Paciente
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => { setSelectedItem(item); setSheetOpen(true); }}
                                                    className="text-xs font-bold text-purple-700 dark:text-purple-300 underline hover:no-underline"
                                                >
                                                    Acessar Prontuário
                                                </button>
                                                <button
                                                    onClick={() => handleCompleteAttendance(item)}
                                                    className="text-xs font-bold text-green-700 dark:text-green-300 underline hover:no-underline"
                                                >
                                                    Finalizar Atendimento
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>

            {/* ============================================ */}
            {/* DETAIL SHEET */}
            {/* ============================================ */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent className="w-full sm:max-w-lg overflow-auto">
                    <SheetHeader>
                        <SheetTitle>Detalhes do Paciente</SheetTitle>
                    </SheetHeader>
                    {selectedItem && (
                        <div className="mt-6 space-y-6">
                            <div>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Paciente</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">{selectedItem.patient_name}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2 mt-1">
                                    <Phone size={14} />
                                    {selectedItem.patient_phone}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Tipo de Atendimento</p>
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${selectedItem.type === 'ORCAMENTO'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                    : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                    }`}>
                                    {selectedItem.type === 'ORCAMENTO' ? 'Orçamento/Avaliação' : 'Atendimento Clínico'}
                                </span>
                            </div>

                            <div>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Profissional Responsável</p>
                                <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedItem.doctor_name}</p>
                            </div>

                            <div>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Tempo de Espera</p>
                                <p className="text-sm font-medium text-slate-900 dark:text-white">
                                    {getWaitingTime(selectedItem.arrived_at)}
                                </p>
                            </div>

                            {selectedItem.notes && (
                                <div>
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Observações</p>
                                    <p className="text-sm text-slate-700 dark:text-slate-300">{selectedItem.notes}</p>
                                </div>
                            )}

                            <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                                {selectedItem.status === 'WAITING' ? (
                                    <button
                                        onClick={() => { handleCallPatient(selectedItem); setSheetOpen(false); }}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-sm"
                                    >
                                        <UserCheck size={16} />
                                        Chamar Paciente
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => { handleCompleteAttendance(selectedItem); setSheetOpen(false); }}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-sm"
                                    >
                                        <CheckCircle2 size={16} />
                                        Finalizar Atendimento
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* RODAPÉ A4: PARA IMPRESSÃO DE MAPA DIÁRIO */}
            <div className="hidden print:block">
                <h1 className="text-xl font-bold">Mapa de Fluxo de Pacientes - {new Date().toLocaleDateString('pt-BR')}</h1>
                {/* Tabela de auditoria para o Dr Marcelo */}
            </div>
        </div>
    );
};

export default AttendanceQueue;
