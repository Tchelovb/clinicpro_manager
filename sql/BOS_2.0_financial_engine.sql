-- =====================================================
-- BOS 2.0: MOTOR FINANCEIRO INTELIGENTE
-- Sistema de Cálculo de Margem Real com Taxas de Cartão
-- =====================================================

-- 1. POPULAR TAXAS DE CARTÃO DE CRÉDITO
-- Baseado em médias de mercado (Stone, Cielo, PagSeguro)
INSERT INTO payment_method_fees (clinic_id, payment_method_name, payment_type, fee_type, fee_percent, installments_allowed, max_installments)
SELECT 
    c.id,
    'Cartão de Crédito',
    'CREDIT',
    'PERCENTAGE',
    0,
    true,
    12
FROM clinics c
WHERE NOT EXISTS (
    SELECT 1 FROM payment_method_fees 
    WHERE clinic_id = c.id 
    AND payment_method_name = 'Cartão de Crédito'
);

-- 2. FUNÇÃO: CALCULAR TAXA DE CARTÃO POR PARCELA
-- Retorna a taxa exata baseada no número de parcelas
DROP FUNCTION IF EXISTS get_card_fee_percent(INT);

CREATE OR REPLACE FUNCTION get_card_fee_percent(p_installments INT)
RETURNS NUMERIC AS $$
BEGIN
    RETURN CASE 
        WHEN p_installments = 1 THEN 2.49   -- À vista no crédito
        WHEN p_installments = 2 THEN 3.19
        WHEN p_installments = 3 THEN 3.49
        WHEN p_installments = 4 THEN 3.69
        WHEN p_installments = 5 THEN 3.89
        WHEN p_installments = 6 THEN 4.09
        WHEN p_installments = 7 THEN 4.19
        WHEN p_installments = 8 THEN 4.29
        WHEN p_installments = 9 THEN 4.39
        WHEN p_installments = 10 THEN 4.49
        WHEN p_installments = 11 THEN 4.59
        WHEN p_installments = 12 THEN 4.69
        ELSE 4.99  -- Acima de 12x (se houver)
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. FUNÇÃO: CALCULAR MARGEM LÍQUIDA DE UM ORÇAMENTO
-- Considera: Valor Total - Custos de Procedimentos - Taxa de Cartão - Impostos
CREATE OR REPLACE FUNCTION calculate_budget_net_margin(
    p_budget_id UUID,
    p_payment_method TEXT DEFAULT 'CREDIT_CARD',
    p_installments INT DEFAULT 1
)
RETURNS TABLE(
    total_value NUMERIC,
    total_cost NUMERIC,
    card_fee_percent NUMERIC,
    card_fee_value NUMERIC,
    tax_percent NUMERIC,
    tax_value NUMERIC,
    net_margin_value NUMERIC,
    net_margin_percent NUMERIC,
    is_profitable BOOLEAN
) AS $$
DECLARE
    v_total NUMERIC;
    v_cost NUMERIC;
    v_card_fee_pct NUMERIC;
    v_card_fee_val NUMERIC;
    v_tax_pct NUMERIC := 6.0; -- Simples Nacional médio
    v_tax_val NUMERIC;
    v_net_margin NUMERIC;
    v_net_margin_pct NUMERIC;
BEGIN
    -- Buscar valor total do orçamento
    SELECT final_value INTO v_total
    FROM budgets
    WHERE id = p_budget_id;

    -- Calcular custo total dos procedimentos
    SELECT COALESCE(SUM(
        COALESCE(pc.total_cost, 0) * bi.quantity
    ), 0) INTO v_cost
    FROM budget_items bi
    LEFT JOIN procedure p ON bi.procedure_id = p.id
    LEFT JOIN procedure_costs pc ON pc.procedure_id = p.id
    WHERE bi.budget_id = p_budget_id;

    -- Calcular taxa de cartão
    IF p_payment_method = 'CREDIT_CARD' THEN
        v_card_fee_pct := get_card_fee_percent(p_installments);
        v_card_fee_val := v_total * (v_card_fee_pct / 100);
    ELSE
        v_card_fee_pct := 0;
        v_card_fee_val := 0;
    END IF;

    -- Calcular impostos
    v_tax_val := v_total * (v_tax_pct / 100);

    -- Calcular margem líquida
    v_net_margin := v_total - v_cost - v_card_fee_val - v_tax_val;
    v_net_margin_pct := CASE 
        WHEN v_total > 0 THEN (v_net_margin / v_total) * 100 
        ELSE 0 
    END;

    RETURN QUERY SELECT 
        v_total,
        v_cost,
        v_card_fee_pct,
        v_card_fee_val,
        v_tax_pct,
        v_tax_val,
        v_net_margin,
        v_net_margin_pct,
        v_net_margin_pct >= 20.0; -- Margem mínima saudável: 20%
