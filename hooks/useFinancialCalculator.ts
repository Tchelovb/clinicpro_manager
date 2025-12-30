import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';

export interface InstallmentSimulation {
    downPayment: number;
    financedAmount: number;
    installmentCount: number;
    installmentValue: number;
    cardFeePercent: number;
    cardFeeTotal: number;
    totalToReceive: number;
    netLossFromFees: number;
}

export interface InstallmentWithAnticipation extends InstallmentSimulation {
    baseFeePercent: number;
    baseFeeValue: number;
    anticipationFeePercent: number;
    anticipationFeeValue: number;
    totalFeesPercent: number;
    totalFeesValue: number;
    totalToReceiveNormal: number;
    totalToReceiveAnticipated: number;
    cashLossFromAnticipation: number;
    daysToReceiveAll: number;
    recommendation: string;
}

export interface BudgetMargin {
    totalValue: number;
    totalCost: number;
    cardFeePercent: number;
    cardFeeValue: number;
    taxPercent: number;
    taxValue: number;
    netMarginValue: number;
    netMarginPercent: number;
    isProfitable: boolean;
}

export const useFinancialCalculator = () => {
    /**
     * Simular parcelamento simples (sem antecipação)
     */
    const simulateInstallment = async (
        totalValue: number,
        downPayment: number = 0,
        installments: number = 1,
        paymentMethod: string = 'CREDIT_CARD'
    ): Promise<InstallmentSimulation | null> => {
        try {
            const { data, error } = await supabase.rpc('simulate_installment_plan', {
                p_total_value: totalValue,
                p_down_payment: downPayment,
                p_installments: installments,
                p_payment_method: paymentMethod
            });

            if (error) throw error;
            return data?.[0] || null;
        } catch (error) {
            console.error('Error simulating installment:', error);
            return null;
        }
    };

    /**
     * Simular parcelamento com opção de antecipação
     */
    const simulateWithAnticipation = async (
        totalValue: number,
        downPayment: number = 0,
        installments: number = 1,
        paymentMethod: string = 'CREDIT_CARD',
        anticipate: boolean = false
    ): Promise<InstallmentWithAnticipation | null> => {
        try {
            const { data, error } = await supabase.rpc('simulate_installment_with_anticipation', {
                p_total_value: totalValue,
                p_down_payment: downPayment,
                p_installments: installments,
                p_payment_method: paymentMethod,
                p_anticipate: anticipate
            });

            if (error) throw error;
            return data?.[0] || null;
        } catch (error) {
            console.error('Error simulating with anticipation:', error);
            return null;
        }
    };

    /**
     * Calcular margem líquida de um orçamento
     */
    const calculateMargin = async (
        budgetId: string,
        paymentMethod: string = 'CREDIT_CARD',
        installments: number = 1
    ): Promise<BudgetMargin | null> => {
        try {
            const { data, error } = await supabase.rpc('calculate_budget_net_margin', {
                p_budget_id: budgetId,
                p_payment_method: paymentMethod,
                p_installments: installments
            });

            if (error) throw error;
            return data?.[0] || null;
        } catch (error) {
            console.error('Error calculating margin:', error);
            return null;
        }
    };

    /**
     * Comparar todos os cenários de parcelamento (1x a 12x)
     */
    const compareScenarios = async (
        totalValue: number,
        downPayment: number = 0
    ) => {
        try {
            const { data, error } = await supabase.rpc('compare_payment_scenarios', {
                p_total_value: totalValue,
                p_down_payment: downPayment
            });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error comparing scenarios:', error);
            return [];
        }
    };

    return {
        simulateInstallment,
        simulateWithAnticipation,
        calculateMargin,
        compareScenarios
    };
};

/**
 * Hook para cálculo em tempo real no formulário de orçamento
 */
