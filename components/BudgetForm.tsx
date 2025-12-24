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
    DollarSign, Briefcase, TrendingUp, MoreVertical, Loader, FileText,
    Printer, MessageCircle
} from 'lucide-react';
import { DocumentGeneratorModal } from './documents/DocumentGeneratorModal';
import { ProfitBar } from './profit/ProfitBar';
import { MarginAlert } from './profit/MarginAlert';
import { BudgetProfitSummary } from './profit/BudgetProfitSummary';
import profitAnalysisService from '../services/profitAnalysisService';
import { fetchBudgetById } from '../services/budgetService';
import SecurityPinModal from './SecurityPinModal';


// Inputs larger on mobile for touch
const inputClass = "w-full bg-white text-gray-900 border border-gray-200 rounded-lg p-3 md:p-2.5 text-base md:text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all shadow-input h-12 md:h-10";
const labelClass = "block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase";

const BudgetForm: React.FC = () => {
    const { id, budgetId: routeBudgetId } = useParams<{ id: string, budgetId?: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { profile } = useAuth();

    // Get patient_id from query params or route params
    const patientId = searchParams.get('patient_id') || searchParams.get('patient') || id || '';

    // Get budget_id from query params (for edit mode) or route params
    const budgetId = searchParams.get('id') || routeBudgetId;

    // Hooks
    const { data: patient, isLoading: loadingPatient } = usePatient(patientId);
    const { data: existingBudget, isLoading: loadingBudget } = useBudget(budgetId);
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
    const [region, setRegion] = useState('');
    const [toothNumber, setToothNumber] = useState('');
    const [face, setFace] = useState('');
    const [price, setPrice] = useState(0);
    const [qty, setQty] = useState(1);
    const [categoryId, setCategoryId] = useState('');
    const [isSavedLocally, setIsSavedLocally] = useState(false);
    const [budgetLoaded, setBudgetLoaded] = useState(false);
    const isInitialMount = React.useRef(true);

    // Financial Anticipation Engine
    const [enableAnticipation, setEnableAnticipation] = useState(false);
    const [intermediationFee, setIntermediationFee] = useState(3.5); // % taxa de intermediação
    const [anticipationFeePerInstallment, setAnticipationFeePerInstallment] = useState(2.0); // % por parcela

    // UI State
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [showDocModal, setShowDocModal] = useState(false);

    // Profit Analysis State
    const [costPerMinute, setCostPerMinute] = useState<number>(0);
    const [budgetMarginAnalysis, setBudgetMarginAnalysis] = useState<any>(null);
    const [selectedSalesRepId, setSelectedSalesRepId] = useState('');

    // Initial Load - Procedure
    useEffect(() => {
        if (procedures.length > 0 && !selectedProcedure) {
            setSelectedProcedure(procedures[0].name);
            setPrice(procedures[0].price);
        }
    }, [procedures, selectedProcedure]);

    // Initial Load - Existing Budget (Stable)
    useEffect(() => {
        // Impede que o efeito rode se já carregou ou se não há ID
        if (!budgetId || budgetLoaded) return;

        const loadData = async () => {
            try {
                const data = await fetchBudgetById(budgetId);
                if (data) {
                    // Mapeamento dos itens com flag de proteção e ID temporário estável
                    if (data.items && data.items.length > 0) {
                        const mappedItems = data.items.map((item: any) => ({
                            id: item.id || Math.random().toString(36).substr(2, 9),
                            procedure: item.procedure_name || item.procedure || '',
                            region: item.region || 'Geral',
                            tooth_number: item.tooth_number || '',
                            face: item.face || '',
                            quantity: item.quantity || 1,
                            unitValue: item.unit_value || 0,
                            total: item.total_value || 0,
                            tempId: crypto.randomUUID(), // Estabiliza a lista no React
                            isExisting: true
                        }));
                        setItems(mappedItems);
                        console.log("✅ Budget stable load completed.");
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
                    isInitialMount.current = false;
                }
            } catch (err) {
                console.error("❌ Error in stable load:", err);
            }
        };

        loadData();
    }, [budgetId, budgetLoaded]);

    // Defaults for New Budget
    useEffect(() => {
        if (budgetId) return; // Only for new budgets

        // Auto-select particular price table
        if (priceTables.length > 0 && !selectedPriceTableId) {
            const particularTable = priceTables.find(pt => pt.type === 'PARTICULAR');
            if (particularTable) setSelectedPriceTableId(particularTable.id);
        }

        // Auto-select logged user or first professional
        if (!selectedProfessionalId && professionals.length > 0) {
            const currentUserAsProf = professionals.find(p => p.id === profile?.id);
            if (currentUserAsProf) {
                setSelectedProfessionalId(currentUserAsProf.id);
            } else {
                setSelectedProfessionalId(professionals[0].id);
            }
        }
    }, [budgetId, priceTables, professionals, profile, selectedPriceTableId, selectedProfessionalId]);

    // Pricing Logic
    useEffect(() => {
        const proc = procedures.find(p => p.name === selectedProcedure);
        if (proc) {
            let finalPrice = proc.price;
            if (selectedPriceTableId) {
                const table = priceTables.find(t => t.id === selectedPriceTableId);
                const item = table?.items?.find((i: any) => i.procedureId === proc.id || i.procedure_name === proc.name || i.procedureName === proc.name);
                if (item) {
                    finalPrice = item.price;
                }
            }
            setPrice(finalPrice);
        }
    }, [selectedProcedure, procedures, selectedPriceTableId, priceTables]);

    // Reset installments when payment method is cash/pix (not boleto or card)
    useEffect(() => {
        if (paymentMethod === 'Pix' || paymentMethod === 'Dinheiro') {
            setInstallments(1);
        }
    }, [paymentMethod]);

    // Buscar custo por minuto da clínica
    useEffect(() => {
        const fetchCostPerMinute = async () => {
            if (profile?.clinics?.id) {
                const cost = await profitAnalysisService.getCostPerMinute(profile.clinics.id);
                setCostPerMinute(cost);
            }
        };
        fetchCostPerMinute();
    }, [profile]);

    // Calcular margem em tempo real
    useEffect(() => {
        let isMounted = true;

        const calculateMargin = async () => {
            if (items.length === 0 || costPerMinute === 0) {
                if (isMounted) setBudgetMarginAnalysis(null);
                return;
            }

            // Mapear itens para formato esperado pelo serviço
            const itemsForAnalysis = items.map(item => {
                const proc = procedures.find(p => p.name === item.procedure);
                return {
                    procedure_id: proc?.id || '',
                    procedure_name: item.procedure,
                    unit_price: item.unitValue,
                    quantity: item.quantity
                };
            });

            // Filter out items without procedure IDs to prevent errors
            const validItemsForAnalysis = itemsForAnalysis.filter(i => i.procedure_id && i.procedure_id.length > 5);

            if (validItemsForAnalysis.length === 0) return;

            // Calcular margem
            const analysis = await profitAnalysisService.calculateBudgetMargin(
                validItemsForAnalysis,
                costPerMinute,
                0, // taxRate
                0, // cardFeeRate
                selectedSalesRepId || undefined,
                profile?.clinics?.id,
                categoryId || undefined
            );

            if (isMounted) {
                // Prevent state update if analysis hasn't changed meaningfully to stop loops
                setBudgetMarginAnalysis((prev: any) => {
                    if (JSON.stringify(prev) === JSON.stringify(analysis)) return prev;
                    return analysis;
                });
            }
        };

        const timeoutId = setTimeout(calculateMargin, 500); // Debounce 500ms
        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, [
        // Use stringified versions for deep comparison stability
        JSON.stringify(items.map(i => ({ id: i.id, p: i.procedure, q: i.quantity, v: i.unitValue }))),
        costPerMinute,
        // Procedures usually don't change often, but if reference is unstable, we check length or ID hash?
        // JSON.stringify is safer for now if list is not huge.
        // Assuming procedures list is stable enough or we debounce.
        selectedSalesRepId,
        profile?.clinics?.id,
        categoryId
    ]);

    // Calculate values BEFORE early returns
    const subtotal = items.reduce((acc, item) => acc + item.total, 0);
    const finalTotal = Math.max(0, subtotal - discount);

    // BOS 2.0: Financial Calculator Integration (MUST be before early returns)
    const { calculatedValues, loading: calcLoading } = useBudgetCalculator(
        finalTotal,
        downPayment,
        installments,
        paymentMethod === 'Cartão' ? 'CREDIT_CARD' :
            paymentMethod === 'Boleto' ? 'BOLETO' :
                'CASH'
    );

    // BOS: Margin Calculation (Legacy - mantido para compatibilidade)
    const totalCost = items.reduce((acc, item) => {
        const proc = procedures.find(p => p.name === item.procedure);
        return acc + (proc?.cost?.total_cost || 0) * item.quantity;
    }, 0);
    const marginValue = finalTotal - totalCost;
    const marginPercent = finalTotal > 0 ? (marginValue / finalTotal) * 100 : 0;
    const isMarginLow = marginPercent < 20;

    // BOS 2.0: Anticipation Engine - Cálculo de Antecipação de Recebíveis
    const anticipationCalculation = React.useMemo(() => {
        if (!enableAnticipation || finalTotal === 0) {
            return {
                enabled: false,
                totalValue: finalTotal,
                intermediationCost: 0,
                anticipationCost: 0,
                totalFees: 0,
                netReceive24h: finalTotal,
                effectiveLoss: 0,
                effectiveLossPercent: 0
            };
        }

        // 1. Taxa de Intermediação (sobre o total)
        const intermediationCost = (finalTotal * intermediationFee) / 100;

        // 2. Taxa de Antecipação (por parcela adiantada)
        const anticipationCost = (finalTotal * anticipationFeePerInstallment * installments) / 100;

        // 3. Total de taxas
        const totalFees = intermediationCost + anticipationCost;

        // 4. Líquido que cai na conta em 24h
        const netReceive24h = finalTotal - totalFees;

        // 5. Perda efetiva
        const effectiveLoss = totalFees;
        const effectiveLossPercent = (effectiveLoss / finalTotal) * 100;

        return {
            enabled: true,
            totalValue: finalTotal,
            intermediationCost,
            anticipationCost,
            totalFees,
            netReceive24h,
            effectiveLoss,
            effectiveLossPercent
        };
    }, [enableAnticipation, finalTotal, intermediationFee, anticipationFeePerInstallment, installments]);

    if (loadingPatient) return <div className="p-8 flex justify-center"><Loader className="animate-spin text-blue-600" /></div>;
    if (!patient) return <div className="p-8">Paciente não encontrado.</div>;

    const handleAddItem = () => {
        const newItem: BudgetItem = {
            id: Math.random().toString(36).substr(2, 5),
            procedure: selectedProcedure,
            region: region || 'Geral',
            tooth_number: toothNumber,
            face: face,
            quantity: qty,
            unitValue: price,
            total: price * qty
        };
        setItems([...items, newItem]);
        setQty(1);
    };

    const handleRemoveItem = (itemId: string) => {
        setItems(items.filter(i => i.id !== itemId));
    };

    const handleSave = () => {
        if (!selectedPriceTableId || !selectedProfessionalId || items.length === 0) {
            alert("Preencha todos os campos obrigatórios e adicione itens.");
            return;
        }

        if (!patient || !patient.id) {
            alert("Erro crítico: Paciente não identificado. Tente recarregar a página.");
            return;
        }

        if (budgetId) {
            // Update existing budget
            const budgetData = {
                patient_id: patient.id,
                doctor_id: selectedProfessionalId,
                price_table_id: selectedPriceTableId,
                category_id: categoryId,
                items,
                total_value: subtotal,
                discount,
                final_value: finalTotal,
                payment_config: { method: paymentMethod, installments },
                status: 'DRAFT'
            };
            updateBudget({
                budgetId: budgetId,
                data: {
                    doctorId: selectedProfessionalId,
                    priceTableId: selectedPriceTableId,
                    salesRepId: selectedSalesRepId || null,
                    totalValue: subtotal,
                    discount,
                    finalValue: finalTotal,
                    items,
                    paymentConfig: { method: paymentMethod, installments }
                }
            });
        } else {
            // Create new budget - CORRECT API FORMAT
            createBudget({
                patientId: patient.id,
                data: {
                    doctorId: selectedProfessionalId,
                    priceTableId: selectedPriceTableId,
                    salesRepId: selectedSalesRepId || null,
                    totalValue: subtotal,
                    finalValue: finalTotal,
                    discount: discount,
                    items: items,
                    paymentConfig: { method: paymentMethod, installments }
                }
            }, {
                onSuccess: (data: any) => {
                    setIsSavedLocally(true);
                    // Navigate to same page but with ID to enable "Edit Mode" and show action buttons
                    navigate(`/budgets/new?id=${data.id}&patient_id=${patient.id}`, { replace: true });
                }
            });
        }
    };


    // Security PIN State
    const [showPinModal, setShowPinModal] = useState(false);

    const handleSecureApprove = async () => {
        if (!budgetId || !patient?.id) {
            console.error("❌ Tentativa de aprovar sem ID válido (BudgetForm)", { budgetId, patientId: patient?.id });
            alert("Erro: Dados incompletos para aprovação.");
            return;
        }

        // 1. Verificação do Profit Guardian (Margem < 20%)
        const marginPercent = budgetMarginAnalysis?.marginPercent ?? 0;

        // Regra de Ouro: Bloqueia se margem < 20%
        if (marginPercent < 20) {
            setShowPinModal(true);
            return;
        }

        // Se margem OK, aprova direto
        await performApproval();
    };

    const performApproval = async () => {
        try {
            console.log('✅ Approving from BudgetForm:', { budgetId, patientId: patient?.id });
            if (budgetId && patient?.id) {
                await approveBudget({ budgetId, patientId: patient.id });
                navigate(`/patients/${patient.id}`);
            }
        } catch (error) {
            console.error("Erro na aprovação:", error);
            alert("Erro ao aprovar orçamento.");
        }
    };

    const handleCreateOpportunity = () => {
        if (!existingBudget) return;
        createLead({
            name: patient.name,
            phone: patient.phone,
            email: patient.email || '',
            source: 'Orçamento',
            status: LeadStatus.NEGOTIATION,
            interest: categoryId || 'Não especificado',
            value: finalTotal,
            patient_id: patient.id,
            budget_id: existingBudget.id
        });
    };

    const handleWhatsApp = () => {
        if (!patient.phone) {
            alert("Paciente sem telefone cadastrado");
            return;
        }

        const message = `Olá ${patient.name}, aqui é da ${profile?.clinics?.name || 'Clínica'}. Segue o orçamento no valor de R$ ${finalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Podemos agendar?`;
        const link = `https://wa.me/55${patient.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(link, '_blank');
    };

    return (
        <div className="flex flex-col min-h-screen bg-slate-950 pb-20">
            {/* HEADER */}
            <div className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 py-4 border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-800 rounded-lg">
                        <ArrowLeft size={24} className="text-slate-300" />
                    </button>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-white">
                            {existingBudget ? 'Editar Orçamento' : 'Novo Orçamento'}
                        </h1>
                        <p className="text-sm text-slate-400">{patient.name}</p>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-3">
                    {existingBudget && (
                        <>
                            <button onClick={() => setShowDocModal(true)} className="flex items-center gap-2 px-4 py-2 border border-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-800">
                                <FileText size={16} /> Documentos
                            </button>
                            {existingOpportunity ? (
                                <button onClick={() => navigate(`/crm/${existingOpportunity.id}`)} className="flex items-center gap-2 px-4 py-2 border border-green-200 bg-green-50 text-green-700 rounded-lg text-sm font-medium hover:bg-green-100">
                                    <Briefcase size={16} /> Ver CRM
                                </button>
                            ) : (
                                <button onClick={handleCreateOpportunity} className="flex items-center gap-2 px-4 py-2 border border-yellow-200 bg-yellow-50 text-yellow-700 rounded-lg text-sm font-medium hover:bg-yellow-100">
                                    <Briefcase size={16} /> Criar CRM
                                </button>
                            )}
                        </>
                    )}
                    <button onClick={handleSave} disabled={isCreating || isUpdating} className="flex items-center gap-2 px-6 py-2 border border-blue-600 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 text-sm shadow-sm">
                        {isCreating || isUpdating ? <Loader size={18} className="animate-spin" /> : <Save size={18} />} Salvar
                    </button>
                    {existingBudget && (existingBudget.status === 'Em Análise' || existingBudget.status === 'Em Negociação' || existingBudget.status === 'Enviado') && (
                        <button onClick={handleSecureApprove} className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 shadow-sm text-sm">
                            <CheckCircle size={18} /> Aprovar
                        </button>
                    )}
                </div>

                {/* MOBILE MENU TRIGGER */}
                {existingBudget && (
                    <button className="md:hidden p-2 text-gray-600" onClick={() => setShowMobileMenu(!showMobileMenu)}>
                        <MoreVertical size={24} />
                    </button>
                )}
            </div>

            {/* MOBILE DROPDOWN */}
            {showMobileMenu && existingBudget && (
                <div className="md:hidden bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 p-4 flex flex-col gap-3 fixed top-[70px] left-0 right-0 z-50 shadow-lg animate-in slide-in-from-top-2">
                    <button onClick={() => setShowDocModal(true)} className="flex items-center gap-3 p-3 text-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg font-medium border border-gray-200">
                        <FileText size={20} /> Gerar Documentos
                    </button>
                    <button onClick={handleCreateOpportunity} className="flex items-center gap-3 p-3 text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg font-medium">
                        <Briefcase size={20} /> Enviar para CRM
                    </button>
                </div>
            )}

            <div className="flex-1">
                {/* SINGLE COLUMN LAYOUT */}
                <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8">

                    {/* 1. DADOS DO ORÇAMENTO */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-white mb-6">Dados do Orçamento</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className={labelClass}>Tabela de Preços</label>
                                <select className={inputClass} value={selectedPriceTableId} onChange={e => setSelectedPriceTableId(e.target.value)}>
                                    <option value="">Selecione...</option>
                                    {priceTables.map(pt => <option key={pt.id} value={pt.id}>{pt.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Profissional</label>
                                <select className={inputClass} value={selectedProfessionalId} onChange={e => setSelectedProfessionalId(e.target.value)}>
                                    <option value="">Selecione...</option>
                                    {professionals.map(prof => <option key={prof.id} value={prof.id}>{prof.name}</option>)}
                                </select>
                            </div>
                            {/* Exibe Vendedor apenas se não for 'NOVO' (tem ID) ou se já tiver vendedor selecionado */}
                            {existingBudget && (
                                <div>
                                    <label className={labelClass}>Vendedor / Consultor (Opcional)</label>
                                    <select
                                        className={inputClass}
                                        value={selectedSalesRepId}
                                        onChange={e => setSelectedSalesRepId(e.target.value)}
                                    >
                                        <option value="">Nenhum (sem comissão de venda)</option>
                                        {professionals
                                            .filter(p => (p as any).users?.is_sales_rep) // Filter by role
                                            .map(p => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 2. ADICIONAR PROCEDIMENTOS */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-white mb-6">Adicionar Procedimentos</h2>
                        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
                            <div className="md:col-span-2">
                                <label className={labelClass}>Procedimento</label>
                                <select className={inputClass} value={selectedProcedure} onChange={e => setSelectedProcedure(e.target.value)}>
                                    {procedures.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Dente</label>
                                <input type="text" className={inputClass} value={toothNumber} onChange={e => setToothNumber(e.target.value)} placeholder="Ex: 11" />
                            </div>
                            <div>
                                <label className={labelClass}>Face</label>
                                <input type="text" className={inputClass} value={face} onChange={e => setFace(e.target.value)} placeholder="Ex: V" />
                            </div>
                            <div>
                                <label className={labelClass}>Valor</label>
                                <input type="number" className={inputClass} value={price} onChange={e => setPrice(parseFloat(e.target.value))} />
                            </div>
                            <div>
                                <label className={labelClass}>QTD</label>
                                <input type="number" className={inputClass} value={qty} onChange={e => setQty(parseInt(e.target.value))} />
                            </div>
                            <div>
                                <button onClick={handleAddItem} className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center gap-2 h-12 md:h-10">
                                    <Plus size={20} /> Incluir
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 3. LISTA DE PROCEDIMENTOS */}
                    {items.length > 0 && (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Procedimentos Incluídos</h2>
                                {costPerMinute === 0 && (
                                    <div className="text-xs text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-full">
                                        ⚠️ Configure os Custos Fixos para ver a margem
                                    </div>
                                )}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-800 text-left">
                                            <th className="py-3 px-4 text-slate-400 font-medium text-sm">Procedimento</th>
                                            <th className="py-3 px-4 text-slate-400 font-medium text-sm">Região</th>
                                            <th className="py-3 px-4 text-slate-400 font-medium text-sm text-right">Qtd</th>
                                            <th className="py-3 px-4 text-slate-400 font-medium text-sm text-right">Valor Unit.</th>
                                            <th className="py-3 px-4 text-slate-400 font-medium text-sm text-right">Total</th>
                                            <th className="py-3 px-4 text-slate-400 font-medium text-sm text-center">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, index) => (
                                            <tr key={item.id || index} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                                                <td className="py-3 px-4">
                                                    <p className="text-slate-200 font-medium">{item.procedure}</p>
                                                    {(item.tooth_number || item.face) && (
                                                        <p className="text-xs text-slate-500">
                                                            {item.tooth_number && `Dente: ${item.tooth_number} `}
                                                            {item.face && `Face: ${item.face}`}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-slate-400 text-sm">{item.region}</td>
                                                <td className="py-3 px-4 text-right text-slate-300">{item.quantity}</td>
                                                <td className="py-3 px-4 text-right text-slate-300">
                                                    R$ {item.unitValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-3 px-4 text-right text-white font-medium">
                                                    R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <button onClick={() => handleRemoveItem(item.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan={4} className="py-4 px-4 text-right text-slate-400 font-medium">Subtotal:</td>
                                            <td className="py-4 px-4 text-right text-white font-bold text-lg">
                                                R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}


                    {/* 3.1 PROFIT BAR (GUARDIÃO DO LUCRO) */}
                    {budgetMarginAnalysis && costPerMinute > 0 && (
                        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden p-6 md:p-8">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-slate-200 font-medium flex items-center gap-2">
                                    <TrendingUp className="text-emerald-500" size={20} />
                                    Análise de Lucratividade (BOS Artificial Intelligence)
                                </h3>
                                {/* SELO DE SEGURANÇA */}
                                <div className={`hidden md:flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider items-center gap-1 ${(budgetMarginAnalysis.marginPercent ?? 0) >= 20
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                    }`}>
                                    {(budgetMarginAnalysis.marginPercent ?? 0) >= 20 ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                                    {(budgetMarginAnalysis.marginPercent ?? 0) >= 20 ? 'APROVADO' : 'REQUIRES PIN'}
                                </div>
                            </div>

                            <ProfitBar
                                revenue={budgetMarginAnalysis.totalPrice}
                                costs={budgetMarginAnalysis.totalCosts}
                                profit={budgetMarginAnalysis.totalProfit}
                                marginPercent={budgetMarginAnalysis.marginPercent}
                            />

                            {/* Alert for low margin will be handled by MarginAlert component inside ProfitBar or separately if needed */}
                            <div className="mt-4">
                                <MarginAlert marginPercent={budgetMarginAnalysis.marginPercent} minMargin={20} />
                            </div>
                        </div>
                    )}



                    {/* 4. CONDIÇÕES DE PAGAMENTO */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h2 className="text-xl font-bold text-white mb-6">Condições de Pagamento</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Coluna Esquerda: Inputs */}
                            <div className="space-y-4">
                                <div>
                                    <label className={labelClass}>Desconto (R$)</label>
                                    <input type="number" className={inputClass} value={discount} onChange={e => setDiscount(parseFloat(e.target.value))} />
                                </div>
                                <div>
                                    <label className={labelClass}>Entrada (R$)</label>
                                    <input type="number" className={inputClass} value={downPayment} onChange={e => setDownPayment(parseFloat(e.target.value))} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Forma de Pagamento</label>
                                        <select className={inputClass} value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)}>
                                            <option value="Cartão">Cartão de Crédito</option>
                                            <option value="Boleto">Boleto</option>
                                            <option value="Pix">Pix</option>
                                            <option value="Dinheiro">Dinheiro</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Parcelas</label>
                                        <select className={inputClass} value={installments} onChange={e => setInstallments(parseInt(e.target.value))} disabled={paymentMethod === 'Pix' || paymentMethod === 'Dinheiro'}>
                                            {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}x</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Coluna Direita: Antecipação Engine */}
                            <div className="bg-slate-950 rounded-lg p-5 border border-slate-800 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-slate-300 font-medium">
                                        <DollarSign size={18} className="text-blue-500" />
                                        Simular Antecipação
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={enableAnticipation} onChange={() => setEnableAnticipation(!enableAnticipation)} />
                                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                {enableAnticipation && finalTotal > 0 && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                        <div className="text-xs text-slate-500">
                                            Configure as taxas da sua maquininha para ver o custo real.
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="text-[10px] uppercase text-slate-500 font-bold">Taxa Intermediação (%)</label>
                                                <input
                                                    type="number"
                                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-300 text-sm mt-1"
                                                    value={intermediationFee}
                                                    onChange={e => setIntermediationFee(parseFloat(e.target.value))}
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] uppercase text-slate-500 font-bold">Taxa Antecipação (%/mês)</label>
                                                <input
                                                    type="number"
                                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-slate-300 text-sm mt-1"
                                                    value={anticipationFeePerInstallment}
                                                    onChange={e => setAnticipationFeePerInstallment(parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t border-slate-800">
                                            <div className="flex flex-col gap-1 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">Total Venda:</span>
                                                    <span className="text-slate-200 font-semibold">
                                                        R$ {anticipationCalculation.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">Taxa Intermediação:</span>
                                                    <span className="text-red-400">
                                                        -R$ {anticipationCalculation.intermediationCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">Taxa Antecipação:</span>
                                                    <span className="text-red-400">
                                                        -R$ {anticipationCalculation.anticipationCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between pt-2 border-t border-emerald-700/50">
                                                    <span className="text-emerald-400 font-semibold">Líquido na Conta:</span>
                                                    <span className="text-emerald-400 font-bold text-lg">
                                                        R$ {anticipationCalculation.netReceive24h.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-slate-500">Perda Efetiva:</span>
                                                    <span className="text-red-400">
                                                        {anticipationCalculation.effectiveLossPercent.toFixed(2)}% (R$ {anticipationCalculation.effectiveLoss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Alerta de Decisão */}
                                        <div className={`p-4 rounded-lg border ${anticipationCalculation.effectiveLossPercent > 10
                                            ? 'bg-red-900/20 border-red-700/50'
                                            : 'bg-blue-900/20 border-blue-700/50'
                                            }`}>
                                            <p className="text-sm text-slate-300">
                                                {anticipationCalculation.effectiveLossPercent > 10 ? (
                                                    <>⚠️ <strong>Atenção:</strong> A perda efetiva está acima de 10%. Avalie se vale a pena antecipar.</>
                                                ) : (
                                                    <>✅ <strong>Viável:</strong> A antecipação tem custo razoável. Pode ser interessante para fluxo de caixa.</>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>

                    {/* 5. RESUMO FINANCEIRO */}
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

                    {/* 5.5 CRONOGRAMA DE PARCELAS */}
                    {calculatedValues && !calcLoading && (
                        <InstallmentSchedule
                            installments={installments}
                            installmentValue={calculatedValues.installmentValue}
                            downPayment={downPayment}
                            totalValue={finalTotal}
                        />
                    )}

                    {/* 5.6 RESUMO DE LUCRATIVIDADE */}
                    {budgetMarginAnalysis && costPerMinute > 0 && (
                        <BudgetProfitSummary
                            totalPrice={budgetMarginAnalysis.totalPrice}
                            totalCosts={budgetMarginAnalysis.totalCosts}
                            totalProfit={budgetMarginAnalysis.totalProfit}
                            marginPercent={budgetMarginAnalysis.marginPercent}
                            itemCount={items.length}
                            lowMarginCount={budgetMarginAnalysis.lowMarginItems.length}
                        />
                    )}

                    {/* 6. BOTÕES DE AÇÃO */}
                    <div className="flex flex-wrap gap-3 justify-end pt-6 border-t border-slate-800">
                        <button
                            onClick={() => navigate(`/patients/${patient.id}`)}
                            className="px-6 py-3 border border-slate-700 text-slate-300 rounded-lg font-medium hover:bg-slate-800 flex items-center gap-2"
                        >
                            <ArrowLeft size={18} /> Voltar ao Paciente
                        </button>

                        {(existingBudget || isSavedLocally) && (
                            <>
                                <button onClick={() => setShowDocModal(true)} className="px-6 py-3 border border-slate-700 text-slate-300 rounded-lg font-medium hover:bg-slate-800 flex items-center gap-2">
                                    <Printer size={18} /> Imprimir
                                </button>
                                <button onClick={handleWhatsApp} className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-500 flex items-center gap-2">
                                    <MessageCircle size={18} /> WhatsApp
                                </button>
                            </>
                        )}

                        <button onClick={handleSave} disabled={isCreating || isUpdating} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2">
                            {isCreating || isUpdating ? <Loader size={18} className="animate-spin" /> : <Save size={18} />} Salvar
                        </button>

                        {(existingBudget || isSavedLocally) && (existingBudget?.status === 'Em Análise' || existingBudget?.status === 'Em Negociação' || existingBudget?.status === 'Enviado' || existingBudget?.status === 'DRAFT' || isSavedLocally) && (
                            <button onClick={handleSecureApprove} className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 flex items-center gap-2">
                                <CheckCircle size={18} /> Aprovar
                            </button>
                        )}

                    </div>
                </div>
            </div>

            {/* Document Modal */}
            {showDocModal && existingBudget && (
                <DocumentGeneratorModal
                    budget={existingBudget.id}
                    patient={patient.id}
                    onClose={() => setShowDocModal(false)}
                />
            )}

            {/* Security PIN Modal (Fort Knox) */}
            <SecurityPinModal
                isOpen={showPinModal}
                onClose={() => setShowPinModal(false)}
                onSuccess={performApproval}
                title="Profit Guardian Lock"
                description={`Margem Crítica detectada (${(budgetMarginAnalysis?.marginPercent ?? 0).toFixed(1)}%). Autorização do Gestor necessária.`}
                actionType="BUDGET_OVERRIDE"
                entityType="BUDGET"
                entityId={existingBudget?.id}
                entityName={`Orçamento ${patient.name}`}
            />
        </div>
    );
};

export default BudgetForm;
