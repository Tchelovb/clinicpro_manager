import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
    ArrowLeft, Edit2, Trash2, Phone, Mail, Instagram,
    Briefcase, Star, Calendar, FileText, Image, Activity,
    CreditCard, Stethoscope, AlertTriangle, Smile, Sparkles,
    User, DollarSign, TrendingUp, Heart, Clock, CheckCircle,
    XCircle, Loader2
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";
import { Drawer, DrawerContent } from "./ui/drawer";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { PatientInstallments } from "./PatientInstallments";
import { OrthoTab } from "./ortho/OrthoTab";
import toast from "react-hot-toast";
import BudgetForm from "./BudgetForm";
import PatientForm from "./PatientForm";

// Patient Score Badge (VIP Status)
const ScoreBadge = ({ score }: { score?: string }) => {
    const badges = {
        DIAMOND: { bg: 'bg-gradient-to-r from-blue-600 to-purple-600', text: 'text-white', label: '💎 DIAMOND' },
        GOLD: { bg: 'bg-gradient-to-r from-yellow-600 to-amber-600', text: 'text-white', label: '⭐ GOLD' },
        STANDARD: { bg: 'bg-slate-700 dark:bg-slate-600', text: 'text-slate-300 dark:text-slate-200', label: 'STANDARD' }
    };
    const badge = badges[score as keyof typeof badges] || badges.STANDARD;
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text} shadow-lg`}>
            {badge.label}
        </span>
    );
};

interface PatientDetailProps {
    patientId?: string;
    open?: boolean;
    onClose?: () => void;
    onEdit?: (patient: any) => void;
    onDelete?: () => void;
    mode?: 'view' | 'create' | 'edit';
    initialData?: any;
    onSuccess?: (newId?: string) => void;
}

export const PatientDetailSheet: React.FC<PatientDetailProps> = ({
    patientId,
    open = false,
    onClose,
    onEdit,
    onDelete,
    mode = 'view',
    initialData,
    onSuccess
}) => {
    console.log("%c ✅ ESTE É O ARQUIVO NOVO: PatientDetail.tsx", "background: green; color: white; font-size: 20px");

    const { id: paramId } = useParams<{ id: string }>();
    // PRIORITIZE PROP (Flash Fix): Immediate use of prop if available
    const initialId = patientId || paramId;
    const [activeId, setActiveId] = useState(initialId);
    const [activeMode, setActiveMode] = useState(mode);

    // Sync props to state when they change externally
    useEffect(() => {
        // Only update if explicit prop change to avoid overrides
        if (patientId && patientId !== activeId) setActiveId(patientId);
        if (mode && mode !== activeMode) setActiveMode(mode);
    }, [patientId, mode]);

    // If no props, fallback to URL param (but keep state source of truth)
    useEffect(() => {
        if (!patientId && paramId && paramId !== activeId) setActiveId(paramId);
    }, [paramId]);

    const id = activeId;
    const isCreateMode = activeMode === 'create';

    const navigate = useNavigate();

    const [patient, setPatient] = useState<any>(null);
    const [loading, setLoading] = useState(activeMode !== 'create');
    const [activeTab, setActiveTab] = useState('overview');

    // Scroll Diagnostic Ref
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    // Estados para workflow de orçamentos inline
    const [showBudgetForm, setShowBudgetForm] = useState(false);
    const [editingBudget, setEditingBudget] = useState<any>(null);

    // Real Data States
    const [budgets, setBudgets] = useState<any[]>([]);
    const [clinicalTreatments, setClinicalTreatments] = useState<any[]>([]);
    const [orthoTreatments, setOrthoTreatments] = useState<any[]>([]);
    const [hofTreatments, setHofTreatments] = useState<any[]>([]);
    const [insights, setInsights] = useState<any[]>([]);
    const [clinicalImages, setClinicalImages] = useState<any[]>([]);
    const [financialData, setFinancialData] = useState({
        totalApproved: 0,
        totalPaid: 0,
        balanceDue: 0
    });

    // Scroll Diagnostic Effect
    useEffect(() => {
        if (scrollContainerRef.current) {
            const { scrollHeight, clientHeight, scrollTop } = scrollContainerRef.current;
            console.log(`📏 DIAGNÓSTICO DE SCROLL:
            - Altura do Conteúdo (ScrollHeight): ${scrollHeight}px
            - Altura Visível (ClientHeight): ${clientHeight}px
            - Posição Atual (ScrollTop): ${scrollTop}px
            - DEVERIA ROLAR? ${scrollHeight > clientHeight ? 'SIM ✅' : 'NÃO ❌ (Conteúdo menor que a tela)'}
            `);
        }
    }, [patient, activeTab]);

    // Auto-focus scroll container for keyboard accessibility
    useEffect(() => {
        if (open && scrollContainerRef.current) {
            scrollContainerRef.current.focus();
        }
    }, [open]);

    useEffect(() => {
        if (open) {
            if (isCreateMode) {
                setLoading(false);
                setPatient(null);
                setActiveTab('overview');
            } else if (id) {
                loadPatientData();
            }
        }
    }, [id, open, isCreateMode]);

    const loadPatientData = async () => {
        if (!id) return;
        setLoading(true);

        try {
            // 1. FETCH PATIENT
            const { data: patientData, error: patientError } = await supabase
                .from('patients')
                .select('*')
                .eq('id', id)
                .single();

            if (patientError) throw patientError;

            if (patientData) {
                setPatient(patientData);
                setFinancialData({
                    totalApproved: patientData.total_approved || 0,
                    totalPaid: patientData.total_paid || 0,
                    balanceDue: patientData.balance_due || 0
                });
            }

            // 2. FETCH BUDGETS
            const { data: budgetsData } = await supabase
                .from('budgets')
                .select(`*, budget_items (*)`)
                .eq('patient_id', id)
                .order('created_at', { ascending: false });
            setBudgets(budgetsData || []);

            // 3. FETCH TREATMENTS BY CATEGORY
            const { data: clinicalData } = await supabase
                .from('treatment_items')
                .select('*')
                .eq('patient_id', id)
                .eq('category', 'CLINICA_GERAL')
                .order('created_at', { ascending: false });
            setClinicalTreatments(clinicalData || []);

            const { data: orthoData } = await supabase
                .from('treatment_items')
                .select('*')
                .eq('patient_id', id)
                .eq('category', 'ORTODONTIA')
                .order('created_at', { ascending: false });
            setOrthoTreatments(orthoData || []);

            const { data: hofData } = await supabase
                .from('treatment_items')
                .select('*')
                .eq('patient_id', id)
                .eq('category', 'HOF')
                .order('created_at', { ascending: false });
            setHofTreatments(hofData || []);

            // 4. FETCH AI INSIGHTS
            const { data: insightsData } = await supabase
                .from('ai_insights')
                .select('*')
                .eq('related_entity_id', id)
                .in('status', ['OPEN', 'open', 'ACTIVE', 'active'])
                .order('priority', { ascending: false });
            setInsights(insightsData || []);

            // 5. FETCH CLINICAL IMAGES
            const { data: imagesData } = await supabase
                .from('clinical_images')
                .select('*')
                .eq('patient_id', id)
                .order('created_at', { ascending: false });
            setClinicalImages(imagesData || []);

        } catch (error) {
            console.error('Error loading patient data:', error);
            toast.error('Erro ao carregar dados do paciente');
        } finally {
            setLoading(false);
        }
    };


    // Edição Inline - Visão Geral
    const [isEditingOverview, setIsEditingOverview] = useState(false);
    const [overviewData, setOverviewData] = useState<any>({});

    // Inicializar dados do formulário quando paciente mudar ou entrar em modo edição
    useEffect(() => {
        if (patient) {
            setOverviewData({
                cpf: patient.cpf,
                birth_date: patient.birth_date,
                occupation: patient.occupation,
                instagram_handle: patient.instagram_handle,
                origin: patient.origin,
                vip_notes: patient.vip_notes
            });
        }
    }, [patient]);

    const handleOverviewChange = (field: string, value: string) => {
        setOverviewData(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveOverview = async () => {
        if (!id) return;
        try {
            const { error } = await supabase
                .from('patients')
                .update(overviewData)
                .eq('id', id);

            if (error) throw error;

            toast.success('Dados atualizados com sucesso!');
            setIsEditingOverview(false);
            loadPatientData();
        } catch (error) {
            console.error(error);
            toast.error('Erro ao atualizar dados.');
        }
    };

    const handleDeletePatient = async () => {
        if (onDelete) {
            onDelete();
            return;
        }

        if (!confirm('Tem certeza que deseja excluir este paciente?')) return;

        try {
            const { error } = await supabase
                .from('patients')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('Paciente excluído com sucesso');
            if (onClose) onClose();
            else navigate('/dashboard/patients');
        } catch (error) {
            console.error('Error deleting patient:', error);
            toast.error('Erro ao excluir paciente');
        }
    };

    const handleUpdateTreatmentStatus = async (treatmentId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('treatment_items')
                .update({
                    status: newStatus,
                    ...(newStatus === 'COMPLETED' ? { execution_date: new Date().toISOString().split('T')[0] } : {}),
                    updated_at: new Date().toISOString()
                })
                .eq('id', treatmentId);

            if (error) throw error;

            toast.success('Status atualizado!');
            loadPatientData(); // Reload data
        } catch (error) {
            console.error('Error updating treatment:', error);
            toast.error('Erro ao atualizar tratamento');
        }
    };

    // Detectar se é mobile para usar Drawer ao invés de Sheet
    const isMobile = useMediaQuery('(max-width: 768px)');

    // Loading State
    if (loading) {
        const LoadingContent = (
            <div className="flex items-center justify-center h-full w-full">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-400 font-medium">Carregando dossiê...</p>
                </div>
            </div>
        );

        return isMobile ? (
            <Drawer open={open} onOpenChange={onClose}>
                <DrawerContent className="h-[100vh] overflow-hidden flex flex-col">
                    {LoadingContent}
                </DrawerContent>
            </Drawer>
        ) : (
            <Sheet open={open} onOpenChange={onClose}>
                {/* SCROLL FIX 1: Parent has NO scroll, full height */}
                <SheetContent className="w-full sm:max-w-[70vw] h-full flex flex-col p-0 gap-0 overflow-hidden border-l border-slate-200 dark:border-slate-800 shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.3)]">
                    <SheetHeader className="sr-only">
                        <SheetTitle>Carregando...</SheetTitle>
                        <SheetDescription>Aguarde enquanto carregamos os dados do paciente</SheetDescription>
                    </SheetHeader>
                    {LoadingContent}
                </SheetContent>
            </Sheet>
        );
    }

    // Not Found State
    if (!patient && !isCreateMode) {
        const NotFoundContent = (
            <div className="flex items-center justify-center h-full w-full">
                <div className="text-center">
                    <p className="text-slate-600 dark:text-slate-400">Paciente não encontrado</p>
                    <button
                        onClick={onClose}
                        className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        Voltar
                    </button>
                </div>
            </div>
        );

        return isMobile ? (
            <Drawer open={open} onOpenChange={onClose}>
                <DrawerContent className="h-[100vh] flex flex-col overflow-hidden">
                    {NotFoundContent}
                </DrawerContent>
            </Drawer>
        ) : (
            <Sheet open={open} onOpenChange={onClose}>
                {/* SCROLL FIX 1: Parent has NO scroll */}
                <SheetContent className="w-full sm:max-w-[70vw] h-full flex flex-col p-0 gap-0 overflow-hidden shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.3)]">
                    <SheetHeader className="sr-only">
                        <SheetTitle>Paciente não encontrado</SheetTitle>
                        <SheetDescription>O paciente solicitado não pode ser exibido</SheetDescription>
                    </SheetHeader>
                    {NotFoundContent}
                </SheetContent>
            </Sheet>
        );
    }

    // Conteúdo principal do prontuário
    const ProntuarioContent = (
        <>
            {/* HEADER (FIXED - OUTSIDE SCROLL) */}
            <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-6 z-50 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={onClose}
                        className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-medium">Voltar</span>
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onEdit ? onEdit(patient) : navigate(`/dashboard/patients/${id}/edit`)}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                        >
                            <Edit2 size={16} />
                            Editar
                        </button>
                        <button
                            onClick={handleDeletePatient}
                            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-lg transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                {/* ADAPTIVE HEADER CONTENT */}
                {isCreateMode ? (
                    <div className="mb-4">
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                            Novo Paciente
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            Preencha a ficha cadastral para iniciar o prontuário
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Patient Identity com Sobretítulo */}
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shrink-0">
                                {patient.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                {/* Sobretítulo: PRONTUÁRIO Nº [ID] */}
                                <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wide mb-1">
                                    Prontuário Nº {patient.id.slice(0, 8).toUpperCase()}
                                </p>
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2 truncate">
                                    {patient.name}
                                </h1>
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <ScoreBadge score={patient.patient_score} />
                                    {patient.bad_debtor && (
                                        <span className="px-3 py-1 bg-rose-100 dark:bg-rose-900/30 border border-rose-300 dark:border-rose-600 text-rose-700 dark:text-rose-300 rounded-full text-xs font-bold">
                                            ⚠️ INADIMPLENTE
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                                    <span className="flex items-center gap-1">
                                        <Phone size={12} />
                                        {patient.phone}
                                    </span>
                                    {patient.email && (
                                        <span className="flex items-center gap-1">
                                            <Mail size={12} />
                                            <span className="truncate max-w-[150px]">{patient.email}</span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Financial Indicators */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Saldo Devedor</p>
                                <p className={`text-lg font-black ${financialData.balanceDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    R$ {financialData.balanceDue.toLocaleString('pt-BR')}
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Aprovado</p>
                                <p className="text-lg font-black text-blue-600 dark:text-blue-400">
                                    R$ {financialData.totalApproved.toLocaleString('pt-BR')}
                                </p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Pago</p>
                                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                                    R$ {financialData.totalPaid.toLocaleString('pt-BR')}
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* TABS (FIXED - OUTSIDE SCROLL) */}
            <div className="flex-none z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-md">
                <div className="flex gap-1 overflow-x-auto px-6">
                    {[
                        { id: 'overview', label: 'Visão Geral', icon: Activity },
                        { id: 'budgets', label: `Propostas (${budgets.length})`, icon: FileText, hidden: isCreateMode },
                        { id: 'clinical', label: `Clínica (${clinicalTreatments.length})`, icon: Stethoscope, hidden: isCreateMode },
                        { id: 'ortho', label: `Ortho (${orthoTreatments.length})`, icon: Smile, hidden: isCreateMode },
                        { id: 'hof', label: `HOF (${hofTreatments.length})`, icon: Sparkles, hidden: isCreateMode },
                        { id: 'financial', label: 'Financeiro', icon: CreditCard, hidden: isCreateMode },
                        { id: 'gallery', label: `Galeria (${clinicalImages.length})`, icon: Image, hidden: isCreateMode },
                    ].filter(t => !t.hidden).map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === tab.id
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                                }`}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* SCROLLABLE CONTENT AREA (FLEX-1) */}
            <div
                ref={scrollContainerRef}
                tabIndex={-1}
                className="flex-1 overflow-y-auto min-h-0 bg-slate-50 dark:bg-slate-900 scroll-smooth outline-none"
            >
                <div className="p-6 min-h-full">
                    {/* OVERVIEW TAB */}
                    < div className={`space-y-4 pb-20 ${activeTab === 'overview' ? 'block' : 'hidden'}`}> {/* pb-20 para dar espaço ao footer fixo */}

                        {isCreateMode ? (
                            <PatientForm
                                initialData={initialData}
                                onCancel={onClose}
                                onSuccess={(newId) => {
                                    if (newId) {
                                        // Seamless context switch
                                        setActiveId(newId);
                                        setActiveMode('view');
                                        toast.success("Prontuário carregado!");
                                    } else {
                                        toast.success("Paciente criado!");
                                    }

                                    if (onSuccess) onSuccess(newId); // Notify parent
                                }}
                            />
                        ) : (
                            <>
                                {/* Header da Aba com Ação de Editar */}
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Resumo Clínico & Dados
                                    </h3>
                                    {!isEditingOverview && (
                                        <button
                                            onClick={() => setIsEditingOverview(true)}
                                            className="text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center gap-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded transition-colors"
                                        >
                                            <Edit2 size={12} />
                                            EDITAR DADOS
                                        </button>
                                    )}
                                </div>

                                {/* AI INSIGHTS (Sempre Visível) */}
                                {
                                    insights.length > 0 && (
                                        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700/50 rounded-lg p-4">
                                            <h3 className="text-sm font-bold text-rose-700 dark:text-rose-300 mb-3 flex items-center gap-2">
                                                <AlertTriangle size={16} />
                                                Alertas Inteligentes ({insights.length})
                                            </h3>
                                            <div className="space-y-2">
                                                {insights.map(insight => (
                                                    <div key={insight.id} className="bg-white dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700/30 rounded p-3">
                                                        <h4 className="font-bold text-rose-800 dark:text-rose-200 text-sm mb-1">{insight.title}</h4>
                                                        <p className="text-xs text-rose-700 dark:text-rose-100/70 mb-1">{insight.explanation}</p>
                                                        <p className="text-xs text-rose-600 dark:text-rose-300 font-medium">
                                                            💡 {insight.recommended_action || insight.action_label}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                }

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Personal Data */}
                                    <div className={`bg-slate-50 dark:bg-slate-800 border ${isEditingOverview ? 'border-blue-200 dark:border-blue-900 ring-1 ring-blue-100 dark:ring-blue-900' : 'border-slate-200 dark:border-slate-700'} rounded-xl p-6 transition-all`}>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                            <Briefcase size={16} className="text-blue-600 dark:text-blue-400" />
                                            Dados Pessoais
                                        </h3>
                                        <div className="space-y-4 text-xs">
                                            <div>
                                                <label className="block text-slate-500 dark:text-slate-400 uppercase font-bold mb-1.5">CPF</label>
                                                {isEditingOverview ? (
                                                    <input
                                                        type="text"
                                                        value={overviewData.cpf || ''}
                                                        onChange={(e) => handleOverviewChange('cpf', e.target.value)}
                                                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                    />
                                                ) : (
                                                    <p className="text-slate-900 dark:text-slate-200 font-medium text-sm">{patient.cpf || 'Não informado'}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-slate-500 dark:text-slate-400 uppercase font-bold mb-1.5">Data de Nascimento</label>
                                                {isEditingOverview ? (
                                                    <input
                                                        type="date"
                                                        value={overviewData.birth_date ? overviewData.birth_date.split('T')[0] : ''}
                                                        onChange={(e) => handleOverviewChange('birth_date', e.target.value)}
                                                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                    />
                                                ) : (
                                                    <p className="text-slate-900 dark:text-slate-200 font-medium text-sm">
                                                        {patient.birth_date ? new Date(patient.birth_date).toLocaleDateString('pt-BR') : 'Não informado'}
                                                    </p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-slate-500 dark:text-slate-400 uppercase font-bold mb-1.5">Profissão</label>
                                                {isEditingOverview ? (
                                                    <input
                                                        type="text"
                                                        value={overviewData.occupation || ''}
                                                        onChange={(e) => handleOverviewChange('occupation', e.target.value)}
                                                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                    />
                                                ) : (
                                                    <p className="text-slate-900 dark:text-slate-200 font-medium text-sm">{patient.occupation || 'Não informado'}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Social & Marketing */}
                                    <div className={`bg-slate-50 dark:bg-slate-800 border ${isEditingOverview ? 'border-purple-200 dark:border-purple-900 ring-1 ring-purple-100 dark:ring-purple-900' : 'border-slate-200 dark:border-slate-700'} rounded-xl p-6 transition-all`}>
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                            <Instagram size={16} className="text-purple-600 dark:text-purple-400" />
                                            Social & Marketing
                                        </h3>
                                        <div className="space-y-4 text-xs">
                                            <div>
                                                <label className="block text-slate-500 dark:text-slate-400 uppercase font-bold mb-1.5">Instagram</label>
                                                {isEditingOverview ? (
                                                    <input
                                                        type="text"
                                                        value={overviewData.instagram_handle || ''}
                                                        onChange={(e) => handleOverviewChange('instagram_handle', e.target.value)}
                                                        placeholder="@usuario"
                                                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                                    />
                                                ) : (
                                                    <p className="text-slate-900 dark:text-slate-200 font-medium text-sm">{patient.instagram_handle || 'Não informado'}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-slate-500 dark:text-slate-400 uppercase font-bold mb-1.5">Como Conheceu</label>
                                                {isEditingOverview ? (
                                                    <select
                                                        value={overviewData.origin || ''}
                                                        onChange={(e) => handleOverviewChange('origin', e.target.value)}
                                                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                                    >
                                                        <option value="">Selecione...</option>
                                                        <option value="INSTAGRAM">Instagram</option>
                                                        <option value="GOOGLE">Google</option>
                                                        <option value="INDICATION">Indicação</option>
                                                        <option value="PASSING_BY">Passou na frente</option>
                                                        <option value="OTHER">Outro</option>
                                                    </select>
                                                ) : (
                                                    <p className="text-slate-900 dark:text-slate-200 font-medium text-sm">{patient.origin || 'Não informado'}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* VIP Notes */}
                                <div className={`bg-amber-50 dark:bg-amber-900/10 border ${isEditingOverview ? 'border-amber-200 dark:border-amber-700' : 'border-amber-100 dark:border-amber-800/50'} rounded-xl p-6 transition-all`}>
                                    <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
                                        <Star size={16} fill="currentColor" />
                                        Notas VIP (Preferências & Detalhes)
                                    </h3>
                                    {isEditingOverview ? (
                                        <textarea
                                            value={overviewData.vip_notes || ''}
                                            onChange={(e) => handleOverviewChange('vip_notes', e.target.value)}
                                            placeholder="Ex: Paciente prefere ar condicionado desligado; Gosta de café sem açúcar..."
                                            rows={3}
                                            className="w-full bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                                        />
                                    ) : (
                                        <p className="text-sm text-amber-800 dark:text-amber-200/80 italic">
                                            {patient.vip_notes || 'Nenhuma observação registrada.'}
                                        </p>
                                    )}
                                </div>

                                {/* BARRA DE AÇÕES CONTEXTUAL (Apenas em modo edição) */}
                                {
                                    isEditingOverview && (
                                        <div className="sticky bottom-0 -mx-6 -mb-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 p-4 md:p-6 flex gap-3 justify-end shadow-[0_-5px_20px_rgba(0,0,0,0.1)] z-20 animate-in slide-in-from-bottom-5">
                                            <button
                                                onClick={() => {
                                                    setIsEditingOverview(false);
                                                    // Reset data to original
                                                    if (patient) {
                                                        setOverviewData({
                                                            cpf: patient.cpf,
                                                            birth_date: patient.birth_date,
                                                            occupation: patient.occupation,
                                                            instagram_handle: patient.instagram_handle,
                                                            origin: patient.origin,
                                                            vip_notes: patient.vip_notes
                                                        });
                                                    }
                                                    toast('Edição cancelada');
                                                }}
                                                className="px-5 py-2.5 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleSaveOverview}
                                                className="bg-green-600 hover:bg-green-700 text-white px-8 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-green-600/20 transition-all active:scale-95"
                                            >
                                                <CheckCircle size={18} />
                                                Salvar Alterações
                                            </button>
                                        </div>
                                    )
                                }
                            </>
                        )}
                    </div>

                    {/* BUDGETS TAB */}
                    < div className={`space-y-3 ${activeTab === 'budgets' ? 'block' : 'hidden'}`}>
                        {!showBudgetForm ? (
                            <>
                                {/* LISTA DE ORÇAMENTOS */}
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Propostas Comerciais</h2>
                                    <button
                                        onClick={() => {
                                            setEditingBudget(null);
                                            setShowBudgetForm(true);
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl font-medium text-sm flex items-center gap-2"
                                    >
                                        <FileText size={16} />
                                        + Nova Proposta
                                    </button>
                                </div>
                                {budgets.length === 0 ? (
                                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center">
                                        <FileText size={32} className="text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                                        <p className="text-slate-600 dark:text-slate-400 text-sm">Nenhuma proposta cadastrada</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {budgets.map(budget => (
                                            <div
                                                key={budget.id}
                                                onClick={() => {
                                                    setEditingBudget(budget);
                                                    setShowBudgetForm(true);
                                                }}
                                                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-blue-500 transition-colors cursor-pointer"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                                                            Proposta #{budget.id.slice(0, 8)}
                                                        </h4>
                                                        <p className="text-xs text-slate-600 dark:text-slate-400">
                                                            {new Date(budget.created_at).toLocaleDateString('pt-BR')}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xl font-black text-blue-600 dark:text-blue-400">
                                                            R$ {(budget.final_value || 0).toLocaleString('pt-BR')}
                                                        </p>
                                                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${budget.status === 'APPROVED' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                                                            budget.status === 'REJECTED' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300' :
                                                                'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                                            }`}>
                                                            {budget.status === 'APPROVED' ? 'Aprovado' : budget.status === 'REJECTED' ? 'Rejeitado' : 'Pendente'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : (
                            <BudgetForm
                                isInline
                                patientId={id}
                                initialBudget={editingBudget}
                                onCancel={() => {
                                    setShowBudgetForm(false);
                                    setEditingBudget(null);
                                }}
                                onSaveSuccess={() => {
                                    toast.success('Orçamento salvo com sucesso!');
                                    setShowBudgetForm(false);
                                    setEditingBudget(null);
                                    loadPatientData();
                                }}
                            />
                        )}
                    </div >

                    {/* CLINICAL TAB */}
                    {
                        activeTab === 'clinical' && (
                            <div className="space-y-3">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Tratamentos Clínicos</h2>
                                {clinicalTreatments.length === 0 ? (
                                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-8 text-center">
                                        <Stethoscope size={32} className="text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                                        <p className="text-slate-600 dark:text-slate-400 text-sm">Nenhum tratamento registrado</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {clinicalTreatments.map(treatment => (
                                            <div
                                                key={treatment.id}
                                                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                                                            {treatment.procedure_name}
                                                        </h4>
                                                        <p className="text-xs text-slate-600 dark:text-slate-400">
                                                            {new Date(treatment.created_at).toLocaleDateString('pt-BR')}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${treatment.status === 'COMPLETED' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                                                            treatment.status === 'IN_PROGRESS' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                                                                'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                                            }`}>
                                                            {treatment.status === 'COMPLETED' ? '✓ Concluído' :
                                                                treatment.status === 'IN_PROGRESS' ? '⏳ Em Andamento' : '📋 Planejado'}
                                                        </span>
                                                        {treatment.status === 'NOT_STARTED' && (
                                                            <button
                                                                onClick={() => handleUpdateTreatmentStatus(treatment.id, 'IN_PROGRESS')}
                                                                className="px-2 py-1 bg-blue-600 text-white rounded text-[10px] hover:bg-blue-700"
                                                            >
                                                                Iniciar
                                                            </button>
                                                        )}
                                                        {treatment.status === 'IN_PROGRESS' && (
                                                            <button
                                                                onClick={() => handleUpdateTreatmentStatus(treatment.id, 'COMPLETED')}
                                                                className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] hover:bg-emerald-700"
                                                            >
                                                                Finalizar
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    }

                    {/* ORTHO TAB */}
                    {
                        activeTab === 'ortho' && (
                            <OrthoTab
                                patientId={id!}
                                patientName={patient.name}
                                clinicId={patient.clinic_id}
                            />
                        )
                    }

                    {/* HOF TAB */}
                    {
                        activeTab === 'hof' && (
                            <div className="space-y-3">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Harmonização Orofacial</h2>
                                {hofTreatments.length === 0 ? (
                                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-8 text-center">
                                        <Sparkles size={32} className="text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                                        <p className="text-slate-600 dark:text-slate-400 text-sm">Nenhum tratamento de HOF registrado</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {hofTreatments.map(treatment => (
                                            <div
                                                key={treatment.id}
                                                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                                                            {treatment.procedure_name}
                                                        </h4>
                                                        <p className="text-xs text-slate-600 dark:text-slate-400">
                                                            {new Date(treatment.created_at).toLocaleDateString('pt-BR')}
                                                        </p>
                                                    </div>
                                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${treatment.status === 'COMPLETED' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                                                        treatment.status === 'IN_PROGRESS' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                                                            'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                                        }`}>
                                                        {treatment.status === 'COMPLETED' ? '✓ Concluído' :
                                                            treatment.status === 'IN_PROGRESS' ? '⏳ Em Andamento' : '📋 Planejado'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    }

                    {/* FINANCIAL TAB */}
                    {
                        activeTab === 'financial' && (
                            <div className="space-y-4">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Resumo Financeiro</h2>
                                <div className="grid grid-cols-3 gap-3 mb-6">
                                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Total Aprovado</p>
                                        <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                                            R$ {financialData.totalApproved.toLocaleString('pt-BR')}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Total Pago</p>
                                        <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                            R$ {financialData.totalPaid.toLocaleString('pt-BR')}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold mb-1">Saldo Devedor</p>
                                        <p className={`text-2xl font-black ${financialData.balanceDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>
                                            R$ {financialData.balanceDue.toLocaleString('pt-BR')}
                                        </p>
                                    </div>
                                </div>
                                <PatientInstallments patientId={id!} />
                            </div>
                        )
                    }

                    {/* GALLERY TAB */}
                    {
                        activeTab === 'gallery' && (
                            <div className="space-y-3">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Galeria Clínica</h2>
                                {clinicalImages.length === 0 ? (
                                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-8 text-center">
                                        <Image size={32} className="text-slate-400 dark:text-slate-600 mx-auto mb-2" />
                                        <p className="text-slate-600 dark:text-slate-400 text-sm">Nenhuma imagem cadastrada</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-3">
                                        {clinicalImages.map(img => (
                                            <div key={img.id} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                                <img src={img.file_url} alt={img.notes} className="w-full h-32 object-cover" />
                                                <div className="p-2">
                                                    <p className="text-xs text-slate-900 dark:text-slate-200">{img.notes || 'Sem descrição'}</p>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                                                        {new Date(img.created_at).toLocaleDateString('pt-BR')}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    }
                </div >
            </div > {/* Close Scrollable Body */}
        </>
    );

    // Renderizar Sheet (Desktop) ou Drawer (Mobile)
    return isMobile ? (
        <Drawer open={open} onOpenChange={onClose}>
            <DrawerContent className="h-[100vh] overflow-auto p-0">
                {ProntuarioContent}
            </DrawerContent>
        </Drawer>
    ) : (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent
                className="w-full sm:max-w-[70vw] p-0 gap-0 bg-slate-50 dark:bg-slate-900 transition-all duration-300 ease-in-out h-full flex flex-col shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.3)] border-l border-slate-200 dark:border-slate-800"
            >
                <SheetHeader className="sr-only">
                    <SheetTitle>Prontuário de {patient?.name}</SheetTitle>
                    <SheetDescription>Detalhes completos do paciente incluindo orçamentos e tratamentos</SheetDescription>
                </SheetHeader>
                {ProntuarioContent}
            </SheetContent>
        </Sheet>
    );
};

export default PatientDetailSheet;
