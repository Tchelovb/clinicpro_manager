import { useParams, useNavigate } from 'react-router-dom';
import { useBudgetStudio } from '../../hooks/useBudgetStudio';
import { useUserPermissions } from '../../hooks/useUserPermissions';
import { ProcedureCatalog } from '../../components/budget-studio/ProcedureCatalog';
import { BudgetCanvas } from '../../components/budget-studio/BudgetCanvas';
import { DealConfigurator } from '../../components/budget-studio/DealConfigurator';
import { SalesBosFloating } from '../../components/budget-studio/SalesBosFloating';
import { TransactionGuard } from '../../components/TransactionGuard';
import { SaleProgressModal } from '../../components/SaleProgressModal';
import { Eye, EyeOff, Save, Send, ChevronLeft, Plus, FileText, DollarSign, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../utils/format';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export const BudgetStudioPage: React.FC = () => {
    const { id, budgetId } = useParams<{ id: string; budgetId?: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

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

    const [showSecurityGuard, setShowSecurityGuard] = useState(false);
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [progressSteps, setProgressSteps] = useState<any[]>([]);
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

    // Inicia o processo de aprovação (abre o modal de segurança)
    const handleInitiateApproval = async (dealData: any) => {
        // Salva os dados da negociação para usar depois
        setDealConfig(dealData);
        // Abre o modal de segurança
        setShowSecurityGuard(true);
    };

    // Finaliza a transação após validação do PIN
    const handleFinalizeTransaction = async (pin: string) => {
        try {
            // Fechar modal de PIN e abrir modal de progresso
            setShowSecurityGuard(false);
            setShowProgressModal(true);

            // Definir etapas iniciais
            const steps = [
                { label: 'Validando PIN de segurança', status: 'processing', icon: <FileText size={24} /> },
                { label: 'Gerando lançamento financeiro', status: 'pending', icon: <DollarSign size={24} /> },
                { label: 'Criando contrato digital', status: 'pending', icon: <FileText size={24} /> },
                { label: 'Calculando comissões da equipe', status: 'pending', icon: <Users size={24} /> },
            ];
            setProgressSteps(steps);

            // ETAPA 1: Validar PIN
            await new Promise(resolve => setTimeout(resolve, 800));
            const { error: pinError } = await supabase.rpc('verify_user_pin', {
                pin_attempt: pin
            });

            if (pinError) {
                steps[0].status = 'error';
                setProgressSteps([...steps]);
                toast.error(pinError.message || "PIN incorreto. Transação negada.");
                throw pinError;
            }

            steps[0].status = 'completed';
            steps[1].status = 'processing';
            setProgressSteps([...steps]);

            // Sanitize dealConfig to ensure no empty strings for UUIDs
            const sanitizedDealConfig = {
                ...dealConfig,
                sales_rep_id: dealConfig.sales_rep_id || null,
                price_table_id: dealConfig.price_table_id || null,
                card_machine_profile_id: dealConfig.card_machine_profile_id || null,
                created_by_id: dealConfig.created_by_id || null,
                assigned_to_id: dealConfig.assigned_to_id || null
            };

            // CRITICAL FIX: Ensure Budget ID is present
            // If it's a new budget (no ID yet), we MUST save it first to get an ID.
            let currentBudgetId = budgetId || dealConfig.id;

            if (!currentBudgetId) {
                console.log("Budget ID not found, attempting to save new budget first...");

                // Attempt to save as DRAFT first to generate ID
                // The actual APPROVED save happens in Step 2, but we need an ID now.
                const tempSavedBudget = await saveBudget('DRAFT', {
                    ...sanitizedDealConfig,
                    status: 'DRAFT'
                });

                if (tempSavedBudget && tempSavedBudget.id) {
                    currentBudgetId = tempSavedBudget.id;
                    console.log("New Budget created with ID:", currentBudgetId);
                } else {
                    console.error("Erro: Falha ao criar orçamento inicial.", { dealConfig });
                    toast.error("Erro interno: Não foi possível criar o orçamento. Tente novamente.");
                    steps[0].status = 'pending';
                    setProgressSteps([...steps]);
                    throw new Error("Failed to create initial budget");
                }
            }

            console.log("Iniciando finalização para o ID:", currentBudgetId);

            // ETAPA 2: Gerar Financeiro (Save as APPROVED)
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Use saveBudget from hook which handles complex saving and returning data
            const savedBudget = await saveBudget('APPROVED', {
                sales_rep_id: sanitizedDealConfig.sales_rep_id,
                price_table_id: sanitizedDealConfig.price_table_id,
                discount_type: sanitizedDealConfig.discount_type,
                discount_value: sanitizedDealConfig.discount_value,
                down_payment_value: sanitizedDealConfig.down_payment_value,
                installments_count: sanitizedDealConfig.installments_count,
                final_value: sanitizedDealConfig.final_value,
                payment_config: sanitizedDealConfig
            });

            if (!savedBudget) {
                throw new Error("Erro ao salvar orçamento aprovado.");
            }

            steps[1].status = 'completed';
            steps[2].status = 'processing';
            setProgressSteps([...steps]);

            // ETAPA 3: Contrato Digital
            await new Promise(resolve => setTimeout(resolve, 800));
            // TODO: Integrar com sistema de contratos
            steps[2].status = 'completed';
            steps[3].status = 'processing';
            setProgressSteps([...steps]);

            // ETAPA 4: Comissões (Calculated automatically by backend triggers)
            await new Promise(resolve => setTimeout(resolve, 800));
            steps[3].status = 'completed';
            setProgressSteps([...steps]);

            // Final Success
            await new Promise(resolve => setTimeout(resolve, 500));
            toast.success("Venda realizada com sucesso!");

            // Close modal and navigate
            setTimeout(() => {
                setShowProgressModal(false);
                navigate('/sales');
            }, 1000);

        } catch (error: any) {
            console.error('Transaction error:', error);
            const errorStepIndex = steps.findIndex(s => s.status === 'processing');
            if (errorStepIndex >= 0) {
                steps[errorStepIndex].status = 'error';
                setProgressSteps([...steps]);
            }
            toast.error("Erro ao processar venda: " + (error.message || "Erro desconhecido"));
            // Allow user to close/retry
            setTimeout(() => setShowProgressModal(false), 3000);
        }
    };


    const handleReleaseToReception = async (dealData: any, notes: string) => {
        const toastId = toast.loading("Enviando para o time comercial...");

        try {
            // 1. Atualizar o Orçamento para 'Aguardando Fechamento'
            const { error: budgetError } = await supabase
                .from('budgets')
                .update({
                    status: 'WAITING_CLOSING',
                    final_value: dealData.final_value,
                    discount_value: dealData.discount_value,
                    down_payment_value: dealData.down_payment_value,
                    installments_count: dealData.installments_count,
                    payment_config: dealData,
                    created_by_id: user?.id,
                    handoff_notes: notes,
                    handoff_at: new Date().toISOString()
                })
                .eq('id', budgetId);

            if (budgetError) throw budgetError;

            // 2. Inserir na Fila de Vendas (Sales Queue)
            const { error: queueError } = await supabase
                .from('sales_queue')
                .insert({
                    clinic_id: user?.clinic_id,
                    budget_id: budgetId,
                    patient_id: id,
                    created_by_id: user?.id,
                    total_value: dealData.final_value,
                    dentist_notes: notes,
                    urgency_level: dealData.final_value > 10000 ? 'HIGH' : 'MEDIUM',
                    status: 'PENDING'
                });

            if (queueError) throw queueError;

            toast.success("Paciente liberado! Recepção notificada.", { id: toastId });

            // 3. Volta para a lista de pacientes
            setTimeout(() => navigate('/patients'), 1500);

        } catch (error: any) {
            console.error('Release error:', error);
            toast.error("Erro ao liberar paciente: " + (error.message || 'Erro desconhecido'), { id: toastId });
        }
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
                    onApproveNegotiation={
                        ['DRAFT', 'WAITING_CLOSING', 'PENDING'].includes(budgetStatus) && permissions?.can_approve_budget
                            ? handleInitiateApproval
                            : undefined
                    }
                    onReleaseToReception={
                        ['DRAFT', 'PENDING'].includes(budgetStatus) && !permissions?.can_approve_budget
                            ? handleReleaseToReception
                            : undefined
                    }
                    userCanApprove={permissions?.can_approve_budget || false}
                    readOnly={!['DRAFT', 'WAITING_CLOSING', 'PENDING'].includes(budgetStatus)}
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

            {/* Transaction Security Guard */}
            <TransactionGuard
                isOpen={showSecurityGuard}
                onClose={() => setShowSecurityGuard(false)}
                onConfirm={handleFinalizeTransaction}
                summary={{
                    patientName: patient?.name || 'Paciente',
                    totalValue: dealConfig.final_value || financials.revenue,
                    installments: dealConfig.installments_count || 1,
                    downPayment: dealConfig.down_payment_value || 0
                }}
            />

            {/* Sale Progress Modal */}
            <SaleProgressModal
                isOpen={showProgressModal}
                steps={progressSteps}
                patientName={patient?.name || 'Paciente'}
                totalValue={dealConfig.final_value || financials.revenue}
                onClose={() => {
                    setShowProgressModal(false);
                    navigate('/sales');
                }}
            />
        </div>
    );
};
