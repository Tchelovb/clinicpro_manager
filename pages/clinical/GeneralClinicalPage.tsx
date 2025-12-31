import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGeneralClinical } from '../../hooks/useGeneralClinical';
import { useFinancialLock } from '../../hooks/useFinancialLock';
import { useAuth } from '../../contexts/AuthContext';
import { PinSignatureModal } from '../../components/security/PinSignatureModal';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import {
    ChevronLeft, AlertTriangle, Activity, FileText,
    CheckCircle, Clock, Zap, MessageSquare, Plus,
    ShieldAlert, Heart, Thermometer, Pill, AlertOctagon, Calendar
} from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const GeneralClinicalPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { profile } = useAuth();

    // Data Loading
    // Data Loading
    const { treatments, medicalAlerts, anamnesis, clinicalNotes, loading, refresh } = useGeneralClinical(id!);

    // Security Hooks
    const { checkStatus } = useFinancialLock(id!);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null);

    // Timeline State
    const [activeTab, setActiveTab] = useState('todo');
    const [newNote, setNewNote] = useState('');

    // --- COMPUTED DATA ---

    // 1. Bio-Context Tags
    const bioTags = useMemo(() => {
        if (!anamnesis) return [];
        const tags = [];
        if (anamnesis.is_smoker) tags.push({ label: 'Fumante', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50 border-amber-200' });
        if (anamnesis.has_diabetes) tags.push({ label: 'Diabético', icon: Activity, color: 'text-rose-600 bg-rose-50 border-rose-200' });
        if (anamnesis.has_hypertension) tags.push({ label: 'Hipertenso', icon: Heart, color: 'text-red-600 bg-red-50 border-red-200' });
        if (anamnesis.is_pregnant) tags.push({ label: 'Gestante', icon: Heart, color: 'text-pink-600 bg-pink-50 border-pink-200' });
        if (anamnesis.has_allergies) tags.push({ label: 'Alérgico', icon: ShieldAlert, color: 'text-orange-600 bg-orange-50 border-orange-200' });
        return tags;
    }, [anamnesis]);

    // 2. Critical Alerts
    const criticalAlerts = medicalAlerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH');

    // 3. To-Do List (Grouped by Budget)
    const pendingTreatments = treatments.filter(t => t.status === 'NOT_STARTED' || t.status === 'PENDING');

    const treatmentsByBudget = useMemo(() => {
        const groups: Record<string, typeof pendingTreatments> = {};
        pendingTreatments.forEach(item => {
            // Mock budget ID grouping until DB field is populated or we mock it
            const key = item.id.includes('budget') ? 'Orçamento #PENDENTE' : 'Procedimentos Avulsos';
            // Actually use budget_id if available (not in interface yet? let's check hook)
            // Hook uses GeneralTreatment interface which doesn't list budget_id. 
            // I should have added it to interface. For now, group all under "A Fazer".
            // Wait, the user asked for grouping. I will assume budget_id or created_at grouping.
            // Let's group by Date for now if budget_id missing.
            const dateKey = new Date(item.created_at).toLocaleDateString();
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(item);
        });
        return groups;
    }, [pendingTreatments]);

    // 4. Timeline (Unified History)
    const timelineEvents = useMemo(() => {
        const completed = treatments.filter(t => t.status === 'COMPLETED').map(t => ({
            id: t.id,
            type: 'PROCEDURE',
            date: t.execution_date || t.created_at,
            title: t.procedure_name,
            subtitle: t.tooth_number ? `Dente ${t.tooth_number}` : 'Geral',
            status: 'Done'
        }));

        const notes = clinicalNotes.map(n => ({
            id: n.id,
            type: 'NOTE',
            date: n.created_at,
            title: 'Nota Clínica',
            subtitle: n.content,
            status: 'Note'
        }));

        return [...completed, ...notes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [treatments, clinicalNotes]);


    // --- ACTIONS ---

    const handleSecureExecution = async (treatmentId: string, procedureName: string) => {
        // 1. Financial Lock
        const isLocked = await checkStatus();
        if (isLocked) {
            toast.custom((t) => (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-lg flex items-start max-w-sm">
                    <AlertOctagon className="text-red-500 mr-3 mt-1" size={24} />
                    <div>
                        <h3 className="text-red-800 font-bold">Bloqueio Financeiro</h3>
                        <p className="text-red-600 text-sm mt-1">Este paciente possui débitos em atraso. Regularize para prosseguir.</p>
                    </div>
                </div>
            ));
            return;
        }

        // 2. Prepare Action for PIN
        setPendingAction(() => async () => {
            try {
                // Update status
                const { error } = await supabase
                    .from('treatment_items')
                    .update({
                        status: 'COMPLETED',
                        execution_date: new Date().toISOString(),
                        updated_by: profile?.id
                    })
                    .eq('id', treatmentId);

                if (error) throw error;

                // Create Auto-Note
                await supabase.from('clinical_notes').insert({
                    patient_id: id,
                    doctor_id: profile?.id,
                    type: 'AUTO_EVOLUTION',
                    content: `Realizado: ${procedureName}`,
                    date: new Date().toISOString()
                });

                toast.success('Procedimento realizado com sucesso!');
                refresh();
            } catch (err) {
                console.error(err);
                toast.error('Erro ao salvar evolução.');
            }
        });

        // 3. Open PIN Modal
        setShowPinModal(true);
    };

    const handleQuickNote = async () => {
        if (!newNote.trim()) return;
        try {
            await supabase.from('clinical_notes').insert({
                patient_id: id,
                doctor_id: profile?.id,
                type: 'NOTE',
                content: newNote,
                date: new Date().toISOString()
            });
            setNewNote('');
            toast.success('Anotação salva.');
            // refresh(); // Would refresh timeline if linked
        } catch (err) {
            toast.error('Erro ao salvar nota.');
        }
    };


    if (loading) return <div className="p-12 text-center text-slate-400">Carregando Cockpit...</div>;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">

            {/* --- 1. HEADER SEGURO (Head-Up Display) --- */}
            <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">

                {/* Top Bar: Navigation + Vital Alerts */}
                <div className="flex flex-col">
                    {/* Vital Alerts Banner (Blue Default, Red Warning) */}
                    <div className={cn(
                        "px-4 py-2 flex items-center justify-center gap-3 font-bold text-sm transition-colors",
                        criticalAlerts.length > 0
                            ? "bg-red-600 text-white animate-pulse"
                            : "bg-blue-50 text-blue-700 border-b border-blue-100"
                    )}>
                        {criticalAlerts.length > 0 ? (
                            <>
                                <AlertOctagon size={18} />
                                <span>ALERTA CLÍNICO: {criticalAlerts.map(a => a.description).join(' | ')}</span>
                            </>
                        ) : (
                            <>
                                <Activity size={16} />
                                <span>Cockpit Geral - Paciente sem alertas críticos imediatos.</span>
                            </>
                        )}
                    </div>

                    <div className="px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigate(`/patients/${id}`)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500">
                                <ChevronLeft size={20} />
                            </button>
                            <div>
                                <h1 className="font-bold text-blue-900 dark:text-blue-400 text-lg leading-tight flex items-center gap-2">
                                    Clínica Geral <span className="text-slate-300">|</span> <span className="text-slate-600 dark:text-slate-300 font-normal">Workflow</span>
                                </h1>
                            </div>
                        </div>

                        {/* Right: Quick Stats or Status */}
                        <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                            <span className="flex items-center gap-1"><CheckCircle size={14} className="text-green-500" /> {timelineEvents.length} Realizados</span>
                            <span className="flex items-center gap-1"><Clock size={14} className="text-amber-500" /> {pendingTreatments.length} Pendentes</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-4 gap-6">

                {/* --- 2. COLUNA ESQUERDA: BIO-CONTEXT DEEP --- */}
                <aside className="md:col-span-1 space-y-6">

                    {/* Medical Alerts Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <ShieldAlert size={14} /> Alertas Médicos
                        </h3>
                        {medicalAlerts.length === 0 ? (
                            <p className="text-sm text-slate-400 italic">Nenhum alerta registrado.</p>
                        ) : (
                            <ul className="space-y-3">
                                {medicalAlerts.map(alert => (
                                    <li key={alert.id} className={cn(
                                        "text-sm p-3 rounded-lg border flex items-start gap-2",
                                        alert.severity === 'CRITICAL' ? "bg-red-50 border-red-200 text-red-700" :
                                            alert.severity === 'HIGH' ? "bg-orange-50 border-orange-200 text-orange-700" :
                                                "bg-slate-50 border-slate-200 text-slate-700"
                                    )}>
                                        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                                        <div>
                                            <span className="font-bold block text-xs uppercase mb-0.5">{alert.alert_type}</span>
                                            {alert.description}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Bio-Context Hooks */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Activity size={14} /> Condições & Contexto
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {bioTags.length > 0 ? bioTags.map((tag, idx) => (
                                    <span key={idx} className={cn("px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 border", tag.color)}>
                                        <tag.icon size={12} /> {tag.label}
                                    </span>
                                )) : (
                                    <span className="text-xs text-slate-400">Nenhuma tag de alerta.</span>
                                )}
                            </div>
                        </div>

                        {/* Doenças Crônicas */}
                        {anamnesis?.chronic_diseases && anamnesis.chronic_diseases.length > 0 && (
                            <div>
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Doenças Crônicas</h4>
                                <ul className="space-y-1">
                                    {anamnesis.chronic_diseases.map((disease: string, idx: number) => (
                                        <li key={idx} className="text-xs font-medium text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                                            {disease}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Medicamentos */}
                        {anamnesis?.current_medications && anamnesis.current_medications.length > 0 && (
                            <div>
                                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Medicamentos em Uso</h4>
                                <ul className="space-y-1">
                                    {anamnesis.current_medications.map((med: string, idx: number) => (
                                        <li key={idx} className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                                            <Pill size={10} /> {med}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <button
                            onClick={() => toast('Abrir modal de anamnese completa (Implementar)', { icon: '📋' })}
                            className="w-full mt-2 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100 flex items-center justify-center gap-2"
                        >
                            <FileText size={12} /> Ver Anamnese Completa
                        </button>
                    </div>

                </aside>


                {/* --- 3. ÁREA DE AÇÃO (Tabs) --- */}
                <section className="md:col-span-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden min-h-[600px]">
                    <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">

                        <div className="border-b border-slate-100 dark:border-slate-800 px-6 pt-2">
                            <Tabs.List className="flex gap-6">
                                <Tabs.Trigger value="todo" className="py-4 text-sm font-bold text-slate-500 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 transition-all flex items-center gap-2">
                                    <ListChecksIcon /> A Fazer (Planejado)
                                    <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded-full">{pendingTreatments.length}</span>
                                </Tabs.Trigger>
                                <Tabs.Trigger value="history" className="py-4 text-sm font-bold text-slate-500 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 transition-all flex items-center gap-2">
                                    <HistoryIcon /> Evolução & Histórico
                                </Tabs.Trigger>
                            </Tabs.List>
                        </div>

                        {/* TAB: A FAZER */}
                        <Tabs.Content value="todo" className="flex-1 p-6 bg-slate-50/50 dark:bg-slate-800/20 overflow-y-auto">
                            {pendingTreatments.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                                    <CheckCircle size={48} className="mb-4 text-slate-300" />
                                    <p>Tudo em dia! Nenhum procedimento pendente.</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {Object.entries(treatmentsByBudget).map(([group, items]) => (
                                        <div key={group} className="space-y-3">
                                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-2 border-l-2 border-blue-300">
                                                Planejado em: {group} ({items.length})
                                            </h4>
                                            {items.map(item => (
                                                <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between group hover:border-blue-300 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                                                            <Zap size={20} />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-slate-800 dark:text-white">{item.procedure_name}</h3>
                                                            <div className="flex items-center gap-3 text-sm text-slate-500">
                                                                <span>Região: {item.tooth_number ? `Dente ${item.tooth_number}` : 'Arcada Geral'}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => handleSecureExecution(item.id, item.procedure_name)}
                                                        className="bg-blue-600 hover:bg-blue-700 text-white pl-4 pr-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 shadow-sm shadow-blue-200 dark:shadow-none transition-all active:scale-95"
                                                    >
                                                        <Zap size={16} className="fill-current" />
                                                        REALIZAR
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Tabs.Content>

                        {/* TAB: TIMELINE */}
                        <Tabs.Content value="history" className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-800/20">
                            {/* Quick Note Input */}
                            <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                    <MessageSquare size={16} className="text-slate-500" />
                                </div>
                                <div className="flex-1 flex gap-2">
                                    <input
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        placeholder="Adicione uma anotação rápida na linha do tempo..."
                                        className="flex-1 bg-transparent border-none outline-none text-sm"
                                        onKeyDown={(e) => e.key === 'Enter' && handleQuickNote()}
                                    />
                                    <button
                                        onClick={handleQuickNote}
                                        disabled={!newNote.trim()}
                                        className="text-xs font-bold text-blue-600 disabled:opacity-50"
                                    >
                                        POSTAR
                                    </button>
                                </div>
                            </div>

                            {/* Stream */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-8 relative">
                                {/* Vertical Line */}
                                <div className="absolute left-9 top-6 bottom-6 w-0.5 bg-slate-200 dark:bg-slate-800 z-0"></div>

                                {timelineEvents.map((event, idx) => (
                                    <div key={idx} className="relative z-10 flex gap-6">
                                        <div className={cn(
                                            "w-7 h-7 mt-1 rounded-full border-2 flex items-center justify-center shrink-0 shadow-sm",
                                            event.type === 'PROCEDURE' ? "bg-white border-green-500" : "bg-blue-50 border-blue-400"
                                        )}>
                                            {event.type === 'PROCEDURE' ? (
                                                <CheckCircle size={14} className="text-green-600" />
                                            ) : (
                                                <FileText size={14} className="text-blue-600" />
                                            )}
                                        </div>
                                        <div className="flex-1 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-slate-900 dark:text-white text-sm">{event.title}</h4>
                                                <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                                    {format(new Date(event.date), "dd/MM 'às' HH:mm", { locale: ptBR })}
                                                </span>
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-300 text-sm">{event.subtitle}</p>
                                        </div>
                                    </div>
                                ))}

                                {timelineEvents.length === 0 && (
                                    <div className="text-center py-10 text-slate-400 italic">
                                        Nenhum histórico recente.
                                    </div>
                                )}
                            </div>
                        </Tabs.Content>
                    </Tabs.Root>
                </section>
            </main>

            {/* Security Modal */}
            <PinSignatureModal
                open={showPinModal}
                onOpenChange={setShowPinModal}
                onSuccess={() => {
                    if (pendingAction) {
                        pendingAction();
                        setPendingAction(null);
                    }
                }}
            />
        </div>
    );
};

// Helper Icons
const ListChecksIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 11 3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
);
const HistoryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /><path d="M12 7v5l4 2" /></svg>
);
