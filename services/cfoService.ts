import { supabase } from '../lib/supabase';

// =====================================================
// TYPES
// =====================================================

export interface DREData {
    period_start: string;
    period_end: string;

    // Receitas
    gross_revenue: number;
    deductions: number;
    net_revenue: number;

    // Custos Variáveis
    variable_costs: number;
    gross_profit: number;
    gross_margin_percent: number;

    // Despesas Fixas
    fixed_costs: number;

    // Resultado Operacional
    ebitda: number;
    ebitda_margin_percent: number;

    // Resultado Líquido
    net_profit: number;
    net_margin_percent: number;
}

export interface PDDData {
    total_receivables: number;
    overdue_0_30_days: number;
    overdue_31_60_days: number;
    overdue_61_90_days: number;
    overdue_over_90_days: number;

    // Provisões
    provision_0_30_days: number;
    provision_31_60_days: number;
    provision_61_90_days: number;
    provision_over_90_days: number;
    total_provision: number;

    // Taxas de inadimplência
    default_rate_percent: number;
}

export interface CashFlowData {
    date: string;

    // Entradas
    cash_inflows: number;
    receivables_collected: number;
    other_income: number;

    // Saídas
    cash_outflows: number;
    fixed_costs_paid: number;
    variable_costs_paid: number;
    investments: number;

    // Saldo
    net_cash_flow: number;
    accumulated_balance: number;
}

export interface FinancialHealthScore {
    overall_score: number; // 0-100
    liquidity_score: number;
    profitability_score: number;
    efficiency_score: number;
    growth_score: number;

    alerts: FinancialAlert[];
}

export interface FinancialAlert {
    severity: 'critical' | 'warning' | 'info';
    category: string;
    message: string;
    value?: number;
    threshold?: number;
}

// =====================================================
// CONSTANTS
// =====================================================

// PDD Rates (Provisão para Devedores Duvidosos)
const PDD_RATES = {
    '0-30': 0.01,    // 1% de provisão
    '31-60': 0.05,   // 5% de provisão
    '61-90': 0.25,   // 25% de provisão
    '90+': 0.75      // 75% de provisão
};

// =====================================================
// SERVICE
// =====================================================

