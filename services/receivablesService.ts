
import { supabase } from '../lib/supabase';
import { addMonths, format } from 'date-fns';

export interface ApprovalSimulatonParams {
    totalValue: number;
    installments: number;
    cardProfileId: string;
    downPayment: number;
    clinicId: string;
}

export interface ApprovalSimulationResult {
    grossValue: number;
    netValue: number;
    totalFees: number;
    taxAmount: number;
    cardFeeAmount: number;
    installmentValue: number;
    netInstallmentValue: number;
    rates: {
        tax: number;
        card: number;
        anticipation: number;
    };
}

export const receivablesService = {
    // Simula os valores (bruto vs líquido) antes de aprovar
    async simulateApproval(params: ApprovalSimulatonParams): Promise<ApprovalSimulationResult> {
        const { totalValue, installments, cardProfileId, downPayment, clinicId } = params;

        // 1. Buscar Taxas da Clínica (Impostos)
        const { data: clinic, error: clinicError } = await supabase
            .from('clinics')
            .select('federal_tax_rate, state_tax_rate, municipal_tax_rate, tax_rate_percent')
            .eq('id', clinicId)
            .single();

        if (clinicError) throw new Error('Erro ao buscar taxas da clínica');

        // Soma das taxas fiscais (prioriza colunas novas, fallback para antigo tax_rate_percent)
        const federal = clinic.federal_tax_rate || 0;
        const state = clinic.state_tax_rate || 0;
        const municipal = clinic.municipal_tax_rate || 0;
        let totalTaxRate = federal + state + municipal;

        if (totalTaxRate === 0 && clinic.tax_rate_percent) {
            totalTaxRate = clinic.tax_rate_percent;
        }

        // 2. Buscar Taxas da Maquininha
        let cardRate = 0;
        let anticipationRate = 0;

        if (cardProfileId) {
            const { data: profile, error: profileError } = await supabase
                .from('card_machine_profiles')
                .select(`
                id, 
                anticipation_rate,
                debit_rate,
                card_installment_rates (
                    installments,
                    rate
                )
            `)
                .eq('id', cardProfileId)
                .single();

            if (profileError) throw new Error('Erro ao buscar perfil da maquininha');


            if (installments === 1 && !params.downPayment) {
                // Tratamento simplificado: se for 1x crédito (assumindo crédito à vista se não especificado como débito)
                // Se fosse débito, teria que ter flag. Vamos buscar na tabela de parcelas '1' ou usar uma lógica padrão.
                // Geralmente 1x é crédito à vista.
                const rateObj = profile.card_installment_rates.find((r: any) => r.installments === 1);
                cardRate = rateObj ? rateObj.rate : 0;
            } else {
                const rateObj = profile.card_installment_rates.find((r: any) => r.installments === installments);
                cardRate = rateObj ? rateObj.rate : 0;
            }

            anticipationRate = profile.anticipation_rate || 0;
        }

        // 3. Cálculos
        const valueToInstallment = totalValue - downPayment;

        // Imposto incide sobre o Total Bruto (Nota Fiscal cheia)
        const taxAmount = (totalValue * totalTaxRate) / 100;

        // Taxa de cartão incide sobre o valor passado no cartão (Total - Entrada em Dinheiro/Pix, assumindo entrada não é cartão)
        // SE a entrada for no cartão, a lógica muda. 
        // MVP: Assumir Entrada = Dinheiro/Pix (Taxa 0%) e Restante = Cartão.
        // TODO: Adicionar opção "Entrada no Cartão?"

        const cardFeeAmount = (valueToInstallment * cardRate) / 100;

        const totalFees = taxAmount + cardFeeAmount;
        const netValue = totalValue - totalFees;

        const installmentValue = installments > 0 ? valueToInstallment / installments : 0;
        // Valor líquido por parcela (aproximado, pois o imposto pode ser pago separado)
        const netInstallmentValue = installments > 0 ? (netValue - downPayment) / installments : 0;
        // Nota: Essa divisão do "Líquido por parcela" é meramente ilustrativa pro fluxo de caixa, 
        // tecnicamente o imposto é pago no DAS. O que entra no banco é (Parcela - Taxa Cartão).

        return {
            grossValue: totalValue,
            netValue,
            totalFees,
            taxAmount,
            cardFeeAmount,
            installmentValue,
            netInstallmentValue,
            rates: {
                tax: totalTaxRate,
                card: cardRate,
                anticipation: anticipationRate
            }
        };
    },

    // Aprova e Gera Financeiro
    async approveBudgetAndGenerateInstallments(
        budgetId: string,
        params: ApprovalSimulatonParams & { firstDueDate: Date, patientId: string }
    ): Promise<void> {
        const simulation = await this.simulateApproval(params);

        // 1. Atualizar Orçamento
        const { error: updateError } = await supabase
            .from('budgets')
            .update({
                status: 'APPROVED',
                card_machine_profile_id: params.cardProfileId,
                potential_margin: simulation.netValue, // Armazena o valor líquido real como "margem bruta financeira"
                updated_at: new Date().toISOString()
            })
            .eq('id', budgetId);

        if (updateError) throw updateError;

        // 2. Gerar Parcelas (Entry + Installments)
        const installmentsData = [];

        // 2.1 Entrada (se houver)
        if (params.downPayment > 0) {
            installmentsData.push({
                patient_id: params.patientId,
                clinic_id: params.clinicId,
                budget_id: budgetId,
                installment_number: 0, // 0 representa entrada
                total_installments: params.installments,
                amount: params.downPayment,
                due_date: new Date().toISOString(), // Entrada é hoje
                status: 'PENDING', // Ou PAID se já recebeu
                payment_method: 'CASH', // Default para entrada
                notes: 'Entrada referente ao orçamento'
            });
        }

        // 2.2 Parcelas do Cartão
        const installmentValue = params.installments > 0
            ? (params.totalValue - params.downPayment) / params.installments
            : 0;

        for (let i = 1; i <= params.installments; i++) {
            // Calcular vencimento: 1ª parcela na data escolhida, próximas +30 dias
            // Se firstDueDate for hoje, 1ª é hoje.
            // Usar addMonths do date-fns
            const dueDate = addMonths(params.firstDueDate, i - 1);

            installmentsData.push({
                patient_id: params.patientId,
                clinic_id: params.clinicId,
                budget_id: budgetId,
                installment_number: i,
                total_installments: params.installments,
                amount: installmentValue,
                due_date: dueDate.toISOString(),
                status: 'PENDING',
                payment_method: 'CREDIT_CARD',
                notes: `Parcela ${i}/${params.installments} via Maquininha`
            });
        }

        if (installmentsData.length > 0) {
            const { error: insertError } = await supabase
                .from('installments')
                .insert(installmentsData);

            if (insertError) throw insertError;
        }
    }
};
