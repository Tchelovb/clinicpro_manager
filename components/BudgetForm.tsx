import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BudgetItem, LeadStatus } from '../types';
import { usePatient } from '../hooks/usePatients';
import { useBudget, useBudgetOperations } from '../hooks/useBudgets';
import { useProcedures } from '../hooks/useProcedures';
import { usePriceTables } from '../hooks/usePriceTables';
import { useProfessionals } from '../hooks/useProfessionals';
import { useLeads } from '../hooks/useLeads';
import { useBudgetCalculator } from '../hooks/useFinancialCalculator';
import { FinancialSummaryPanel } from './budget/FinancialSummaryPanel';
import { InstallmentSchedule } from './budget/InstallmentSchedule';
import {
    ArrowLeft, Plus, Trash2, Save, CheckCircle,
    DollarSign, Briefcase, TrendingUp, Loader, FileText,
    MessageCircle, AlertCircle, Printer, Share2, ChevronDown, ChevronUp
} from 'lucide-react';
import { DocumentGeneratorModal } from './documents/DocumentGeneratorModal';
import { ProfitBar } from './profit/ProfitBar';
import { MarginAlert } from './profit/MarginAlert';
import { BudgetProfitSummary } from './profit/BudgetProfitSummary';
import { BudgetApprovalSheet } from './budgets/BudgetApprovalSheet';
import profitAnalysisService from '../services/profitAnalysisService';
import { fetchBudgetById } from '../services/budgetService';
import SecurityPinModal from './SecurityPinModal';
import { QuickAddDialog } from './shared/QuickAddDialog';
import { useQuickAdd } from '../hooks/useQuickAdd';
import { QUICK_ADD_CONFIGS } from '../types/quickAdd';
import { cn } from '../src/lib/utils';
import { Drawer, DrawerContent, DrawerTrigger } from './ui/drawer';
import toast from 'react-hot-toast';

// --- CONFIGURAÇÃO DE ESTILO IOS ---
// text-[16px] impede zoom automático no iOS
// h-[48px] garante área de toque confortável (Apple Human Interface Guidelines)
const inputClass = "w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-[16px] focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm h-[48px]";
const labelClass = "block text-[11px] font-bold text-slate-400 dark:text-slate-500 mb-1.5 uppercase tracking-wider ml-1";

interface BudgetFormProps {
    patientId?: string;
    initialBudget?: any;
    onCancel?: () => void;
    onSaveSuccess?: () => void;
    isInline?: boolean;
}