export const cfoService = {
    /**
     * Generate DRE (Demonstrativo de Resultados do Exercício)
     */
    async generateDRE(
        clinicId: string,
        startDate: string,
        endDate: string
    ): Promise<DREData> {
        // 1. Receita Bruta (Gross Revenue)
        const { data: revenues } = await supabase
            .from('transactions')
            .select('amount')
            .eq('clinic_id', clinicId)
            .eq('type', 'INCOME')
            .gte('date', startDate)
            .lte('date', endDate);

        const gross_revenue = (revenues || []).reduce((sum, t) => sum + t.amount, 0);

        // 2. Deduções (impostos, descontos)
        const { data: clinic } = await supabase
            .from('clinics')
            .select('tax_rate_percent')
            .eq('id', clinicId)
            .single();

        const tax_rate = clinic?.tax_rate_percent || 6;
        const deductions = gross_revenue * (tax_rate / 100);
        const net_revenue = gross_revenue - deductions;

        // 3. Custos Variáveis (procedimentos, lab, material)
        const { data: variableCosts } = await supabase
            .from('transactions')
            .select('amount, category')
            .eq('clinic_id', clinicId)
            .eq('type', 'EXPENSE')
            .gte('date', startDate)
            .lte('date', endDate);

        // Filter only variable costs
        const variable_costs = (variableCosts || [])
            .filter(t => ['LAB', 'MATERIAL', 'VARIABLE'].includes(t.category))
            .reduce((sum, t) => sum + t.amount, 0);

        const gross_profit = net_revenue - variable_costs;
        const gross_margin_percent = net_revenue > 0 ? (gross_profit / net_revenue) * 100 : 0;

        // 4. Custos Fixos
        const fixed_costs = (variableCosts || [])
            .filter(t => !['LAB', 'MATERIAL', 'VARIABLE'].includes(t.category))
            .reduce((sum, t) => sum + t.amount, 0);

        // 5. EBITDA (Earnings Before Interest, Taxes, Depreciation, Amortization)
        const ebitda = gross_profit - fixed_costs;
        const ebitda_margin_percent = net_revenue > 0 ? (ebitda / net_revenue) * 100 : 0;

        // 6. Resultado Líquido
        const net_profit = ebitda; // Simplificado (sem juros, depreciação)
        const net_margin_percent = net_revenue > 0 ? (net_profit / net_revenue) * 100 : 0;

        return {
            period_start: startDate,
            period_end: endDate,
            gross_revenue,
            deductions,
            net_revenue,
            variable_costs,
            gross_profit,
            gross_margin_percent,
            fixed_costs,
            ebitda,
            ebitda_margin_percent,
            net_profit,
            net_margin_percent
        };
    },

    /**
     * Calculate PDD (Provisão para Devedores Duvidosos)
     */
    async calculatePDD(clinicId: string): Promise<PDDData> {
        const { data: installments } = await supabase
            .from('installments')
            .select('amount, due_date, status')
            .eq('clinic_id', clinicId)
            .in('status', ['PENDING', 'OVERDUE']);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let overdue_0_30_days = 0;
        let overdue_31_60_days = 0;
        let overdue_61_90_days = 0;
        let overdue_over_90_days = 0;

        (installments || []).forEach(inst => {
            const dueDate = new Date(inst.due_date);
            dueDate.setHours(0, 0, 0, 0);

            const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

            if (daysOverdue < 0) return; // Not overdue yet

            if (daysOverdue <= 30) {
                overdue_0_30_days += inst.amount;
            } else if (daysOverdue <= 60) {
                overdue_31_60_days += inst.amount;
            } else if (daysOverdue <= 90) {
                overdue_61_90_days += inst.amount;
            } else {
                overdue_over_90_days += inst.amount;
            }
        });

        const total_receivables = overdue_0_30_days + overdue_31_60_days + overdue_61_90_days + overdue_over_90_days;

        // Calculate provisions
        const provision_0_30_days = overdue_0_30_days * PDD_RATES['0-30'];
        const provision_31_60_days = overdue_31_60_days * PDD_RATES['31-60'];
        const provision_61_90_days = overdue_61_90_days * PDD_RATES['61-90'];
        const provision_over_90_days = overdue_over_90_days * PDD_RATES['90+'];
        const total_provision = provision_0_30_days + provision_31_60_days + provision_61_90_days + provision_over_90_days;

        const default_rate_percent = total_receivables > 0 ? (total_provision / total_receivables) * 100 : 0;

        return {
            total_receivables,
            overdue_0_30_days,
            overdue_31_60_days,
            overdue_61_90_days,
            overdue_over_90_days,
            provision_0_30_days,
            provision_31_60_days,
            provision_61_90_days,
            provision_over_90_days,
            total_provision,
            default_rate_percent
        };
    },

    /**
     * Generate Cash Flow projection
     */
    async generateCashFlow(
        clinicId: string,
        startDate: string,
        endDate: string,
        projectionDays: number = 30
    ): Promise<CashFlowData[]> {
        const cashFlow: CashFlowData[] = [];
        let accumulated_balance = 0;

        // Get current balance
        const { data: registers } = await supabase
            .from('cash_registers')
            .select('closing_balance')
            .eq('clinic_id', clinicId)
            .eq('status', 'CLOSED')
            .order('closed_at', { ascending: false })
            .limit(1);

        accumulated_balance = registers?.[0]?.closing_balance || 0;

        // Generate daily projections
        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];

            // Get actual transactions for this date
            const { data: transactions } = await supabase
                .from('transactions')
                .select('amount, type')
                .eq('clinic_id', clinicId)
                .eq('date', dateStr);

            const cash_inflows = (transactions || [])
                .filter(t => t.type === 'INCOME')
                .reduce((sum, t) => sum + t.amount, 0);

            const cash_outflows = (transactions || [])
                .filter(t => t.type === 'EXPENSE')
                .reduce((sum, t) => sum + t.amount, 0);

            // Get receivables due on this date
            const { data: installments } = await supabase
                .from('installments')
                .select('amount')
                .eq('clinic_id', clinicId)
                .eq('due_date', dateStr)
                .eq('status', 'PAID');

            const receivables_collected = (installments || []).reduce((sum, i) => sum + i.amount, 0);

            const net_cash_flow = cash_inflows + receivables_collected - cash_outflows;
            accumulated_balance += net_cash_flow;

            cashFlow.push({
                date: dateStr,
                cash_inflows,
                receivables_collected,
                other_income: 0,
                cash_outflows,
                fixed_costs_paid: 0,
                variable_costs_paid: 0,
                investments: 0,
                net_cash_flow,
                accumulated_balance
            });
        }

        return cashFlow;
    },

    /**
     * Calculate Financial Health Score
     */
    async calculateFinancialHealth(clinicId: string): Promise<FinancialHealthScore> {
        const alerts: FinancialAlert[] = [];

        // Get DRE for last month
        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

        const dre = await this.generateDRE(
            clinicId,
            lastMonth.toISOString().split('T')[0],
            lastMonthEnd.toISOString().split('T')[0]
        );

        const pdd = await this.calculatePDD(clinicId);

        // 1. Profitability Score (0-100)
        let profitability_score = 0;
        if (dre.net_margin_percent >= 30) profitability_score = 100;
        else if (dre.net_margin_percent >= 20) profitability_score = 80;
        else if (dre.net_margin_percent >= 10) profitability_score = 60;
        else if (dre.net_margin_percent >= 0) profitability_score = 40;
        else profitability_score = 20;

        if (dre.net_margin_percent < 15) {
            alerts.push({
                severity: 'warning',
                category: 'Lucratividade',
                message: 'Margem líquida abaixo do ideal',
                value: dre.net_margin_percent,
                threshold: 15
            });
        }

        // 2. Liquidity Score (based on PDD)
        let liquidity_score = 100;
        if (pdd.default_rate_percent > 20) liquidity_score = 40;
        else if (pdd.default_rate_percent > 10) liquidity_score = 60;
        else if (pdd.default_rate_percent > 5) liquidity_score = 80;

        if (pdd.default_rate_percent > 10) {
            alerts.push({
                severity: 'critical',
                category: 'Inadimplência',
                message: 'Taxa de inadimplência crítica',
                value: pdd.default_rate_percent,
                threshold: 10
            });
        }

        // 3. Efficiency Score (based on gross margin)
        let efficiency_score = 0;
        if (dre.gross_margin_percent >= 70) efficiency_score = 100;
        else if (dre.gross_margin_percent >= 60) efficiency_score = 80;
        else if (dre.gross_margin_percent >= 50) efficiency_score = 60;
        else efficiency_score = 40;

        // 4. Growth Score (simplified - would need historical data)
        const growth_score = 70; // Placeholder

        // Overall Score
        const overall_score = Math.round(
            (profitability_score * 0.3) +
            (liquidity_score * 0.3) +
            (efficiency_score * 0.2) +
            (growth_score * 0.2)
        );

        return {
            overall_score,
            liquidity_score,
            profitability_score,
            efficiency_score,
            growth_score,
            alerts
        };
    }
};