END;
$$ LANGUAGE plpgsql;

-- 4. FUNÇÃO: SIMULAR PARCELAMENTO COM ENTRADA
-- Retorna o valor exato de cada parcela considerando entrada
CREATE OR REPLACE FUNCTION simulate_installment_plan(
    p_total_value NUMERIC,
    p_down_payment NUMERIC DEFAULT 0,
    p_installments INT DEFAULT 1,
    p_payment_method TEXT DEFAULT 'CREDIT_CARD'
)
RETURNS TABLE(
    down_payment NUMERIC,
    financed_amount NUMERIC,
    installment_count INT,
    installment_value NUMERIC,
    card_fee_percent NUMERIC,
    card_fee_total NUMERIC,
    total_to_receive NUMERIC,
    net_loss_from_fees NUMERIC
) AS $$
DECLARE
    v_financed NUMERIC;
    v_card_fee_pct NUMERIC;
    v_card_fee_total NUMERIC;
    v_installment_val NUMERIC;
    v_total_receive NUMERIC;
BEGIN
    -- Calcular valor financiado (após entrada)
    v_financed := p_total_value - p_down_payment;

    -- Calcular taxa de cartão
    IF p_payment_method = 'CREDIT_CARD' THEN
        v_card_fee_pct := get_card_fee_percent(p_installments);
        v_card_fee_total := v_financed * (v_card_fee_pct / 100);
    ELSE
        v_card_fee_pct := 0;
        v_card_fee_total := 0;
    END IF;

    -- Calcular valor da parcela
    v_installment_val := CASE 
        WHEN p_installments > 0 THEN v_financed / p_installments 
        ELSE 0 
    END;

    -- Total que a clínica receberá (descontando taxas)
    v_total_receive := p_down_payment + (v_financed - v_card_fee_total);

    RETURN QUERY SELECT 
        p_down_payment,
        v_financed,
        p_installments,
        v_installment_val,
        v_card_fee_pct,
        v_card_fee_total,
        v_total_receive,
        p_total_value - v_total_receive; -- Perda com taxas
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. VIEW: ORÇAMENTOS COM MARGEM LÍQUIDA CALCULADA
CREATE OR REPLACE VIEW v_budgets_with_margin AS
SELECT 
    b.id,
    b.patient_id,
    p.name as patient_name,
    b.status,
    b.final_value,
    b.installments_count,
    b.down_payment_value,
    m.total_cost,
    m.card_fee_percent,
    m.card_fee_value,
    m.tax_value,
    m.net_margin_value,
    m.net_margin_percent,
    m.is_profitable,
    CASE 
        WHEN m.net_margin_percent >= 30 THEN 'EXCELENTE'
        WHEN m.net_margin_percent >= 20 THEN 'BOM'
        WHEN m.net_margin_percent >= 10 THEN 'ACEITÁVEL'
        ELSE 'CRÍTICO'
    END as margin_status
FROM budgets b
JOIN patients p ON b.patient_id = p.id
CROSS JOIN LATERAL calculate_budget_net_margin(
    b.id, 
    'CREDIT_CARD', 
    COALESCE(b.installments_count, 1)
) m
WHERE b.status IN ('DRAFT', 'SENT', 'APPROVED');

-- 6. COMENTÁRIOS E DOCUMENTAÇÃO
COMMENT ON FUNCTION get_card_fee_percent IS 
'Retorna a taxa de cartão de crédito baseada no número de parcelas (1x a 12x)';

COMMENT ON FUNCTION calculate_budget_net_margin IS 
'Calcula a margem líquida real de um orçamento considerando custos, taxas de cartão e impostos';

COMMENT ON FUNCTION simulate_installment_plan IS 
'Simula um plano de parcelamento com entrada, retornando valor exato das parcelas e impacto das taxas';

COMMENT ON VIEW v_budgets_with_margin IS 
'View que exibe todos os orçamentos com margem líquida calculada automaticamente';

-- =====================================================
-- EXEMPLOS DE USO:
-- =====================================================

-- Exemplo 1: Simular parcelamento de R$ 30.000 com R$ 5.000 de entrada em 10x
-- SELECT * FROM simulate_installment_plan(30000, 5000, 10, 'CREDIT_CARD');

-- Exemplo 2: Ver margem líquida de um orçamento específico
-- SELECT * FROM calculate_budget_net_margin('uuid-do-orcamento', 'CREDIT_CARD', 12);

-- Exemplo 3: Listar todos os orçamentos com margem crítica
-- SELECT * FROM v_budgets_with_margin WHERE margin_status = 'CRÍTICO';

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