export const useBudgetCalculator = (
    totalValue: number,
    downPayment: number,
    installments: number,
    paymentMethod: string = 'CREDIT_CARD'
) => {
    const [simulation, setSimulation] = useState<InstallmentSimulation | null>(null);
    const [anticipationData, setAnticipationData] = useState<InstallmentWithAnticipation | null>(null);
    const [loading, setLoading] = useState(false);

    const { simulateInstallment, simulateWithAnticipation } = useFinancialCalculator();

    // Calcular automaticamente quando valores mudarem (com debounce)
    useEffect(() => {
        const calculate = async () => {
            if (totalValue <= 0) return;

            setLoading(true);

            // Simular sem antecipação
            const simpleResult = await simulateInstallment(
                totalValue,
                downPayment,
                installments,
                paymentMethod
            );
            setSimulation(simpleResult);

            // Simular com antecipação (para comparação)
            const anticipationResult = await simulateWithAnticipation(
                totalValue,
                downPayment,
                installments,
                paymentMethod,
                true
            );
            setAnticipationData(anticipationResult);

            setLoading(false);
        };

        const timeoutId = setTimeout(calculate, 600); // 600ms debounce
        return () => clearTimeout(timeoutId);
    }, [totalValue, downPayment, installments, paymentMethod]);

    // Valores calculados
    const calculatedValues = useMemo(() => {
        // Fallback: Se não tiver simulation (API falhou), calcular manualmente
        if (!simulation) {
            const financedAmount = totalValue - downPayment;
            const simpleInstallmentValue = installments > 0 ? financedAmount / installments : 0;

            // Lógica de taxas por método de pagamento
            let feePercent = 0;

            if (paymentMethod === 'CREDIT_CARD') {
                // Taxa de cartão por parcela
                feePercent = installments === 1 ? 2.49 :
                    installments <= 3 ? 3.49 :
                        installments <= 6 ? 4.09 :
                            installments <= 12 ? 4.69 : 4.99;
            } else if (paymentMethod === 'CASH' && installments > 1) {
                // Boleto parcelado: +30% no total
                feePercent = 30;
            }
            // Pix e Dinheiro: 0% (sempre à vista)

            const cardFeeValue = financedAmount * (feePercent / 100);
            const netReceive = downPayment + (financedAmount - cardFeeValue);

            return {
                installmentValue: simpleInstallmentValue,
                totalFees: cardFeeValue,
                netReceive: netReceive,
                cashIn24h: 0,
                anticipationCost: 0,
                daysToReceive: installments * 30,
                recommendation: paymentMethod === 'CREDIT_CARD'
                    ? 'Cálculo offline - Execute os scripts SQL para análise completa'
                    : paymentMethod === 'CASH' && installments > 1
                        ? `⚠️ Boleto parcelado: +30% de acréscimo (R$ ${cardFeeValue.toFixed(2)})`
                        : 'Pagamento à vista - Sem taxas',
                isAnticipationViable: false,
                estimatedCost: totalValue * 0.20,
                estimatedProfit: netReceive - (totalValue * 0.20),
                estimatedMarginPercent: ((netReceive - (totalValue * 0.20)) / totalValue) * 100
            };
        }

        return {
            // Valores básicos
            installmentValue: simulation.installmentValue || 0,
            totalFees: simulation.cardFeeTotal || 0,
            netReceive: simulation.totalToReceive || 0,

            // Comparação com antecipação
            cashIn24h: anticipationData?.totalToReceiveAnticipated || 0,
            anticipationCost: anticipationData?.cashLossFromAnticipation || 0,
            daysToReceive: anticipationData?.daysToReceiveAll || 0,
            recommendation: anticipationData?.recommendation || '',

            // Análise de viabilidade
            isAnticipationViable: anticipationData
                ? anticipationData.cashLossFromAnticipation < (totalValue * 0.05)
                : false,

            // Margem de lucro estimada (simplificada - 20% de custo médio)
            estimatedCost: totalValue * 0.20,
            estimatedProfit: simulation.totalToReceive - (totalValue * 0.20),
            estimatedMarginPercent: ((simulation.totalToReceive - (totalValue * 0.20)) / totalValue) * 100
        };
    }, [simulation, anticipationData, totalValue, downPayment, installments, paymentMethod]);

    return {
        simulation,
        anticipationData,
        calculatedValues,
        loading
    };
};
