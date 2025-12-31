import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
    ArrowLeft, Trash2, Phone, Mail,
    FileText, Image, Activity,
    CreditCard, Stethoscope, AlertTriangle, Smile, Sparkles,
    User, DollarSign, TrendingUp, Heart, CheckCircle,
    Plus
} from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "./ui/drawer";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "./ui/sheet";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { PatientInstallments } from "./PatientInstallments";
import { OrthoTab } from "./ortho/OrthoTab";
import toast from "react-hot-toast";
import BudgetForm from "./BudgetForm";
import PatientForm from "./PatientForm";
import { useSheetStore } from "../stores/useSheetStore";
import { PatientMenuList } from "./patient/PatientMenuList";
import { PatientNavigationDrawers } from "./patient/PatientNavigationDrawers";
import { PatientSkeleton } from "./patient/PatientSkeleton";
import { FloatingActionButton } from "./FloatingActionButton";

// --- Subcomponentes Visuais (Badges) ---

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

// --- Componente Principal ---

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
    onDelete,
    mode = 'view',
    initialData,
    onSuccess
}) => {
    // 1. Hooks de Roteamento e Estado Base
    const { id: paramId } = useParams<{ id: string }>();
    const initialId = patientId || paramId;
    const [activeId, setActiveId] = useState(initialId);
    const [activeMode, setActiveMode] = useState(mode);

    // Sincronização de Props
    useEffect(() => {
        if (patientId && patientId !== activeId) setActiveId(patientId);
        if (mode && mode !== activeMode) setActiveMode(mode);
    }, [patientId, mode]);

    useEffect(() => {
        if (!patientId && paramId && paramId !== activeId) setActiveId(paramId);
    }, [paramId]);

    const id = activeId;
    const isCreateMode = activeMode === 'create';
    const navigate = useNavigate();
    const isMobile = useMediaQuery('(max-width: 640px)');
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // 2. Estados de Dados
    const [patient, setPatient] = useState<any>(null);
    const [loading, setLoading] = useState(activeMode !== 'create');
    const [activeTab, setActiveTab] = useState('overview');

    // Deep Linking
    const { initialTab } = useSheetStore();
    useEffect(() => {
        if (open && initialTab) setActiveTab(initialTab);
        else if (open && !initialTab) setActiveTab('overview');
    }, [open, initialTab]);

    // Dados Carregados
    const [budgets, setBudgets] = useState<any[]>([]);
    const [clinicalTreatments, setClinicalTreatments] = useState<any[]>([]);
    const [orthoTreatments, setOrthoTreatments] = useState<any[]>([]);
    const [hofTreatments, setHofTreatments] = useState<any[]>([]);
    const [insights, setInsights] = useState<any[]>([]);
    const [clinicalImages, setClinicalImages] = useState<any[]>([]);
    const [financialData, setFinancialData] = useState({ totalApproved: 0, totalPaid: 0, balanceDue: 0 });

    // Estados de UI
    const [showBudgetForm, setShowBudgetForm] = useState(false);
    const [editingBudget, setEditingBudget] = useState<any>(null);
    const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

    // Navegação Apple Drill-Down (Mobile)
    interface NavigationLevel {
        type: 'menu' | 'section' | 'detail';
        sectionId?: string;
        itemId?: string;
        title: string;
    }
    const [navigationStack, setNavigationStack] = useState<NavigationLevel[]>([]);

    // 3. Efeitos de Carregamento
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

    // 4. Funções de Lógica (CRUD e Helpers)
    const loadPatientData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const { data: patientData, error } = await supabase.from('patients').select('*').eq('id', id).single();
            if (error) throw error;
            if (patientData) {
                setPatient(patientData);
                setFinancialData({
                    totalApproved: patientData.total_approved || 0,
                    totalPaid: patientData.total_paid || 0,
                    balanceDue: patientData.balance_due || 0
                });
            }

            // Carregamento Paralelo para Performance
            const [b, c, o, h, i, img] = await Promise.all([
                supabase.from('budgets').select(`*, budget_items (*)`).eq('patient_id', id).order('created_at', { ascending: false }),
                supabase.from('treatment_items').select('*').eq('patient_id', id).eq('category', 'CLINICA_GERAL').order('created_at', { ascending: false }),
                supabase.from('treatment_items').select('*').eq('patient_id', id).eq('category', 'ORTODONTIA').order('created_at', { ascending: false }),
                supabase.from('treatment_items').select('*').eq('patient_id', id).eq('category', 'HOF').order('created_at', { ascending: false }),
                supabase.from('ai_insights').select('*').eq('related_entity_id', id).in('status', ['OPEN', 'open', 'ACTIVE', 'active']).order('priority', { ascending: false }),
                supabase.from('clinical_images').select('*').eq('patient_id', id).order('created_at', { ascending: false })
            ]);

            setBudgets(b.data || []);
            setClinicalTreatments(c.data || []);
            setOrthoTreatments(o.data || []);
            setHofTreatments(h.data || []);
            setInsights(i.data || []);
            setClinicalImages(img.data || []);

        } catch (error) {
            console.error('Error loading patient:', error);
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePatient = async () => {
        if (onDelete) return onDelete();
        if (!confirm('Excluir este paciente?')) return;
        try {
            await supabase.from('patients').delete().eq('id', id);
            toast.success('Paciente excluído');
            onClose ? onClose() : navigate('/dashboard/patients');
        } catch (e) {
            toast.error('Erro ao excluir');
        }
    };

    const handleUpdateTreatmentStatus = async (tid: string, status: string) => {
        try {
            await supabase.from('treatment_items').update({
                status,
                ...(status === 'COMPLETED' ? { execution_date: new Date().toISOString().split('T')[0] } : {}),
                updated_at: new Date().toISOString()
            }).eq('id', tid);
            toast.success('Status atualizado');
            loadPatientData();
        } catch (e) {
            toast.error('Erro ao atualizar');
        }
    };

    // Helpers de Navegação Mobile
    const openSection = (sectionId: string) => {
        const titles: Record<string, string> = {
            'registration': 'Dados Cadastrais',
            'budgets': 'Propostas',
            'clinical': 'Histórico Clínico',
            'ortho': 'Ortodontia',
            'hof': 'HOF',
            'gallery': 'Arquivos',
            'financial': 'Financeiro'
        };
        setNavigationStack([{ type: 'section', sectionId, title: titles[sectionId] || sectionId }]);
    };

    const openDetail = (itemId: string, title: string) => {
        setNavigationStack([...navigationStack, { type: 'detail', itemId, title }]);
    };

    const goBack = () => {
        if (navigationStack.length > 0) setNavigationStack(navigationStack.slice(0, -1));
    };

    // 5. Componentes de Renderização Interna (Refatorados para Limpeza)

    const renderNotFound = () => (
        <div className="flex items-center justify-center h-full w-full">
            <div className="text-center">
                <p className="text-slate-600">Paciente não encontrado</p>
                <button onClick={onClose} className="mt-4 text-blue-600 hover:underline">Voltar</button>
            </div>
        </div>
    );

    const renderHeader = () => (
        <div className="flex-none bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 p-6 z-50 shadow-sm">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
                    {isCreateMode ? 'Novo Paciente' : patient?.name || 'Carregando...'}
                </h2>
                {!isCreateMode && (
                    <button onClick={handleDeletePatient} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-semibold transition-all flex items-center gap-2">
                        <Trash2 size={16} />
                        Excluir
                    </button>
                )}
            </div>
            {isCreateMode ? (
                <div className="mb-4">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Novo Paciente</h1>
                    <p className="text-slate-500 text-sm">Preencha a ficha cadastral</p>
                </div>
            ) : (
                <>
                    {/* Identificação e Badges */}
                    <div className="flex items-start gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shrink-0">
                            {patient.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wide mb-1">Prontuário Nº {patient.id.slice(0, 8).toUpperCase()}</p>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2 truncate">{patient.name}</h1>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                                <ScoreBadge score={patient.patient_score} />
                                {patient.bad_debtor && <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold">⚠️ INADIMPLENTE</span>}
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                                <span className="flex items-center gap-1"><Phone size={12} /> {patient.phone}</span>
                                {patient.email && <span className="flex items-center gap-1"><Mail size={12} /> {patient.email}</span>}
                            </div>
                        </div>
                    </div>
                    {/* KPI Cards Rápidos (Header) */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Saldo Devedor</p>
                            <p className={`text-lg font-black ${financialData.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>R$ {financialData.balanceDue.toLocaleString('pt-BR')}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Aprovado</p>
                            <p className="text-lg font-black text-blue-600">R$ {financialData.totalApproved.toLocaleString('pt-BR')}</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Pago</p>
                            <p className="text-lg font-black text-emerald-600">R$ {financialData.totalPaid.toLocaleString('pt-BR')}</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );

    const renderDesktopTabs = () => (
        <div className="flex-none z-40 bg-card border-b border-slate-200 dark:border-slate-800 shadow-md">
            <div className="flex gap-1 overflow-x-auto px-6 scrollbar-hide snap-x">
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
                        className={`flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors border-b-2 whitespace-nowrap snap-start ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                    >
                        <tab.icon size={14} /> {tab.label}
                    </button>
                ))}
            </div>
        </div>
    );

    // Lógica Central de Conteúdo por Aba (Refatorada)
    const renderTabContent = () => {
        switch (activeTab) {
            case 'overview':
                if (isCreateMode) {
                    return (
                        <PatientForm
                            initialData={initialData}
                            onCancel={onClose}
                            onSuccess={(newId) => {
                                if (newId) { setActiveId(newId); setActiveMode('view'); toast.success("Prontuário carregado!"); }
                                if (onSuccess) onSuccess(newId);
                            }}
                        />
                    );
                }
                return (
                    <div className="space-y-6">
                        {/* Alertas Inteligentes */}
                        {insights.length > 0 && (
                            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                                <h3 className="text-sm font-bold text-rose-700 flex items-center gap-2"><AlertTriangle size={16} /> Alertas ({insights.length})</h3>
                                {insights.map(i => (
                                    <div key={i.id} className="mt-2 bg-white/50 p-2 rounded border border-rose-100">
                                        <p className="font-bold text-xs text-rose-800">{i.title}</p>
                                        <p className="text-xs text-rose-600">{i.recommended_action}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        {/* 5 Pilares - Cards Resumidos */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="bg-card p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2"><User size={16} /> Origem & Perfil</h3>
                                <p className="text-sm">Origem: <span className="font-semibold">{patient.origin || 'Não informado'}</span></p>
                                <p className="text-sm">Profissão: <span className="font-semibold">{patient.occupation || 'Não informada'}</span></p>
                                {patient.instagram_handle && (
                                    <p className="text-sm">Instagram: <span className="font-semibold text-pink-600">@{patient.instagram_handle}</span></p>
                                )}
                                {patient.birth_date && (
                                    <p className="text-sm">Idade: <span className="font-semibold">{Math.floor((new Date().getTime() - new Date(patient.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} anos</span></p>
                                )}
                            </div>
                            <div className="bg-card p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
                                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2"><Activity size={16} /> Produção</h3>
                                <p className="text-sm text-green-600 font-bold">{clinicalTreatments.length} tratamentos ativos</p>
                                <p className="text-xs text-slate-500">Última vinda: {patient.last_attendance ? new Date(patient.last_attendance).toLocaleDateString() : '-'}</p>
                            </div>
                            <div className={`p-5 rounded-lg border shadow-sm hover:shadow-md transition-shadow ${(patient.balance_due || 0) > 0
                                ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                                : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800'
                                }`}>
                                <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-2 flex items-center gap-2"><DollarSign size={16} /> Financeiro</h3>
                                <p className="text-sm text-emerald-600 font-bold">Total Aprovado: R$ {(patient.total_approved || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                {(patient.balance_due || 0) > 0 && (
                                    <p className="text-sm text-red-600 font-bold mt-1">Saldo Devedor: R$ {(patient.balance_due || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                )}
                                <p className="text-xs text-slate-500 mt-1">Ticket Médio: R$ {((patient.total_paid || 0) / (clinicalTreatments.length || 1)).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                            </div>
                        </div>
                    </div>
                );

            case 'registration':
                return <PatientForm initialData={patient} patientId={activeId} readonly={true} onSuccess={() => { loadPatientData(); toast.success("Atualizado!"); }} />;

            case 'budgets':
                return (
                    <div className="space-y-6">
                        {!showBudgetForm ? (
                            <>
                                <div className="flex justify-between items-center">
                                    <h2 className="text-lg font-bold">Propostas Comerciais</h2>
                                    <button onClick={() => setShowBudgetForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">+ Nova Proposta</button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {budgets.map(b => (
                                        <div key={b.id} onClick={() => { setEditingBudget(b); setShowBudgetForm(true); }} className="bg-card border border-slate-200 dark:border-slate-800 p-5 rounded-lg hover:shadow-lg cursor-pointer group transition-all">
                                            <div className="flex justify-between">
                                                <h4 className="font-bold group-hover:text-blue-600">Proposta #{b.id.slice(0, 8)}</h4>
                                                <span className={`text-xs px-2 py-1 rounded ${b.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-slate-100'}`}>{b.status}</span>
                                            </div>
                                            <p className="text-2xl font-black text-blue-600 mt-2">R$ {(b.final_value || 0).toLocaleString('pt-BR')}</p>
                                            <p className="text-xs text-slate-500 mt-2">{new Date(b.created_at).toLocaleDateString()}</p>
                                        </div>
                                    ))}
                                    {budgets.length === 0 && <p className="col-span-2 text-center text-slate-500 py-10 border-2 border-dashed rounded-lg">Nenhuma proposta cadastrada.</p>}
                                </div>
                            </>
                        ) : (
                            <BudgetForm isInline patientId={id} initialBudget={editingBudget} onCancel={() => setShowBudgetForm(false)} onSaveSuccess={() => { setShowBudgetForm(false); loadPatientData(); }} />
                        )}
                    </div>
                );

            case 'clinical':
                return (
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold">Tratamentos Clínicos</h2>
                        {clinicalTreatments.map(t => (
                            <div key={t.id} className="bg-card border border-slate-200 dark:border-slate-800 p-4 rounded-lg flex justify-between items-center shadow-sm">
                                <div>
                                    <h4 className="font-bold text-slate-800 dark:text-slate-200">{t.procedure_name}</h4>
                                    <p className="text-xs text-slate-500 flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${t.status === 'COMPLETED' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                                        {t.status}
                                    </p>
                                </div>
                                {t.status !== 'COMPLETED' && (
                                    <button onClick={() => handleUpdateTreatmentStatus(t.id, 'COMPLETED')} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded transition-colors">
                                        Concluir
                                    </button>
                                )}
                            </div>
                        ))}
                        {clinicalTreatments.length === 0 && <p className="text-center text-slate-500 py-8">Nenhum tratamento clínico registrado.</p>}
                    </div>
                );

            case 'ortho':
                return <OrthoTab patientId={id!} patientName={patient.name} clinicId={patient.clinic_id} />;

            case 'hof':
                return (
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold flex items-center gap-2"><Sparkles size={20} className="text-purple-500" /> Harmonização Orofacial</h2>
                        <div className="p-8 bg-slate-50 border border-dashed rounded-lg text-center">
                            <p className="text-slate-500">Módulo HOF em desenvolvimento.</p>
                        </div>
                    </div>
                );

            case 'financial':
                return <PatientInstallments patientId={id!} />;

            case 'gallery':
                return (
                    <div className="space-y-4">
                        <h2 className="text-lg font-bold">Galeria Clínica</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {clinicalImages.map(img => (
                                <div key={img.id} className="relative group cursor-pointer" onClick={() => toast('Lightbox em breve!', { icon: '🖼️' })}>
                                    <img src={img.file_url} className="rounded-lg h-32 w-full object-cover shadow-sm group-hover:shadow-md transition-all" alt="Clinical" />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-lg" />
                                </div>
                            ))}
                        </div>
                        {clinicalImages.length === 0 && <p className="text-center text-slate-500 py-10">Nenhuma imagem na galeria.</p>}
                    </div>
                );

            default:
                return null;
        }
    };

    // 6. Retorno Principal (Main Render)

    // Estado de Loading
    if (loading) {
        return isMobile ? (
            <Drawer open={open} onOpenChange={onClose}>
                <DrawerContent className="h-[95dvh] rounded-t-[10px] outline-none">
                    <DrawerHeader className="sr-only">
                        <DrawerTitle>Carregando...</DrawerTitle>
                        <DrawerDescription>Carregando dados do paciente</DrawerDescription>
                    </DrawerHeader>
                    <PatientSkeleton />
                </DrawerContent>
            </Drawer>
        ) : (
            <Sheet open={open} onOpenChange={onClose}>
                <SheetContent className="w-full sm:max-w-[70vw] p-0">
                    <SheetHeader className="sr-only">
                        <SheetTitle>Carregando</SheetTitle>
                        <SheetDescription>Carregando dados do paciente</SheetDescription>
                    </SheetHeader>
                    <PatientSkeleton />
                </SheetContent>
            </Sheet>
        );
    }

    // Estado Não Encontrado
    if (!patient && !isCreateMode) {
        return isMobile ? (
            <Drawer open={open} onOpenChange={onClose}>
                <DrawerContent className="h-[95dvh]">
                    <DrawerHeader className="sr-only">
                        <DrawerTitle>Não Encontrado</DrawerTitle>
                        <DrawerDescription>Paciente não encontrado no sistema</DrawerDescription>
                    </DrawerHeader>
                    {renderNotFound()}
                </DrawerContent>
            </Drawer>
        ) : (
            <Sheet open={open} onOpenChange={onClose}>
                <SheetContent className="w-full sm:max-w-[70vw] p-0">
                    <SheetHeader className="sr-only">
                        <SheetTitle>Não Encontrado</SheetTitle>
                        <SheetDescription>Paciente não encontrado no sistema</SheetDescription>
                    </SheetHeader>
                    {renderNotFound()}
                </SheetContent>
            </Sheet>
        );
    }

    // Renderização Condicional (Mobile vs Desktop)
    if (isMobile) {
        // MOBILE: Apple Drill-Down Navigation
        return (
            <Drawer open={open} onOpenChange={onClose}>
                <DrawerContent className="h-[95dvh] overflow-hidden p-0 rounded-t-[10px] outline-none flex flex-col">
                    <DrawerHeader className="sr-only">
                        <DrawerTitle>{patient?.name || "Paciente"}</DrawerTitle>
                        <DrawerDescription>Prontuário e histórico do paciente</DrawerDescription>
                    </DrawerHeader>
                    {renderHeader()}

                    <div className="flex-1 overflow-y-auto bg-background relative">
                        {/* Nível 0: Menu Principal */}
                        <PatientMenuList
                            budgetsCount={budgets.length}
                            clinicalCount={clinicalTreatments.length}
                            orthoCount={orthoTreatments.length}
                            hofCount={hofTreatments.length}
                            imagesCount={clinicalImages.length}
                            onSelectSection={openSection}
                        />

                        {/* Botão FAB */}
                        <button
                            className="fixed bottom-6 right-6 w-14 h-14 bg-violet-600 text-white rounded-full shadow-xl flex items-center justify-center z-50 hover:scale-105 active:scale-95 transition-all"
                            onClick={() => setIsActionSheetOpen(true)}
                        >
                            <Plus size={28} />
                        </button>

                        {/* Níveis 1 e 2: Drawers Aninhados */}
                        <PatientNavigationDrawers
                            navigationStack={navigationStack}
                            budgets={budgets}
                            clinicalTreatments={clinicalTreatments}
                            orthoTreatments={orthoTreatments}
                            hofTreatments={hofTreatments}
                            clinicalImages={clinicalImages}
                            patient={patient}
                            onGoBack={goBack}
                            onOpenDetail={openDetail}
                        />

                        {/* Drawer do Formulário de Orçamento (Mobile Drill-down) */}
                        <Drawer open={showBudgetForm} onOpenChange={setShowBudgetForm}>
                            <DrawerContent className="h-[95dvh] rounded-t-[10px] flex flex-col outline-none">
                                <DrawerHeader className="sr-only">
                                    <DrawerTitle>Novo Orçamento</DrawerTitle>
                                    <DrawerDescription>Preencha os dados da nova proposta comercial</DrawerDescription>
                                </DrawerHeader>
                                <div className="p-4 flex-1 overflow-y-auto">
                                    <BudgetForm
                                        isInline
                                        patientId={id}
                                        initialBudget={editingBudget}
                                        onCancel={() => setShowBudgetForm(false)}
                                        onSaveSuccess={() => {
                                            setShowBudgetForm(false);
                                            loadPatientData();
                                        }}
                                    />
                                </div>
                            </DrawerContent>
                        </Drawer>

                        {/* Action Sheet (Opções do FAB) */}
                        <Drawer open={isActionSheetOpen} onOpenChange={setIsActionSheetOpen}>
                            <DrawerContent className="pb-safe rounded-t-[10px]">
                                <DrawerHeader className="sr-only">
                                    <DrawerTitle>Ações</DrawerTitle>
                                    <DrawerDescription>Escolha uma ação para o paciente</DrawerDescription>
                                </DrawerHeader>
                                <div className="p-4 space-y-2">
                                    <button onClick={() => { setShowBudgetForm(true); setIsActionSheetOpen(false); }} className="w-full bg-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400"><FileText size={20} /></div>
                                        <div className="text-left"><p className="font-bold text-slate-900 dark:text-white">Novo Orçamento</p></div>
                                    </button>
                                    <button onClick={() => { toast('Em breve!', { icon: '📷' }); setIsActionSheetOpen(false); }} className="w-full bg-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400"><Image size={20} /></div>
                                        <div className="text-left"><p className="font-bold text-slate-900 dark:text-white">Nova Foto</p></div>
                                    </button>
                                </div>
                            </DrawerContent>
                        </Drawer>
                    </div>
                </DrawerContent>
            </Drawer>
        );
    }

    // DESKTOP: Traditional Tabs View
    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-[70vw] p-0 gap-0 bg-slate-50 dark:bg-slate-900 h-full flex flex-col border-l shadow-2xl">
                <SheetHeader className="sr-only">
                    <SheetTitle>Prontuário de {patient?.name}</SheetTitle>
                    <SheetDescription>Visão detalhada do paciente, orçamentos e tratamentos</SheetDescription>
                </SheetHeader>
                {renderHeader()}
                {renderDesktopTabs()}
                <div ref={scrollContainerRef} tabIndex={-1} className="flex-1 overflow-y-auto min-h-0 bg-background scroll-smooth outline-none">
                    <div className="p-6 min-h-full">
                        {renderTabContent()}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};

export default PatientDetailSheet;
