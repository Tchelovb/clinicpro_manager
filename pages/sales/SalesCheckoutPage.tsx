import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, CreditCard, Lock, Banknote, QrCode, ChevronLeft, AlertCircle } from 'lucide-react';
import { SalesBosFloating } from '../../components/budget-studio/SalesBosFloating';
import { CheckoutItemsList } from '../../components/sales/CheckoutItemsList';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../utils/format';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export const SalesCheckoutPage: React.FC = () => {
    const { budgetId } = useParams<{ budgetId: string }>();
    const location = useLocation();
    const navigate = useNavigate();

    const { user } = useAuth();
    const [budget, setBudget] = useState<any>(location.state?.preloadedBudget || null);
    const [budgetItems, setBudgetItems] = useState<any[]>([]);
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(!budget);
    const [currentStep, setCurrentStep] = useState(1);

    useEffect(() => {
        if (!budget && budgetId) {
            loadBudget();
        }
    }, [budgetId]);

    const loadBudget = async () => {
        try {
            // FIX: Use explicit FK reference to avoid 400 error (ambiguous relationship)
            const { data, error } = await supabase
                .from('budgets')
                .select(`
          *,
          patients!patient_id (
            id,
            name,
            cpf,
            phone,
            photo_profile_url
          )
        `)
                .eq('id', budgetId)
                .single();

            if (error) throw error;

            // Transform patients array to object
            const budgetData = {
                ...data,
                patient: Array.isArray(data.patients) ? data.patients[0] : data.patients
            };

            setBudget(budgetData);

            // Load budget items
            await loadBudgetItems();
        } catch (err) {
            console.error('Error loading budget:', err);
            toast.error('Erro ao carregar orçamento');
        } finally {
            setLoading(false);
        }
    };

    const loadBudgetItems = async () => {
        try {
            const { data, error } = await supabase
                .from('budget_items')
                .select('*')
                .eq('budget_id', budgetId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            setBudgetItems(data || []);

            // Auto-select available items
            const availableIds = (data || [])
                .filter((item: any) => !item.is_sold)
                .map((item: any) => item.id);
            setSelectedItemIds(availableIds);
        } catch (err) {
            console.error('Error loading budget items:', err);
            toast.error('Erro ao carregar itens do orçamento');
        }
    };

    const handleConfirmSale = async (paymentMethod: string) => {
        // 1. Validação Básica
        if (selectedItemIds.length === 0) {
            toast.error("Selecione pelo menos um item para cobrar.");
            return;
        }

        const toastId = toast.loading("Processando venda segura...");

        try {
            const itemsToPay = budgetItems.filter(i => selectedItemIds.includes(i.id) && !i.is_sold);

            if (itemsToPay.length === 0) {
                toast.error("Todos os itens selecionados já foram pagos.", { id: toastId });
                return;
            }
            const totalValue = itemsToPay.reduce((acc, item) => acc + (item.final_value || item.total_value), 0);

            // 2. CRIA A VENDA (Sales Record) - A Fonte da Verdade
            const { data: newSale, error: saleError } = await supabase
                .from('sales')
                .insert({
                    clinic_id: user?.clinic_id,
                    patient_id: budget.patient_id,
                    budget_id: budgetId,
                    total_value: totalValue,
                    payment_method: paymentMethod,
                    status: 'COMPLETED',
                    created_by: user?.id
                })
                .select()
                .single();

            if (saleError) throw saleError;

            // 3. CRIA A TRANSAÇÃO (Vinculada à Venda)
            const { error: transError } = await supabase
                .from('transactions')
                .insert({
                    clinic_id: user?.clinic_id,
                    amount: totalValue,
                    type: 'INCOME',
                    category: 'TREATMENT',
                    description: `Venda #${newSale.id.substring(0, 8)} - ${budget.patient?.name}`,
                    payment_method: paymentMethod,
                    budget_id: budgetId,
                    sale_id: newSale.id, // Vínculo crucial
                    created_by: user?.id
                });

            if (transError) throw transError;

            // 4. ITEM LOCKING (Vincula itens à Venda) - Trigger automatically updates Budget Status
            const { error: lockError } = await supabase
                .from('budget_items')
                .update({
                    is_sold: true,
                    sold_at: new Date().toISOString(),
                    sale_id: newSale.id // Vínculo item -> venda
                })
                .in('id', itemsToPay.map(i => i.id)); // Use filtered list

            if (lockError) throw lockError;

            // 5. ATUALIZA STATUS DO ORÇAMENTO -> HANDLED BY DB TRIGGER NOW
            // The trigger 'trigger_update_budget_status' on budget_items table 
            // automatically sets status to 'PARTIALLY_PAID' or 'PAID'.

            toast.success("Venda Confirmada!", { id: toastId });

            toast.success("Venda Confirmada!", { id: toastId });

            // 6. REDIRECIONA PARA RECIBO
            navigate(`/sales/receipt/${newSale.id}`);

        } catch (error: any) {
            console.error(error);
            toast.error("Erro ao processar venda: " + error.message, { id: toastId });
        }
    };

    const isStepActive = (step: number) => currentStep === step;
    const isStepDone = (step: number) => currentStep > step;

    const handlePaymentComplete = (step: number) => {
        toast.success('Pagamento registrado!');
        setCurrentStep(step + 1);
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600">Carregando checkout...</p>
                </div>
            </div>
        );
    }

    if (!budget) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                    <p className="text-slate-600">Orçamento não encontrado</p>
                    <button
                        onClick={() => navigate('/budgets')}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
                    >
                        Voltar para Orçamentos
                    </button>
                </div>
            </div>
        );
    }

    const downPayment = budget.down_payment_value || 0;
    const remainingBalance = (budget.final_value || 0) - downPayment;
    const installmentValue = budget.installments_count > 0
        ? remainingBalance / budget.installments_count
        : 0;

    return (
        <div className="flex h-screen bg-white">
            {/* COLUNA ESQUERDA: RESUMO */}
            <div className="w-1/3 min-w-[350px] bg-slate-50 p-8 border-r border-slate-200 overflow-y-auto">
                <div className="mb-6">
                    <button
                        onClick={() => navigate(`/patients/${budget.patient_id}/budget-studio/${budgetId}`)}
                        className="flex items-center text-slate-600 hover:text-slate-900 mb-4"
                    >
                        <ChevronLeft size={20} />
                        <span className="ml-1">Voltar ao Studio</span>
                    </button>
                    <h2 className="text-xl font-bold text-slate-800">Resumo do Acordo</h2>
                </div>

                {/* Card do Paciente */}
                <div className="flex items-center mb-8 bg-white rounded-xl p-4 shadow-sm">
                    {budget.patient?.photo_profile_url ? (
                        <img
                            src={budget.patient.photo_profile_url}
                            alt={budget.patient.name}
                            className="w-12 h-12 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                            {budget.patient?.name?.charAt(0) || '?'}
                        </div>
                    )}
                    <div className="ml-4">
                        <p className="font-bold text-slate-700">{budget.patient?.name || 'Paciente'}</p>
                        <p className="text-sm text-slate-500">CPF: {budget.patient?.cpf || 'Não informado'}</p>
                    </div>
                </div>

                {/* Os Números */}
                <div className="space-y-4 bg-white rounded-xl p-6 shadow-sm">
                    <div className="flex justify-between text-slate-600">
                        <span>Valor Original</span>
                        <span className="font-medium line-through opacity-50">{formatCurrency(budget.total_value || 0)}</span>
                    </div>

                    {budget.discount_value > 0 && (
                        <div className="flex justify-between text-orange-600">
                            <span>Desconto</span>
                            <span className="font-medium">- {formatCurrency(budget.discount_value)}</span>
                        </div>
                    )}

                    <div className="flex justify-between text-green-600 font-bold text-lg border-t border-slate-200 pt-4">
                        <span>Valor Fechado</span>
                        <span>{formatCurrency(budget.final_value || 0)}</span>
                    </div>

                    <div className="border-t border-slate-200 my-4 pt-4 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                1. Entrada (A Pagar)
                            </span>
                            <span className="font-bold text-slate-800">{formatCurrency(downPayment)}</span>
                        </div>
                        <div className="flex justify-between items-center opacity-60">
                            <span className="text-sm">2. Saldo ({budget.installments_count || 1}x)</span>
                            <span>{formatCurrency(remainingBalance)}</span>
                        </div>
                        {installmentValue > 0 && (
                            <div className="text-xs text-slate-500 text-right">
                                {budget.installments_count}x de {formatCurrency(installmentValue)}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* COLUNA DIREITA: EXECUÇÃO */}
            <div className="flex-1 p-10 bg-white overflow-y-auto">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Checkout</h1>
                    <p className="text-slate-500 mb-10">Selecione os itens a cobrar e finalize o recebimento.</p>

                    {/* LISTA DE ITENS COM SELEÇÃO */}
                    <div className="mb-10">
                        <CheckoutItemsList
                            items={budgetItems}
                            selectedIds={selectedItemIds}
                            onSelectionChange={setSelectedItemIds}
                        />
                    </div>

                    {/* Subtotal dos Itens Selecionados */}
                    {selectedItemIds.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-10">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-blue-900">Total a Cobrar:</span>
                                <span className="text-2xl font-bold text-blue-600">
                                    {formatCurrency(
                                        budgetItems
                                            .filter(i => selectedItemIds.includes(i.id))
                                            .reduce((acc, item) => acc + (item.final_value || item.total_value), 0)
                                    )}
                                </span>
                            </div>
                            <p className="text-xs text-blue-600 mt-2">
                                {selectedItemIds.length} {selectedItemIds.length === 1 ? 'item selecionado' : 'itens selecionados'}
                            </p>
                        </div>
                    )}

                    {/* PASSO 1: ENTRADA */}
                    <div className={`transition-all duration-500 ${isStepDone(1) ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                        <div className="flex items-center mb-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 ${isStepDone(1) ? 'bg-green-500 text-white' : 'bg-blue-600 text-white'
                                }`}>
                                {isStepDone(1) ? <CheckCircle size={18} /> : '1'}
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">Receber Entrada</h3>
                        </div>

                        <div className="bg-white border-2 border-blue-100 rounded-2xl p-6 shadow-sm mb-10">
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-slate-500 font-medium">Valor a receber agora:</span>
                                <span className="text-2xl font-bold text-blue-600">{formatCurrency(downPayment)}</span>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <button
                                    onClick={() => handleConfirmSale('PIX')}
                                    className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-blue-400 transition-all group"
                                >
                                    <QrCode size={32} className="text-slate-400 group-hover:text-blue-500 mb-2" />
                                    <span className="font-bold text-slate-700">Gerar Pix</span>
                                </button>
                                <button
                                    onClick={() => handleConfirmSale('CREDIT_CARD')}
                                    className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-blue-400 transition-all group"
                                >
                                    <CreditCard size={32} className="text-slate-400 group-hover:text-blue-500 mb-2" />
                                    <span className="font-bold text-slate-700">Débito/Crédito</span>
                                </button>
                                <button
                                    onClick={() => handleConfirmSale('CASH')}
                                    className="flex flex-col items-center justify-center p-4 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-blue-400 transition-all group"
                                >
                                    <Banknote size={32} className="text-slate-400 group-hover:text-blue-500 mb-2" />
                                    <span className="font-bold text-slate-700">Dinheiro</span>
                                </button>
                            </div>

                            {!isStepDone(1) && (
                                <button
                                    onClick={() => handlePaymentComplete(1)}
                                    className="w-full mt-6 py-3 bg-slate-100 text-slate-500 rounded-lg text-sm hover:bg-green-100 hover:text-green-700 transition-colors"
                                >
                                    (Dev: Simular Pagamento Confirmado)
                                </button>
                            )}
                        </div>
                    </div>

                    {/* PASSO 2: PARCELAMENTO */}
                    <div className={`transition-all duration-500 ${!isStepActive(2) && !isStepDone(2) ? 'opacity-30 blur-sm pointer-events-none' : 'opacity-100'
                        }`}>
                        <div className="flex items-center mb-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 ${isStepDone(2) ? 'bg-green-500 text-white' : isStepActive(2) ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                                }`}>
                                {isStepDone(2) ? <CheckCircle size={18} /> : '2'}
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">Programar Saldo</h3>
                        </div>

                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-10">
                            <p className="text-slate-600 mb-4">
                                Passar o restante de <strong>{formatCurrency(remainingBalance)}</strong> em {budget.installments_count}x.
                            </p>
                            <div className="bg-white rounded-lg p-4 border border-slate-200">
                                <p className="text-sm text-slate-500 mb-2">Valor da parcela:</p>
                                <p className="text-2xl font-bold text-slate-800">{formatCurrency(installmentValue)}</p>
                            </div>

                            {isStepActive(2) && (
                                <button
                                    onClick={() => handlePaymentComplete(2)}
                                    className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
                                >
                                    Confirmar Parcelamento
                                </button>
                            )}
                        </div>
                    </div>

                    {/* PASSO 3: CONTRATO */}
                    <div className={`transition-all duration-500 ${!isStepActive(3) && !isStepDone(3) ? 'opacity-30 blur-sm pointer-events-none' : 'opacity-100'
                        }`}>
                        <div className="flex items-center mb-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 ${isStepDone(3) ? 'bg-green-500 text-white' : isStepActive(3) ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
                                }`}>
                                {isStepDone(3) ? <CheckCircle size={18} /> : '3'}
                            </div>
                            <h3 className="text-xl font-bold text-slate-800">Gerar Contrato</h3>
                        </div>

                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                            <p className="text-emerald-700 mb-4">
                                ✅ Pagamento confirmado! Gere o contrato para assinatura digital.
                            </p>
                            {isStepActive(3) && (
                                <button className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors">
                                    Gerar Contrato & Enviar p/ Assinatura
                                </button>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* FLOATING SALES BOS AI */}
            <SalesBosFloating
                patientName={budget.patient?.name || 'Paciente'}
                dealValue={budget.final_value || 0}
                installments={budget.installments_count || 1}
                discountApplied={budget.discount_value || 0}
            />
        </div>
    );
};
