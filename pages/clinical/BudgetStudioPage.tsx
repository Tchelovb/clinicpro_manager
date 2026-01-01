import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBudgetStudio } from '../../hooks/useBudgetStudio';
import { useUserPermissions } from '../../hooks/useUserPermissions';
import { ProcedureCatalog } from '../../components/budget-studio/ProcedureCatalog';
import { BudgetCanvas } from '../../components/budget-studio/BudgetCanvas';
import { DealConfigurator } from '../../components/budget-studio/DealConfigurator';
import { SalesBosFloating } from '../../components/budget-studio/SalesBosFloating';
import { Eye, EyeOff, Save, Send, ChevronLeft, Plus, FileText, DollarSign, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../utils/format';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { MobileBudgetHeader } from '../../components/budget-studio/mobile/MobileBudgetHeader';
import { MobileProcedureList } from '../../components/budget-studio/mobile/MobileProcedureList';
import { MobileCartSummary } from '../../components/budget-studio/mobile/MobileCartSummary';

export const BudgetStudioPage: React.FC = () => {
    const { id, budgetId } = useParams<{ id: string; budgetId?: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const isMobile = useMediaQuery('(max-width: 768px)');

    const {
        items,
        procedures,
        patient,
        addItem,
        removeItem,
        updateItem,
        financials,
        saveBudget,
        isShowroomMode,
        setIsShowroomMode,
        activeScenario,
        setActiveScenario,
        loading,
        budget,
    } = useBudgetStudio(id!, budgetId);

    // User Permissions
    const { permissions, loading: permissionsLoading } = useUserPermissions();

    // Deal Configuration State
    const [dealConfig, setDealConfig] = useState<any>({});

    // Fix ReferenceError: Derive status for UI logic (Priority: DB Budget -> Deal Config -> Default)
    const budgetStatus = budget?.status || dealConfig?.status || 'DRAFT';

    const [professionals, setProfessionals] = useState<any[]>([]);
    const [priceTables, setPriceTables] = useState<any[]>([]);

    // Load professionals and price tables
    useEffect(() => {
        const loadData = async () => {
            if (!user?.clinic_id) return;

            // Load professionals
            const { data: profs } = await supabase
                .from('users')
                .select('id, name, photo_url')
                .eq('clinic_id', user.clinic_id)
                .in('role', ['PROFESSIONAL', 'ADMIN'])
                .eq('is_active', true);

            // Load price tables
            const { data: tables } = await supabase
                .from('price_tables')
                .select('id, name, global_adjustment_percent')
                .eq('clinic_id', user.clinic_id)
                .eq('is_active', true);

            setProfessionals(profs || []);
            setPriceTables(tables || []);
        };

        loadData();
    }, [user?.clinic_id]);

    // CRITICAL FIX: useCallback prevents infinite re-render loop
    // Updated logic per user request: explicitly check JSON equality
    const handleDealUpdate = useCallback((newData: any) => {
        setDealConfig((prev: any) => {
            // Only update if data actually changed (prevents unnecessary re-renders)
            if (JSON.stringify(prev) === JSON.stringify(newData)) {
                return prev;
            }
            console.log('Deal updated (Safe):', newData);
            return newData;
        });
    }, []); // Empty deps - function is stable

    // --- CHECKOUT FLOW ---
    // Single Truth: We just save and redirect to Checkout.
    const handleProceedToCheckout = async (dealData: any) => {
        const toastId = toast.loading("Preparando checkout...");

        try {
            // 1. Sanitize Deal Data
            const sanitizedDealConfig = {
                ...dealData,
                sales_rep_id: dealData.sales_rep_id || null,
                price_table_id: dealData.price_table_id || null,
                card_machine_profile_id: dealData.card_machine_profile_id || null,
                discount_type: dealData.discount_type || 'PERCENTAGE',
                discount_value: dealData.discount_value || 0,
                down_payment_value: dealData.down_payment_value || 0,
                installments_count: dealData.installments_count || 1,
                final_value: dealData.final_value,
            };

            // 2. Update Budget Status & Data
            // We use 'WAITING_CLOSING' so it appears on the receptionist's radar
            const { error: saveError } = await supabase
                .from('budgets')
                .update({
                    ...sanitizedDealConfig,
                    status: 'WAITING_CLOSING',
                    updated_at: new Date().toISOString()
                })
                .eq('id', budgetId);

            if (saveError) throw saveError;

            toast.success("Enviado para o Terminal de Vendas!", { id: toastId });

            // 3. Redirect to Checkout
            // Small delay to let toast be seen
            setTimeout(() => {
                navigate(`/sales/checkout/${budgetId}`);
            }, 500);

        } catch (error: any) {
            console.error("Erro ao encaminhar para checkout:", error);
            toast.error("Erro ao encaminhar proposta: " + error.message, { id: toastId });
        }
    };

    // Helper for Mobile Checkout
    const handleMobileProceedToCheckout = (paymentData: any) => {
        // Construct dealData from mobile payment selection
        const mobileDealData = {
            ...dealConfig,
            final_value: paymentData.finalValue,
            discount_value: paymentData.discountApplied,
            installments_count: paymentData.installments,
            chosen_payment_method: paymentData.paymentMethod,
            chosen_installments: paymentData.installments,
        };
        handleProceedToCheckout(mobileDealData);
    };


    // Ensure we always have at least one professional and price table
    const safeProfessionals = useMemo(() => {
        return professionals.length > 0 ? professionals : [
            { id: user?.id || '', name: user?.name || 'Profissional', photo_url: null }
        ];
    }, [professionals, user?.id, user?.name]);

    const safePriceTables = useMemo(() => {
        return priceTables.length > 0 ? priceTables : [
            { id: null, name: 'Tabela Padrão (Sem tabela ativa)', global_adjustment_percent: 0 }
        ];
    }, [priceTables]);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center text-slate-400">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p>Carregando Budget Studio...</p>
                </div>
            </div>
        );
    }

    // --- MOBILE LAYOUT (Steve Jobs Mode) ---
    if (isMobile) {
        return (
            <div className="bg-slate-50 min-h-screen pb-32 animate-in fade-in duration-500">
                <MobileBudgetHeader
                    patient={patient}
                    onBack={() => navigate(-1)}
                />

                <MobileProcedureList
                    procedures={procedures}
                    itemsInCart={items}
                    onAdd={addItem}
                />

                <MobileCartSummary
                    items={items}
                    onProceed={handleMobileProceedToCheckout}
                    onRemoveItem={removeItem}
                />
            </div>
        );
    }

    // --- DESKTOP LAYOUT (Pro Mode) ---
    return (
        <div className="flex h-screen bg-white overflow-hidden font-sans">
            {/* 1. LATERAL ESQUERDA: CATÁLOGO (20%) */}
            <div
                className={cn(
                    'flex flex-col border-r transition-all duration-300',
                    isShowroomMode ? 'w-0 opacity-0 overflow-hidden' : 'w-[20%] min-w-[280px]'
                )}
            >
                <ProcedureCatalog procedures={procedures} onAdd={addItem} />
            </div>

            {/* 2. ÁREA CENTRAL (Flex) */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header da Página */}
                <header
                    className={cn(
                        'h-16 border-b flex items-center justify-between px-6 z-10 transition-colors',
                        isShowroomMode
                            ? 'bg-slate-900 border-slate-800 text-white'
                            : 'bg-white border-slate-200'
                    )}
                >
                    <div className="flex items-center gap-4">
                        {!isShowroomMode && (
                            <button
                                onClick={() => navigate(`/patients/${id}`)}
                                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                            >
                                <ChevronLeft size={20} />
                            </button>
                        )}
                        <div>
                            <h1 className="font-bold text-lg leading-none flex items-center gap-2">
                                Budget Studio
                                <span className="px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-700 uppercase font-extrabold tracking-wider">
                                    Pro
                                </span>
                            </h1>
                            {!isShowroomMode && patient && (
                                <p className="text-xs text-slate-400 mt-1">
                                    Planejamento para {patient.name}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Scenarios Tabs */}
                        {!isShowroomMode && (
                            <div className="bg-slate-100 p-1 rounded-lg flex gap-1 mr-4">
                                {['Plano Ideal', 'Plano Econômico'].map((scen) => (
                                    <button
                                        key={scen}
                                        onClick={() => setActiveScenario(scen)}
                                        className={cn(
                                            'px-3 py-1.5 text-xs font-bold rounded-md transition-all',
                                            activeScenario === scen
                                                ? 'bg-white shadow text-slate-800'
                                                : 'text-slate-500 hover:text-slate-700'
                                        )}
                                    >
                                        {scen}
                                    </button>
                                ))}
                                <button className="px-2 py-1.5 text-slate-400 hover:text-blue-600">
                                    <Plus size={14} />
                                </button>
                            </div>
                        )}

                        {/* Showroom Toggle */}
                        <button
                            onClick={() => setIsShowroomMode(!isShowroomMode)}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs transition-all border',
                                isShowroomMode
                                    ? 'bg-white text-slate-900 border-white hover:bg-slate-200'
                                    : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
                            )}
                        >
                            {isShowroomMode ? (
                                <>
                                    <EyeOff size={14} /> Sair do Showroom
                                </>
                            ) : (
                                <>
                                    <Eye size={14} /> Apresentar
                                </>
                            )}
                        </button>
                    </div>
                </header>

                {/* Canvas */}
                <BudgetCanvas
                    items={items}
                    onUpdate={updateItem}
                    onRemove={removeItem}
                    isShowroom={isShowroomMode}
                />

                {/* Footer removido em favor do DealConfigurator lateral (Steve Jobs Mode) */}
                {/* Apenas mantemos o footer do Showroom Mode */}
                {isShowroomMode && (
                    <div className="h-24 bg-slate-900 border-t border-slate-800 flex flex-col items-center justify-center animate-in slide-in-from-bottom-10">
                        <p className="text-slate-400 text-xs font-bold uppercase mb-1">
                            Total do Tratamento
                        </p>
                        <p className="text-4xl font-black text-white">
                            {formatCurrency(financials.revenue)}
                        </p>
                    </div>
                )}
            </div>

            {/* 3. LATERAL DIREITA: DEAL CONFIGURATOR (30%) */}
            <div
                className={cn(
                    'border-l bg-slate-50 transition-all duration-300',
                    isShowroomMode ? 'w-0 opacity-0 overflow-hidden' : 'w-[30%] min-w-[300px]'
                )}
            >
                <DealConfigurator
                    totalValue={financials.revenue}
                    professionals={safeProfessionals}
                    priceTables={safePriceTables}
                    onUpdateDeal={handleDealUpdate}
                    onProceedToCheckout={handleProceedToCheckout}
                />
            </div>

            {/* FLOATING SALES BOS AI */}
            {!isShowroomMode && (
                <SalesBosFloating
                    patientName={patient?.name || 'Paciente'}
                    dealValue={financials.revenue}
                    installments={dealConfig.installments_count || 1}
                    discountApplied={dealConfig.discount_value || 0}
                />
            )}

            {/* Sale Progress Modal removed as per single truth refactor */}
        </div>
    );
};