const BudgetForm: React.FC<BudgetFormProps> = ({
    patientId: propPatientId,
    initialBudget,
    onCancel,
    onSaveSuccess,
    isInline = false
}) => {
    const { id, budgetId: routeBudgetId } = useParams<{ id: string, budgetId?: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { profile } = useAuth();

    const patientId = propPatientId || searchParams.get('patient_id') || searchParams.get('patient') || id || '';
    const budgetId = initialBudget?.id || searchParams.get('id') || routeBudgetId;

    // Hooks
    const { data: patient, isLoading: loadingPatient } = usePatient(patientId);
    const { data: existingBudget } = useBudget(budgetId);
    const { createBudget, updateBudget, approveBudget, isCreating, isUpdating } = useBudgetOperations();
    const { procedures } = useProcedures();
    const { priceTables } = usePriceTables();
    const { professionals } = useProfessionals();
    const { leads, createLead } = useLeads();

    const existingOpportunity = existingBudget
        ? leads.find(l => l.budgetId === existingBudget.id && l.status !== LeadStatus.LOST && l.status !== LeadStatus.WON)
        : null;

    // Local State
    const [items, setItems] = useState<BudgetItem[]>([]);
    const [discount, setDiscount] = useState<number>(0);
    const [downPayment, setDownPayment] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<'Pix' | 'Cartão' | 'Boleto' | 'Dinheiro'>('Cartão');
    const [installments, setInstallments] = useState<number>(1);
    const [selectedProcedure, setSelectedProcedure] = useState('');
    const [selectedPriceTableId, setSelectedPriceTableId] = useState('');
    const [selectedProfessionalId, setSelectedProfessionalId] = useState('');
    const [toothNumber, setToothNumber] = useState('');
    const [face, setFace] = useState('');
    const [region, setRegion] = useState('');
    const [price, setPrice] = useState(0);
    const [qty, setQty] = useState(1);
    const [categoryId, setCategoryId] = useState('');
    const [isSavedLocally, setIsSavedLocally] = useState(false);
    const [budgetLoaded, setBudgetLoaded] = useState(false);

    // Financial & Profit State
    const [enableAnticipation, setEnableAnticipation] = useState(false);
    const [intermediationFee, setIntermediationFee] = useState(3.5);
    const [anticipationFeePerInstallment, setAnticipationFeePerInstallment] = useState(2.0);
    const [costPerMinute, setCostPerMinute] = useState<number>(0);
    const [budgetMarginAnalysis, setBudgetMarginAnalysis] = useState<any>(null);
    const [selectedSalesRepId, setSelectedSalesRepId] = useState('');
    const [showFinancialAnalysis, setShowFinancialAnalysis] = useState(false); // Collapsible controller

    // UI State
    const [showDocModal, setShowDocModal] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [showApprovalSheet, setShowApprovalSheet] = useState(false);

    // Quick Add Hook
    const quickAddProcedure = useQuickAdd({
        tableName: 'procedures',
        clinicId: profile?.clinic_id || '',
        successMessage: 'Procedimento criado com sucesso!',
        onSuccess: (newProc) => {
            setSelectedProcedure(newProc.name);
            setPrice(newProc.base_price || 0);
        }
    });

    // Helper: Determine Procedure Category
    const currentProc = procedures.find(p => p.name === selectedProcedure);
    const isMedicalOrAesthetic = currentProc && ['HOF', 'CIRURGIA', 'ESTETICA'].includes(currentProc.category || '');

    // --- EFEITOS (CARREGAMENTO E CÁLCULOS) ---

    // Initial Load - Procedure Defaults
    useEffect(() => {
        if (procedures.length > 0 && !selectedProcedure) {
            setSelectedProcedure(procedures[0].name);
            setPrice(procedures[0].price);
        }
    }, [procedures, selectedProcedure]);

    // Initial Load - Existing Budget
    useEffect(() => {
        if (!budgetId || budgetLoaded) return;
        const loadData = async () => {
            try {
                const data = await fetchBudgetById(budgetId);
                if (data) {
                    if (data.items?.length > 0) {
                        const mappedItems = data.items.map((item: any) => ({
                            id: item.id || Math.random().toString(36).substr(2, 9),
                            procedure: item.procedure_name || item.procedure || '',
                            region: item.region || '',
                            tooth_number: item.tooth_number || '',
                            face: item.face || '',
                            quantity: item.quantity || 1,
                            unitValue: item.unit_value || 0,
                            total: item.total_value || 0,
                            isExisting: true
                        }));
                        setItems(mappedItems);
                    }
                    if (data.discount) setDiscount(data.discount);
                    if (data.down_payment_value) setDownPayment(data.down_payment_value);
                    if (data.payment_config) {
                        setPaymentMethod(data.payment_config.method || 'Cartão');
                        setInstallments(data.payment_config.installments || 1);
                    }
                    if (data.price_table_id) setSelectedPriceTableId(data.price_table_id);
                    if (data.doctor_id) setSelectedProfessionalId(data.doctor_id);
                    if (data.category_id) setCategoryId(data.category_id);
                    if (data.sales_rep_id) setSelectedSalesRepId(data.sales_rep_id);
                    setBudgetLoaded(true);
                }
            } catch (err) {
                console.error("Erro ao carregar orçamento:", err);
            }
        };
        loadData();
    }, [budgetId, budgetLoaded]);

    // Auto-select Professional/Table for New Budget
    useEffect(() => {
        if (budgetId) return;
        if (priceTables.length > 0 && !selectedPriceTableId) {
            const particularTable = priceTables.find(pt => pt.type === 'PARTICULAR');
            if (particularTable) setSelectedPriceTableId(particularTable.id);
        }
        if (!selectedProfessionalId && professionals.length > 0) {
            const currentUserAsProf = professionals.find(p => p.id === profile?.id);
            setSelectedProfessionalId(currentUserAsProf ? currentUserAsProf.id : professionals[0].id);
        }
    }, [budgetId, priceTables, professionals, profile]);

    // Pricing Update
    useEffect(() => {
        const proc = procedures.find(p => p.name === selectedProcedure);
        if (proc) {
            let finalPrice = proc.price;
            if (selectedPriceTableId) {
                const table = priceTables.find(t => t.id === selectedPriceTableId);
                const item = table?.items?.find((i: any) => i.procedureId === proc.id || i.procedure_name === proc.name);
                if (item) finalPrice = item.price;
            }
            setPrice(finalPrice);
        }
    }, [selectedProcedure, procedures, selectedPriceTableId, priceTables]);

    // Cost Per Minute
    useEffect(() => {
        const fetchCost = async () => {
            if (profile?.clinic_id) {
                const cost = await profitAnalysisService.getCostPerMinute(profile.clinic_id);
                setCostPerMinute(cost);
            }
        };
        fetchCost();
    }, [profile?.clinic_id]);

    // Real-time Margin Calculation
    useEffect(() => {
        let isMounted = true;
        const calculateMargin = async () => {
            if (items.length === 0 || costPerMinute === 0) {
                if (isMounted) setBudgetMarginAnalysis(null);
                return;
            }

            const itemsForAnalysis = items.map(item => {
                const proc = procedures.find(p => p.name === item.procedure);
                return {
                    procedure_id: proc?.id || '',
                    procedure_name: item.procedure,
                    unit_price: item.unitValue,
                    quantity: item.quantity
                };
            }).filter(i => i.procedure_id);

            if (itemsForAnalysis.length === 0) {
                if (isMounted) setBudgetMarginAnalysis(null);
                return;
            }

            const analysis = await profitAnalysisService.calculateBudgetMargin(
                itemsForAnalysis,
                costPerMinute,
                0, 0,
                selectedSalesRepId || undefined,
                profile?.clinic_id,
                categoryId || undefined
            );

            if (isMounted) {
                // deep compare for stability
                setBudgetMarginAnalysis((prev: any) => JSON.stringify(prev) === JSON.stringify(analysis) ? prev : analysis);
            }
        };

        const timeoutId = setTimeout(calculateMargin, 800); // 800ms debounce
        return () => { isMounted = false; clearTimeout(timeoutId); };
    }, [items, costPerMinute, selectedSalesRepId, profile?.clinic_id, categoryId, procedures]);

    // Financial Totals
    const subtotal = items.reduce((acc, item) => acc + item.total, 0);
    const finalTotal = Math.max(0, subtotal - discount);

    // BOS 2.0: Financial Calculator
    const { calculatedValues, loading: calcLoading } = useBudgetCalculator(
        finalTotal,
        downPayment,
        installments,
        paymentMethod === 'Cartão' ? 'CREDIT_CARD' : paymentMethod === 'Boleto' ? 'BOLETO' : 'CASH'
    );

    // BOS 2.0: Anticipation Engine
    const anticipationCalculation = React.useMemo(() => {
        if (!enableAnticipation || finalTotal === 0) {
            return { enabled: false, totalValue: finalTotal, intermediationCost: 0, anticipationCost: 0, netReceive24h: finalTotal, effectiveLoss: 0, effectiveLossPercent: 0 };
        }
        const intermediationCost = (finalTotal * intermediationFee) / 100;
        const anticipationCost = (finalTotal * anticipationFeePerInstallment * installments) / 100;
        const totalFees = intermediationCost + anticipationCost;
        const netReceive24h = finalTotal - totalFees;
        return {
            enabled: true,
            totalValue: finalTotal,
            intermediationCost,
            anticipationCost,
            totalFees,
            netReceive24h,
            effectiveLoss: totalFees,
            effectiveLossPercent: (totalFees / finalTotal) * 100
        };
    }, [enableAnticipation, finalTotal, intermediationFee, anticipationFeePerInstallment, installments]);

    // --- HANDLERS ---

    const handleAddItem = () => {
        const newItem: BudgetItem = {
            id: Math.random().toString(36).substr(2, 5),
            procedure: selectedProcedure,
            region: isMedicalOrAesthetic ? region : 'Geral',
            tooth_number: !isMedicalOrAesthetic ? toothNumber : '',
            face: !isMedicalOrAesthetic ? face : '',
            quantity: qty,
            unitValue: price,
            total: price * qty
        };
        setItems([...items, newItem]);
        setItems([...items, newItem]);
        setQty(1);
        setRegion('');
        setToothNumber('');
        setFace('');
    };

    const handleRemoveItem = (itemId: string) => {
        setItems(items.filter(i => i.id !== itemId));
    };

    const handleSave = () => {
        if (!selectedPriceTableId || !selectedProfessionalId || items.length === 0) {
            toast.error("Preencha campos obrigatórios (Profissional, Tabela) e adicione procedimentos.");
            return;
        }

        if (!patient || !patient.id) {
            toast.error("Erro crítico: Paciente não identificado.");
            return;
        }

        console.log("Saving Budget Payload...", { items, discount, finalTotal });

        // --- SANITIZAÇÃO DE DADOS (CRASH FIX & 400 ERROR) ---
        // FIX: Provide keys expected by useBudgets.ts (unitValue, total)
        const cleanItems = items.map(item => ({
            procedure: item.procedure,
            quantity: Number(item.quantity) || 1,
            unitValue: Number(item.unitValue) || 0, // camelCase for hook
            total: Number(item.total) || 0,         // camelCase for hook
            // SECURITY: Ensure correct fields for HOF vs Clinical
            // CRITICAL FIX: Convert empty strings to null for integer/numeric columns
            tooth_number: item.tooth_number ? parseInt(String(item.tooth_number)) : null,
            face: item.face || null,
            region: item.region || null
        }));

        const payload = {
            doctorId: selectedProfessionalId,
            priceTableId: selectedPriceTableId,
            salesRepId: selectedSalesRepId || null,
            totalValue: subtotal,
            finalValue: finalTotal,
            discount: discount,
            items: cleanItems,
            paymentConfig: { method: paymentMethod, installments }
        };

        console.log("Final Payload to Service:", payload);

        if (budgetId) {
            updateBudget({
                budgetId: budgetId,
                data: payload
            }, {
                onSuccess: () => toast.success("Orçamento atualizado com sucesso!"),
                onError: (err: any) => toast.error("Erro ao atualizar: " + err.message)
            });
        } else {
            createBudget({
                patientId: patient.id,
                data: payload
            }, {
                onSuccess: (data: any) => {
                    toast.success("Orçamento salvo com sucesso!");
                    setIsSavedLocally(true);
                    if (isInline && onSaveSuccess) {
                        onSaveSuccess();
                        return;
                    }
                    navigate(`/budgets/new?id=${data.id}&patient_id=${patient.id}`, { replace: true });
                },
                onError: (err: any) => {
                    console.error("Budget Creation Error:", err);
                    toast.error("Erro ao salvar: " + (err.message || "Verifique os dados"));
                }
            });
        }
    };

    const handleSecureApprove = async () => {
        const marginPercent = budgetMarginAnalysis?.marginPercent ?? 0;
        if (marginPercent < 20) {
            setShowPinModal(true);
            return;
        }
        setShowApprovalSheet(true);
    };

    const handleWhatsApp = () => {
        if (!patient?.phone) {
            toast.error("Paciente sem telefone");
            return;
        }
        const message = `Olá ${patient.name}, segue o orçamento no valor de R$ ${finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        window.open(`https://wa.me/55${patient.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    };

    if (loadingPatient) return <div className="flex justify-center p-10"><Loader className="animate-spin" /></div>;
    if (!patient) return <div className="p-8">Paciente não encontrado.</div>;

    return (
        // Container Principal com PB-32 (Safe Area Padding)
        // FIX: h-full overflow-y-auto for correct scrolling in Sheet (Inline Mode)
        <div className={`flex flex-col ${isInline ? 'bg-transparent pb-32 h-full overflow-y-auto' : 'min-h-screen bg-slate-50 dark:bg-slate-950 pb-32'}`}>

            {/* --- HEADER --- */}
            {isInline ? (
                <div className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center gap-2 mb-4">
                    <button onClick={onCancel} className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-medium text-[16px]">
                        <ArrowLeft size={20} />
                        Voltar
                    </button>
                    <div className="flex-1 text-center font-bold text-slate-900 dark:text-white">
                        {existingBudget ? 'Editar' : 'Novo Orçamento'}
                    </div>
                    {/* Placeholder para balancear o layout */}
                    <div className="w-[70px]"></div>
                </div>
            ) : (
                <div className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-slate-100 rounded-full">
                        <ArrowLeft size={24} className="text-slate-900 dark:text-white" />
                    </button>
                    <div className="text-center">
                        <h1 className="text-[17px] font-semibold text-slate-900 dark:text-white">
                            {existingBudget ? 'Orçamento' : 'Novo Orçamento'}
                        </h1>
                        <p className="text-[11px] text-slate-500 uppercase tracking-wide">{patient.name}</p>
                    </div>

                    <div className="flex gap-2">
                        {existingBudget && (
                            /* MOBILE DRAWER TRIGGER */
                            <div className="md:hidden">
                                <Drawer>
                                    <DrawerTrigger asChild>
                                        <button className="p-2 -mr-2 text-blue-600 hover:bg-blue-50 rounded-full">
                                            <Share2 size={24} />
                                        </button>
                                    </DrawerTrigger>
                                    <DrawerContent className="focus:outline-none">
                                        <div className="p-4 space-y-3 pb-10">
                                            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-4" />
                                            <h3 className="text-center font-bold text-slate-900 mb-4">Ações do Orçamento</h3>

                                            <button onClick={() => setShowDocModal(true)} className="w-full flex items-center gap-3 p-4 bg-slate-50 rounded-xl font-medium text-slate-700 active:scale-95 transition-transform">
                                                <FileText className="text-blue-600" /> Gerar Documentos
                                            </button>

                                            <button onClick={handleWhatsApp} className="w-full flex items-center gap-3 p-4 bg-slate-50 rounded-xl font-medium text-slate-700 active:scale-95 transition-transform">
                                                <MessageCircle className="text-green-600" /> Enviar WhatsApp
                                            </button>

                                            {existingBudget.status === 'Em Análise' && (
                                                <button onClick={handleSecureApprove} className="w-full flex items-center gap-3 p-4 bg-green-600 rounded-xl font-bold text-white active:scale-95 transition-transform">
                                                    <CheckCircle /> Aprovar Orçamento
                                                </button>
                                            )}
                                        </div>
                                    </DrawerContent>
                                </Drawer>
                            </div>
                        )}
                        {!isInline && !existingBudget && (
                            <div className="w-8"></div> // Spacer
                        )}
                    </div>
                </div>
            )}

            {/* Quick Add Dialog */}
            <QuickAddDialog
                open={quickAddProcedure.isOpen}
                onOpenChange={quickAddProcedure.setIsOpen}
                config={QUICK_ADD_CONFIGS.procedure}
                onSave={quickAddProcedure.createItem}
                isLoading={quickAddProcedure.isLoading}
            />

            {/* --- CONTEÚDO SCROLLÁVEL --- */}
            <div className="flex-1 max-w-3xl mx-auto px-4 py-6 space-y-6">

                {/* 1. SELEÇÕES INICIAIS (INSET STYLE) */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Configuração</h2>
                        {existingBudget && (
                            <span className="font-mono text-xs text-slate-400">#{existingBudget.id.slice(0, 6).toUpperCase()}</span>
                        )}
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                            <label className={labelClass}>Tabela</label>
                            <select className={inputClass} value={selectedPriceTableId} onChange={e => setSelectedPriceTableId(e.target.value)}>
                                <option value="">Selecione...</option>
                                {priceTables.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                            </select>
                        </div>
                        <div className="p-4">
                            <label className={labelClass}>Profissional</label>
                            <select className={inputClass} value={selectedProfessionalId} onChange={e => setSelectedProfessionalId(e.target.value)}>
                                <option value="">Selecione...</option>
                                {professionals.map(prof => <option key={prof.id} value={prof.id}>{prof.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* 2. ADIÇÃO DE ITENS */}
                <div className="space-y-4">
                    <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">Procedimento</h2>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className={labelClass}>Nome</label>
                                <select className={inputClass} value={selectedProcedure} onChange={e => setSelectedProcedure(e.target.value)}>
                                    {procedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                </select>
                            </div>
                            <div className="pt-[26px]">
                                <button type="button" onClick={() => quickAddProcedure.setIsOpen(true)} className="h-[48px] w-[48px] bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-200 transition-colors">
                                    <Plus size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Inteligência de Região: HOF/Cirurgia vs Dente/Face */}
                        {isMedicalOrAesthetic ? (
                            <div>
                                <label className={labelClass}>Região</label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    value={region}
                                    onChange={e => setRegion(e.target.value)}
                                    placeholder="Ex: Pálpebra, Pescoço..."
                                />
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Dente</label>
                                    <input type="text" className={inputClass} value={toothNumber} onChange={e => setToothNumber(e.target.value)} placeholder="Ex: 11" inputMode="numeric" />
                                </div>
                                <div>
                                    <label className={labelClass}>Face</label>
                                    <input type="text" className={inputClass} value={face} onChange={e => setFace(e.target.value)} placeholder="Ex: V" />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Valor (R$)</label>
                                <input type="number" className={inputClass} value={price} onChange={e => setPrice(parseFloat(e.target.value))} inputMode="decimal" />
                            </div>
                            <div>
                                <label className={labelClass}>QTD</label>
                                <input type="number" className={inputClass} value={qty} onChange={e => setQty(parseInt(e.target.value))} inputMode="numeric" />
                            </div>
                        </div>

                        <button onClick={handleAddItem} className="w-full h-[52px] mt-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-[16px] active:scale-[0.98] transition-all shadow-lg">
                            Adicionar ao Orçamento
                        </button>
                    </div>
                </div>

                {/* 3. LISTA DE ITENS */}
                {items.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex justify-between items-end px-1">
                            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Itens ({items.length})</h2>
                            <span className="text-xs font-bold text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">Total: R$ {subtotal.toLocaleString('pt-BR')}</span>
                        </div>
                        <div className="space-y-3">
                            {items.map((item, index) => (
                                <div key={item.id || index} className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 relative">
                                    <div className="pr-10">
                                        <h4 className="font-bold text-slate-900 dark:text-white text-[15px]">{item.procedure}</h4>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {item.quantity}x R$ {item.unitValue.toLocaleString('pt-BR')}
                                            {item.region && ` • ${item.region}`}
                                            {item.tooth_number && ` • Dente ${item.tooth_number}`}
                                        </p>
                                    </div>
                                    <div className="absolute top-4 right-4 text-right">
                                        <div className="font-bold text-blue-600 dark:text-blue-400">R$ {item.total.toLocaleString('pt-BR')}</div>
                                    </div>
                                    <button onClick={() => handleRemoveItem(item.id)} className="absolute bottom-3 right-3 p-2 text-slate-300 hover:text-red-500">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 4. PAGAMENTO */}
                <div className="space-y-4">
                    <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">Pagamento</h2>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Desconto</label>
                                <input type="number" className={inputClass} value={discount} onChange={e => setDiscount(parseFloat(e.target.value))} />
                            </div>
                            <div>
                                <label className={labelClass}>Entrada</label>
                                <input type="number" className={inputClass} value={downPayment} onChange={e => setDownPayment(parseFloat(e.target.value))} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>Método</label>
                                <select className={inputClass} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)}>
                                    <option value="Cartão">Cartão</option>
                                    <option value="Boleto">Boleto</option>
                                    <option value="Pix">Pix</option>
                                    <option value="Dinheiro">Dinheiro</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Parcelas</label>
                                <select className={inputClass} value={installments} onChange={e => setInstallments(parseInt(e.target.value))} disabled={['Pix', 'Dinheiro'].includes(paymentMethod)}>
                                    {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}x</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ANALYTICS & SUMMARY (Collapsible) */}
                <div className="space-y-4">
                    <button
                        onClick={() => setShowFinancialAnalysis(!showFinancialAnalysis)}
                        className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 py-2 transition-colors uppercase tracking-wider"
                    >
                        {showFinancialAnalysis ? 'Ocultar' : 'Ver'} Análise de Lucratividade
                        {showFinancialAnalysis ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {showFinancialAnalysis && (
                        <div className="animate-in slide-in-from-top-4 fade-in duration-300 space-y-4">
                            {budgetMarginAnalysis && costPerMinute > 0 && (
                                <ProfitBar
                                    price={budgetMarginAnalysis.totalPrice}
                                    profit={budgetMarginAnalysis.totalProfit}
                                    marginPercent={budgetMarginAnalysis.marginPercent}
                                    status={(budgetMarginAnalysis.marginPercent ?? 0) >= 30 ? 'excellent' : 'warning'}
                                />
                            )}

                            {calculatedValues && !calcLoading && (
                                <FinancialSummaryPanel
                                    totalValue={finalTotal}
                                    downPayment={downPayment}
                                    installments={installments}
                                    installmentValue={calculatedValues.installmentValue}
                                    totalFees={calculatedValues.totalFees}
                                    netReceive={calculatedValues.netReceive}
                                    cashIn24h={calculatedValues.cashIn24h}
                                    anticipationCost={calculatedValues.anticipationCost}
                                    daysToReceive={calculatedValues.daysToReceive}
                                    recommendation={calculatedValues.recommendation}
                                    estimatedProfit={calculatedValues.estimatedProfit}
                                    estimatedMarginPercent={calculatedValues.estimatedMarginPercent}
                                    isAnticipationViable={calculatedValues.isAnticipationViable}
                                    paymentMethod={paymentMethod}
                                />
                            )}
                        </div>
                    )}
                </div>

            </div>

            {/* --- FOOTER FLUTUANTE (FIXED BOTTOM) --- */}
            {/* z-50 para ficar acima do conteúdo, backdrop-blur para estilo iOS */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 p-4 pb-[max(16px,env(safe-area-inset-bottom))] shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                <div className="flex gap-3 max-w-3xl mx-auto">
                    {/* Botão Secundário (Só aparece se editando) */}
                    {existingBudget && (
                        <button onClick={() => setShowDocModal(true)} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold h-[52px] rounded-2xl active:scale-95 transition-all">
                            Docs
                        </button>
                    )}

                    {/* Botão Primário (Salvar) */}
                    <button
                        onClick={handleSave}
                        disabled={isCreating || isUpdating}
                        className={`flex-2 w-full bg-blue-600 text-white font-bold h-[52px] rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-blue-600/30 ${existingBudget ? 'flex-[2]' : ''}`}
                    >
                        {isCreating || isUpdating ? <Loader className="animate-spin" /> : <Save size={20} />}
                        {existingBudget ? 'Salvar Alterações' : 'Salvar Orçamento'}
                    </button>
                </div>
            </div>

            {/* MODAIS E SHEETS */}
            {existingBudget && (
                <>
                    <DocumentGeneratorModal
                        isOpen={showDocModal}
                        budget={existingBudget}
                        patient={patient}
                        items={items}
                        professional={{ name: professionals?.find(p => p.id === selectedProfessionalId)?.name || 'Profissional' }}
                        onClose={() => setShowDocModal(false)}
                    />
                    <BudgetApprovalSheet
                        open={showApprovalSheet}
                        onOpenChange={setShowApprovalSheet}
                        budget={existingBudget}
                        clinicId={profile?.clinic_id || ''}
                        onSuccess={() => navigate(`/patients/${patient.id}`)}
                    />
                    <SecurityPinModal
                        isOpen={showPinModal}
                        onClose={() => setShowPinModal(false)}
                        onSuccess={() => setShowApprovalSheet(true)}
                        title="Profit Guardian Lock"
                        description="Margem Baixa"
                        actionType="BUDGET_OVERRIDE"
                        entityType="BUDGET"
                        entityId={existingBudget?.id}
                        entityName={patient.name}
                    />
                </>
            )}
        </div>
    );
};

export default BudgetForm;
