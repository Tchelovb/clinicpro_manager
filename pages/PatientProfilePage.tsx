import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../src/lib/supabase";
import {
    ArrowLeft, Trash2, Phone, Mail,
    FileText, Image, Activity,
    CreditCard, Stethoscope, AlertTriangle, Smile, Sparkles,
    User, DollarSign, TrendingUp, Heart, CheckCircle,
    Plus, Camera, FilePlus, ChevronLeft, Lock, Minimize2, Maximize2,
    ScanFace, ChevronRight // Added for Workstation Cards
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "../src/lib/utils";
import * as Tabs from "@radix-ui/react-tabs";

// Imports from existing components to reuse logic
import { PatientInstallments } from "../components/PatientInstallments";
// Tabs removed, now using dedicated pages
import BudgetForm from "../components/BudgetForm";
import PatientForm from "../components/BudgetForm"; // Using Budget Form here
import { Sheet, SheetContent } from "../components/ui/sheet";

// --- CONTROLE DE ACESSO (RBAC) ---
const TAB_PERMISSIONS: Record<string, string[]> = {
    overview: ['MASTER', 'ADMIN', 'DENTIST', 'RECEPTION', 'FINANCIAL'],
    financial: ['MASTER', 'ADMIN', 'FINANCIAL', 'RECEPTION'],
    budgets: ['MASTER', 'ADMIN', 'DENTIST', 'FINANCIAL'],
    clinical: ['MASTER', 'ADMIN', 'DENTIST'], // 🔒 Sigilo Médico
    photos: ['MASTER', 'ADMIN', 'DENTIST']      // 🔒 Sigilo de Imagem
};

// --- Subcomponentes Visuais (Badges) ---
const ScoreBadge = ({ score }: { score?: string }) => {
    const badges = {
        DIAMOND: { bg: 'bg-gradient-to-r from-blue-600 to-purple-600', text: 'text-white', label: '💎 DIAMOND' },
        GOLD: { bg: 'bg-gradient-to-r from-yellow-600 to-amber-600', text: 'text-white', label: '⭐ GOLD' },
        STANDARD: { bg: 'bg-slate-700 dark:bg-slate-600', text: 'text-slate-300 dark:text-slate-200', label: 'STANDARD' },
        RISK: { bg: 'bg-rose-600', text: 'text-white', label: '⚠️ RISCO' }
    };
    const badge = badges[score as keyof typeof badges] || badges.STANDARD;
    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text} shadow-lg`}>
            {badge.label}
        </span>
    );
};

export const PatientProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { profile } = useAuth();
    const [searchParams] = useSearchParams();

    // Mode Detection
    const isAttendanceMode = searchParams.get('mode') === 'attendance';

    // Permissions Logic
    const userRole = profile?.role || 'RECEPTION';
    const allowedTabs = Object.keys(TAB_PERMISSIONS).filter(tab => TAB_PERMISSIONS[tab].includes(userRole));

    // State
    const [activeTab, setActiveTab] = useState(() => {
        if (isAttendanceMode) return 'clinical';
        if (allowedTabs.includes('overview')) return 'overview';
        return allowedTabs[0] || 'overview';
    });

    // Force redirect if tab forbidden
    useEffect(() => {
        if (!allowedTabs.includes(activeTab)) {
            setActiveTab(allowedTabs[0]);
        }
    }, [activeTab, allowedTabs]);

    const [loading, setLoading] = useState(true);
    const [patient, setPatient] = useState<any>(null);

    // Data States
    const [budgets, setBudgets] = useState<any[]>([]);
    const [insights, setInsights] = useState<any[]>([]);
    const [clinicalImages, setClinicalImages] = useState<any[]>([]);
    const [financialData, setFinancialData] = useState({ totalApproved: 0, totalPaid: 0, balanceDue: 0 });

    // Clinical Hub State


    // UI States
    const [isBudgetSheetOpen, setIsBudgetSheetOpen] = useState(false);
    const [isFABOpen, setIsFABOpen] = useState(false);

    useEffect(() => {
        if (id) {
            loadPatientData();
        }
    }, [id]);

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

            // Parallel Data Fetching
            const [b, i, img] = await Promise.all([
                supabase.from('budgets').select(`*, budget_items (*)`).eq('patient_id', id).order('created_at', { ascending: false }),
                supabase.from('ai_insights').select('*').eq('related_entity_id', id).in('status', ['OPEN', 'open', 'ACTIVE', 'active']).order('priority', { ascending: false }),
                supabase.from('clinical_images').select('*').eq('patient_id', id).order('created_at', { ascending: false })
            ]);

            setBudgets(b.data || []);
            setInsights(i.data || []);
            setClinicalImages(img.data || []);

        } catch (error) {
            console.error('Error loading patient:', error);
            toast.error('Erro ao carregar dados do paciente');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div></div>;
    }

    if (!patient) return <div>Paciente não encontrado</div>;

    const renderBudgets = () => (
        <div className="space-y-4 pt-6 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {budgets.map((budget) => (
                    <div key={budget.id} onClick={() => navigate(`/budgets/${budget.id}?patient=${id}`)} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all cursor-pointer group">
                        <div className="flex justify-between items-start mb-4">
                            <span className={cn("px-3 py-1 rounded-full text-xs font-bold",
                                budget.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                    budget.status === 'DRAFT' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'
                            )}>
                                {budget.status === 'APPROVED' ? 'Aprovado' : budget.status === 'DRAFT' ? 'Rascunho' : 'Em Análise'}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">#{budget.id.substring(0, 6)}</span>
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white mb-1 group-hover:text-blue-600">{budget.name || 'Orçamento sem nome'}</h3>
                        <p className="text-sm text-slate-500 mb-4">{new Date(budget.created_at).toLocaleDateString()}</p>
                        <div className="text-2xl font-black text-slate-900 dark:text-white">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(budget.total_value)}
                        </div>
                    </div>
                ))}

                {/* Add Budget Card */}
                <button
                    onClick={() => navigate(`/patients/${id}/budget-studio`)}
                    className="flex flex-col items-center justify-center h-full min-h-[160px] bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-all group"
                >
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Plus className="text-violet-600" size={24} />
                    </div>
                    <span className="font-bold text-slate-600 dark:text-slate-400 group-hover:text-violet-600">Novo Orçamento</span>
                </button>
            </div>
        </div>
    );

    const RestrictedAccess = () => (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Lock size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Acesso Restrito</h3>
            <p className="text-sm">Seu perfil ({userRole}) não tem permissão para visualizar esta área.</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
            {/* Sticky Header - Adapts to Mode */}
            <header className={cn(
                "sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-all",
                isAttendanceMode ? "py-2" : "py-4"
            )}>
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/patients')} className="p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400">
                            <ChevronLeft size={24} />
                        </button>

                        <div className="flex items-center gap-4 flex-1">
                            {!isAttendanceMode && (
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden border-2 border-white dark:border-slate-700 shadow-md">
                                    {patient.profile_photo_url ? (
                                        <img src={patient.profile_photo_url} alt={patient.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-slate-500 font-bold text-xl">
                                            {patient.name.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className={cn("font-bold text-slate-900 dark:text-white leading-none", isAttendanceMode ? "text-lg" : "text-xl md:text-2xl")}>{patient.name}</h1>
                                    <ScoreBadge score={patient.patient_score} />
                                    {isAttendanceMode && <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full animate-pulse">• EM ATENDIMENTO</span>}
                                </div>
                                {!isAttendanceMode && (
                                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                                        <span className="flex items-center gap-1"><Phone size={14} /> {patient.phone}</span>
                                        {patient.balance_due > 0 && (
                                            <span className="flex items-center gap-1 text-rose-600 font-bold bg-rose-50 dark:bg-rose-900/20 px-2 rounded-full">
                                                Devendo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(patient.balance_due)}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tabs Navigation - Filtered by Role */}
                    <div className={cn("overflow-x-auto scrollbar-hide", isAttendanceMode ? "mt-2 -mb-2" : "mt-6 -mb-4")}>
                        <div className="flex gap-6 min-w-max pb-4 px-2">
                            {['overview', 'financial', 'budgets', 'clinical', 'photos'].map((tab) => {
                                if (!allowedTabs.includes(tab)) return null;
                                return (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={cn(
                                            "pb-2 border-b-2 font-medium text-sm transition-all flex items-center gap-2",
                                            activeTab === tab
                                                ? "border-violet-600 text-violet-600 dark:text-violet-400"
                                                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                        )}
                                    >
                                        {tab === 'overview' && <User size={16} />}
                                        {tab === 'financial' && <DollarSign size={16} />}
                                        {tab === 'budgets' && <FileText size={16} />}
                                        {tab === 'clinical' && <Activity size={16} />}
                                        {tab === 'photos' && <Image size={16} />}

                                        {tab === 'overview' && "Visão Geral"}
                                        {tab === 'financial' && "Financeiro"}
                                        {tab === 'budgets' && "Orçamentos"}
                                        {tab === 'clinical' && "Prontuário"}
                                        {tab === 'photos' && "Fotos"}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </header>

            {/* Content Area */}
            <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
                {activeTab === 'overview' && allowedTabs.includes('overview') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                        {/* Summary Cards */}
                        <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl p-6 text-white shadow-xl shadow-purple-200 dark:shadow-none col-span-1 md:col-span-2 lg:col-span-1">
                            <h3 className="font-bold text-white/80 uppercase tracking-wider text-sm mb-1">Total Investido</h3>
                            <div className="text-4xl font-black mb-4">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financialData.totalPaid)}
                            </div>
                            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-medium">Saldo Devedor</span>
                                    <span className="font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financialData.balanceDue)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity / Insights */}
                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm md:col-span-2">
                            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                <Sparkles className="text-yellow-500" size={20} /> Insights Inteligentes
                            </h3>
                            {insights.length > 0 ? (
                                <div className="space-y-3">
                                    {insights.slice(0, 3).map((insight, idx) => (
                                        <div key={idx} className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-sm border border-blue-100 dark:border-blue-800 text-slate-700 dark:text-slate-300">
                                            {insight.content}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-slate-500 text-sm">Nenhum insight disponível no momento.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Fallback for blocked access */}
                {activeTab === 'overview' && !allowedTabs.includes('overview') && <RestrictedAccess />}


                {activeTab === 'financial' && (allowedTabs.includes('financial') ? (
                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                        <PatientInstallments patientId={id} />
                    </div>
                ) : <RestrictedAccess />)}

                {activeTab === 'budgets' && (allowedTabs.includes('budgets') ? (
                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                        {renderBudgets()}
                    </div>
                ) : <RestrictedAccess />)}

                {activeTab === 'clinical' && (allowedTabs.includes('clinical') ? (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">

                        {/* 1. CLINICAL HUB (Workstation Selector) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* GENERAL CARD */}
                            <div
                                onClick={() => navigate(`/patients/${id}/clinical/general`)}
                                className="group bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all cursor-pointer relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Stethoscope size={64} className="text-blue-600" />
                                </div>
                                <div className="flex flex-col h-full">
                                    <div className="w-14 h-14 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Stethoscope size={28} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Clínica Geral</h3>
                                    <p className="text-sm text-slate-500 mb-6">Restauradora, Endodontia & Periodontia.</p>
                                    <div className="mt-auto">
                                        <span className="text-blue-600 font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                                            Acessar Odontograma <ChevronRight size={16} />
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* HOF CARD */}
                            <div
                                onClick={() => navigate(`/patients/${id}/clinical/hof`)}
                                className="group bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-pink-200 dark:hover:border-pink-800 transition-all cursor-pointer relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Sparkles size={64} className="text-pink-600" />
                                </div>
                                <div className="flex flex-col h-full">
                                    <div className="w-14 h-14 rounded-xl bg-pink-50 dark:bg-pink-900/20 text-pink-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Sparkles size={28} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">HOF & Estética</h3>
                                    <p className="text-sm text-slate-500 mb-6">Harmonização Facial, Botox & Preenchedores.</p>
                                    <div className="mt-auto">
                                        <span className="text-pink-600 font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                                            Acessar Workstation <ChevronRight size={16} />
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* ORTHO CARD */}
                            <div
                                onClick={() => navigate(`/patients/${id}/clinical/ortho`)}
                                className="group bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-violet-200 dark:hover:border-violet-800 transition-all cursor-pointer relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <ScanFace size={64} className="text-violet-600" />
                                </div>
                                <div className="flex flex-col h-full">
                                    <div className="w-14 h-14 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <ScanFace size={28} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">Ortodontia</h3>
                                    <p className="text-sm text-slate-500 mb-6">Alinhadores, Aparelhos Fixos & Manutenção.</p>
                                    <div className="mt-auto">
                                        <span className="text-violet-600 font-bold text-sm flex items-center gap-2 group-hover:gap-3 transition-all">
                                            Acessar Painel Orto <ChevronRight size={16} />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Context Hint */}
                        <div className="text-center py-6 text-slate-400 italic">
                            Selecione uma especialidade acima para iniciar o atendimento.
                        </div>

                    </div>
                ) : <RestrictedAccess />)}

                {activeTab === 'photos' && (allowedTabs.includes('photos') ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-bottom-4 duration-500">
                        {clinicalImages.map((img, idx) => (
                            <div key={idx} className="aspect-square bg-slate-200 rounded-xl overflow-hidden relative group">
                                <img src={img.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="Clínica" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold">
                                    Ver
                                </div>
                            </div>
                        ))}
                        <button className="aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-500 hover:text-violet-600 hover:border-violet-500 hover:bg-violet-50 transition-all">
                            <Camera size={24} className="mb-2" />
                            <span className="text-xs font-bold">Adicionar Foto</span>
                        </button>
                    </div>
                ) : <RestrictedAccess />)}
            </main>

            {/* Actions FAB */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">
                {isFABOpen && (
                    <div className="flex flex-col gap-3 pointer-events-auto animate-in slide-in-from-bottom-10 fade-in duration-200 mb-2">
                        <button onClick={() => { setIsFABOpen(false); /* Add Photo */ }} className="flex items-center gap-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-3 rounded-full shadow-lg border border-slate-100 dark:border-slate-700 font-bold hover:scale-105 transition-transform">
                            <Camera size={20} className="text-purple-500" /> Nova Foto
                        </button>
                        <button onClick={() => { setIsFABOpen(false); /* Add Evolution */ }} className="flex items-center gap-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-3 rounded-full shadow-lg border border-slate-100 dark:border-slate-700 font-bold hover:scale-105 transition-transform">
                            <Activity size={20} className="text-blue-500" /> Nova Evolução
                        </button>
                        <button onClick={() => { setIsFABOpen(false); navigate(`/patients/${id}/budget-studio`); }} className="flex items-center gap-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-3 rounded-full shadow-lg border border-slate-100 dark:border-slate-700 font-bold hover:scale-105 transition-transform">
                            <FileText size={20} className="text-green-500" /> Novo Orçamento
                        </button>
                    </div>
                )}

                <button
                    onClick={() => setIsFABOpen(!isFABOpen)}
                    className={cn(
                        "w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 pointer-events-auto",
                        isFABOpen ? "bg-slate-800 text-white rotate-45" : "bg-violet-600 text-white hover:scale-110 active:scale-95"
                    )}
                >
                    <Plus size={28} />
                </button>
            </div>

            {/* New Budget Sheet Overlay */}
            <Sheet open={isBudgetSheetOpen} onOpenChange={setIsBudgetSheetOpen}>
                <SheetContent
                    side="right"
                    className="w-full sm:max-w-4xl h-[100dvh] p-0 border-none focus:outline-none flex flex-col"
                    aria-describedby={undefined}
                >
                    <div className="sr-only">Formulário de Criação de Orçamento</div>
                    <BudgetForm
                        patientId={id}
                        isInline={true}
                        onCancel={() => setIsBudgetSheetOpen(false)}
                        onSaveSuccess={() => {
                            setIsBudgetSheetOpen(false);
                            loadPatientData();
                            setActiveTab('budgets');
                        }}
                    />
                </SheetContent>
            </Sheet>

        </div>
    );
};
