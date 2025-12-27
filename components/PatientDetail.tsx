import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
    ArrowLeft, Edit2, Trash2, Phone, Mail, Instagram,
    Briefcase, Star, Calendar, FileText, Image, Activity,
    CreditCard, Stethoscope, AlertTriangle, Smile, Sparkles,
    User, DollarSign, TrendingUp, Heart, Clock, CheckCircle,
    XCircle, Loader2, X
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
                        {!isCreateMode && (
                            <button
                                onClick={handleDeletePatient}
                                className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-3 py-2 rounded-lg transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
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
                        { id: 'registration', label: 'Dados Cadastrais', icon: User, hidden: isCreateMode },
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
                    {/* OVERVIEW TAB - 5 PILARES DASHBOARD */}
                    <div className={`space-y-6 pb-20 ${activeTab === 'overview' ? 'block' : 'hidden'}`}>

                        {isCreateMode ? (
                            <PatientForm
                                initialData={initialData}
                                patientId={activeMode === 'create' ? undefined : activeId}
                                onCancel={onClose}
                                onSuccess={(newId) => {
                                    if (newId) {
                                        setActiveId(newId);
                                        setActiveMode('view');
                                        toast.success("Prontuário carregado!");
                                    } else {
                                        toast.success("Paciente criado!");
                                    }
                                    if (onSuccess) onSuccess(newId);
                                }}
                            />
                        ) : (
                            <>
                                {/* AI INSIGHTS - Sempre no topo */}
                                {insights.length > 0 && (
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
                                )}

                                {/* DASHBOARD DOS 5 PILARES */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                                    {/* PILAR 1: ATRAÇÃO (Perfil & Origem) */}
                                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                                <User size={20} className="text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Origem & Perfil</h3>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Canal de Origem</p>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {patient.origin || 'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Tempo de Casa</p>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {patient.created_at ? (() => {
                                                        const createdDate = new Date(patient.created_at);
                                                        const now = new Date();
                                                        const diffTime = Math.abs(now.getTime() - createdDate.getTime());
                                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                                        const years = Math.floor(diffDays / 365);
                                                        const months = Math.floor((diffDays % 365) / 30);

                                                        if (years > 0) {
                                                            return `${years} ano${years > 1 ? 's' : ''}${months > 0 ? ` e ${months} mês${months > 1 ? 'es' : ''}` : ''}`;
                                                        } else if (months > 0) {
                                                            return `${months} mês${months > 1 ? 'es' : ''}`;
                                                        } else {
                                                            return `${diffDays} dia${diffDays > 1 ? 's' : ''}`;
                                                        }
                                                    })() : 'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Idade</p>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {patient.birth_date ? (() => {
                                                        const birthDate = new Date(patient.birth_date);
                                                        const now = new Date();
                                                        const age = now.getFullYear() - birthDate.getFullYear();
                                                        return `${age} anos`;
                                                    })() : 'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Profissão</p>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {patient.occupation || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* PILAR 2: CONVERSÃO (Performance Comercial) */}
                                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                                <TrendingUp size={20} className="text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Conversão</h3>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Aprovado</p>
                                                <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
                                                    R$ {(patient.total_approved || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Taxa de Aceite</p>
                                                <div className="flex items-center gap-2">
                                                    {(patient.total_approved || 0) > 0 ? (
                                                        <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded">
                                                            Alta
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold rounded">
                                                            Sem Conversão
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Perfil Comercial</p>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {(patient.total_approved || 0) > 10000 ? 'Comprador Recorrente' :
                                                        (patient.total_approved || 0) > 0 ? 'Cliente Ativo' : 'Prospect'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* PILAR 3: PRODUÇÃO (Ritmo Clínico) */}
                                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                                <Activity size={20} className="text-green-600 dark:text-green-400" />
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Status Clínico</h3>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Status Atual</p>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${patient.clinical_status === 'Em Tratamento' ? 'bg-green-500' :
                                                        patient.clinical_status === 'Concluído' ? 'bg-blue-500' :
                                                            'bg-slate-400'
                                                        }`} />
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                        {patient.clinical_status || 'Não Iniciado'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Última Vinda</p>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {patient.last_attendance ? new Date(patient.last_attendance).toLocaleDateString('pt-BR') : 'Sem registro'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Próxima Consulta</p>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    Não agendado
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Tratamentos Ativos</p>
                                                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                                    {clinicalTreatments.length + orthoTreatments.length + hofTreatments.length}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* PILAR 4: LUCRO (Saúde Financeira) */}
                                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                                                <DollarSign size={20} className="text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Financeiro & LTV</h3>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">LTV (Lifetime Value)</p>
                                                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                                                    R$ {(patient.total_paid || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Saldo Devedor</p>
                                                <p className={`text-xl font-bold ${(patient.balance_due || 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                                                    }`}>
                                                    R$ {(patient.balance_due || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Ticket Médio</p>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    R$ {(() => {
                                                        const totalVisits = clinicalTreatments.length + orthoTreatments.length + hofTreatments.length || 1;
                                                        const avgTicket = (patient.total_paid || 0) / totalVisits;
                                                        return avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                                                    })()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Status Pagamento</p>
                                                <div className="flex items-center gap-2">
                                                    {(patient.balance_due || 0) === 0 ? (
                                                        <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded">
                                                            ✓ Em Dia
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 text-xs font-bold rounded">
                                                            ⚠ Pendente
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* PILAR 5: ENCANTAMENTO (Fidelidade) */}
                                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
                                                <Heart size={20} className="text-amber-600 dark:text-amber-400" />
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">Fidelidade & NPS</h3>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Classificação</p>
                                                <div className="flex items-center gap-2">
                                                    {patient.patient_score === 'DIAMOND' && (
                                                        <span className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-bold rounded-lg shadow-md">
                                                            💎 DIAMOND
                                                        </span>
                                                    )}
                                                    {patient.patient_score === 'GOLD' && (
                                                        <span className="px-3 py-1.5 bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-sm font-bold rounded-lg shadow-md">
                                                            🥇 GOLD
                                                        </span>
                                                    )}
                                                    {(patient.patient_score === 'STANDARD' || !patient.patient_score) && (
                                                        <span className="px-3 py-1.5 bg-slate-600 text-slate-200 text-sm font-bold rounded-lg">
                                                            ⭐ STANDARD
                                                        </span>
                                                    )}
                                                    {patient.patient_score === 'RISK' && (
                                                        <span className="px-3 py-1.5 bg-orange-600 text-white text-sm font-bold rounded-lg">
                                                            ⚠️ RISK
                                                        </span>
                                                    )}
                                                    {patient.patient_score === 'BLACKLIST' && (
                                                        <span className="px-3 py-1.5 bg-rose-600 text-white text-sm font-bold rounded-lg">
                                                            🚫 BLACKLIST
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Sentimento</p>
                                                <div className="flex items-center gap-2">
                                                    {patient.sentiment_status === 'VERY_HAPPY' && <span className="text-2xl">😄</span>}
                                                    {patient.sentiment_status === 'HAPPY' && <span className="text-2xl">😊</span>}
                                                    {(patient.sentiment_status === 'NEUTRAL' || !patient.sentiment_status) && <span className="text-2xl">😐</span>}
                                                    {patient.sentiment_status === 'UNHAPPY' && <span className="text-2xl">😟</span>}
                                                    {patient.sentiment_status === 'COMPLAINING' && <span className="text-2xl">😡</span>}
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                        {patient.sentiment_status === 'VERY_HAPPY' ? 'Muito Satisfeito' :
                                                            patient.sentiment_status === 'HAPPY' ? 'Satisfeito' :
                                                                patient.sentiment_status === 'NEUTRAL' ? 'Neutro' :
                                                                    patient.sentiment_status === 'UNHAPPY' ? 'Insatisfeito' :
                                                                        patient.sentiment_status === 'COMPLAINING' ? 'Reclamando' : 'Neutro'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Indicações</p>
                                                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                                                    {patient.indication_patient_id ? '1+' : '0'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Status</p>
                                                <div className="flex items-center gap-2">
                                                    {patient.is_active ? (
                                                        <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded">
                                                            ✓ Ativo
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-bold rounded">
                                                            Inativo
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Botão Ver Histórico Completo */}
                                <div className="flex justify-center pt-4">
                                    <button className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors">
                                        Ver Histórico Completo
                                        <ArrowLeft size={14} className="rotate-180" />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* DADOS CADASTRAIS TAB */}
                    <div className={`space-y-4 pb-20 ${activeTab === 'registration' ? 'block' : 'hidden'}`}>
                        <PatientForm
                            initialData={patient}
                            patientId={activeId}
                            readonly={true}
                            onSuccess={(updatedId) => {
                                loadPatientData();
                                toast.success("Dados cadastrais atualizados!");
                            }}
                        />
                    </div>

                    {/* BUDGETS TAB - Jira-Style Cards */}
                    <div className={`space-y-6 pb-20 ${activeTab === 'budgets' ? 'block' : 'hidden'}`}>
                        {!showBudgetForm ? (
                            <>
                                {/* Header */}
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Propostas Comerciais</h2>
                                    <button
                                        onClick={() => {
                                            setEditingBudget(null);
                                            setShowBudgetForm(true);
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors shadow-lg shadow-blue-600/30"
                                    >
                                        <FileText size={16} />
                                        + Nova Proposta
                                    </button>
                                </div>

                                {/* Cards Grid */}
                                {budgets.length === 0 ? (
                                    <div className="bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center">
                                        <FileText size={48} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                        <p className="text-slate-600 dark:text-slate-400 font-medium mb-2">Nenhuma proposta cadastrada</p>
                                        <p className="text-slate-500 dark:text-slate-500 text-sm">Crie a primeira proposta comercial para este paciente</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {budgets.map(budget => (
                                            <div
                                                key={budget.id}
                                                onClick={() => {
                                                    setEditingBudget(budget);
                                                    setShowBudgetForm(true);
                                                }}
                                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-5 hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-500 transition-all cursor-pointer group"
                                            >
                                                {/* Card Header */}
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                            Proposta #{budget.id.slice(0, 8).toUpperCase()}
                                                        </h4>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            Criado em {new Date(budget.created_at).toLocaleDateString('pt-BR')}
                                                        </p>
                                                    </div>
                                                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide ${budget.status === 'APPROVED' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                                                        budget.status === 'REJECTED' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300' :
                                                            budget.status === 'DRAFT' ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400' :
                                                                'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                                        }`}>
                                                        {budget.status === 'APPROVED' ? '✓ Aprovado' :
                                                            budget.status === 'REJECTED' ? '✗ Rejeitado' :
                                                                budget.status === 'DRAFT' ? '📝 Rascunho' : '⏳ Pendente'}
                                                    </span>
                                                </div>

                                                {/* Card Value */}
                                                <div className="mb-4">
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Valor Total</p>
                                                    <p className="text-3xl font-black text-blue-600 dark:text-blue-400">
                                                        R$ {(budget.final_value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </p>
                                                </div>

                                                {/* Card Footer */}
                                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                                        {budget.payment_config ? '💳 Parcelado' : '💵 À vista'}
                                                    </span>
                                                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400 group-hover:underline">
                                                        Ver Detalhes →
                                                    </span>
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

                    {/* CLINICAL TAB - Timeline Agrupada */}
                    {
                        activeTab === 'clinical' && (
                            <div className="space-y-6 pb-20">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tratamentos Clínicos</h2>

                                {clinicalTreatments.length === 0 ? (
                                    <div className="bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center">
                                        <Stethoscope size={48} className="text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                                        <p className="text-slate-600 dark:text-slate-400 font-medium mb-2">Nenhum tratamento registrado</p>
                                        <p className="text-slate-500 dark:text-slate-500 text-sm">Os tratamentos aparecerão aqui quando forem criados</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Planejados */}
                                        {clinicalTreatments.filter(t => t.status === 'NOT_STARTED').length > 0 && (
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                                                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                                                        Planejados ({clinicalTreatments.filter(t => t.status === 'NOT_STARTED').length})
                                                    </h3>
                                                </div>
                                                <div className="space-y-3">
                                                    {clinicalTreatments.filter(t => t.status === 'NOT_STARTED').map(treatment => (
                                                        <div
                                                            key={treatment.id}
                                                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                                                        >
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex items-start gap-3 flex-1">
                                                                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                        <Stethoscope size={20} className="text-amber-600 dark:text-amber-400" />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                                                                            {treatment.procedure_name}
                                                                        </h4>
                                                                        {treatment.region && (
                                                                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                                                                                📍 {treatment.region}
                                                                            </p>
                                                                        )}
                                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                            Criado em {new Date(treatment.created_at).toLocaleDateString('pt-BR')}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleUpdateTreatmentStatus(treatment.id, 'IN_PROGRESS')}
                                                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                                                                >
                                                                    ▶ Iniciar
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Em Andamento */}
                                        {clinicalTreatments.filter(t => t.status === 'IN_PROGRESS').length > 0 && (
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                                                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                                                        Em Andamento ({clinicalTreatments.filter(t => t.status === 'IN_PROGRESS').length})
                                                    </h3>
                                                </div>
                                                <div className="space-y-3">
                                                    {clinicalTreatments.filter(t => t.status === 'IN_PROGRESS').map(treatment => (
                                                        <div
                                                            key={treatment.id}
                                                            className="bg-white dark:bg-slate-800 border-l-4 border-l-blue-500 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                                                        >
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex items-start gap-3 flex-1">
                                                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                        <Activity size={20} className="text-blue-600 dark:text-blue-400" />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                                                                            {treatment.procedure_name}
                                                                        </h4>
                                                                        {treatment.region && (
                                                                            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                                                                                📍 {treatment.region}
                                                                            </p>
                                                                        )}
                                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                            Iniciado em {new Date(treatment.created_at).toLocaleDateString('pt-BR')}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleUpdateTreatmentStatus(treatment.id, 'COMPLETED')}
                                                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors"
                                                                >
                                                                    ✓ Finalizar
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Concluídos */}
                                        {clinicalTreatments.filter(t => t.status === 'COMPLETED').length > 0 && (
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                                                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                                                        Concluídos ({clinicalTreatments.filter(t => t.status === 'COMPLETED').length})
                                                    </h3>
                                                </div>
                                                <div className="space-y-3">
                                                    {clinicalTreatments.filter(t => t.status === 'COMPLETED').map(treatment => (
                                                        <div
                                                            key={treatment.id}
                                                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 opacity-75 hover:opacity-100 transition-opacity"
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                                                    <CheckCircle size={20} className="text-emerald-600 dark:text-emerald-400" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                                                                        {treatment.procedure_name}
                                                                    </h4>
                                                                    {treatment.region && (
                                                                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                                                                            📍 {treatment.region}
                                                                        </p>
                                                                    )}
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded">
                                                                            ✓ Concluído
                                                                        </span>
                                                                        <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                            {new Date(treatment.created_at).toLocaleDateString('pt-BR')}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
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
