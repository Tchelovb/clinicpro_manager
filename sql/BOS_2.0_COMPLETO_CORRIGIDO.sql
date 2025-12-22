-- =====================================================
-- BOS 2.0 - MOTOR FINANCEIRO COMPLETO E CORRIGIDO
-- Execute este script ÚNICO no Supabase
-- =====================================================

-- =====================================================
-- PARTE 1: LIMPEZA TOTAL
-- =====================================================

-- Dropar TODAS as funções antigas
DROP FUNCTION IF EXISTS get_card_fee_percent(INT) CASCADE;
DROP FUNCTION IF EXISTS get_card_fee_percent(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS get_card_fee_percent(NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS get_card_fee_percent CASCADE;
DROP FUNCTION IF EXISTS simulate_installment_plan CASCADE;
DROP FUNCTION IF EXISTS simulate_installment_with_anticipation CASCADE;
DROP FUNCTION IF EXISTS calculate_budget_net_margin CASCADE;
DROP FUNCTION IF EXISTS compare_payment_scenarios CASCADE;

-- Dropar views dependentes
DROP VIEW IF EXISTS v_budgets_with_margin CASCADE;
DROP VIEW IF EXISTS v_budgets_cash_flow_analysis CASCADE;

SELECT 'Limpeza concluída!' as status;

-- =====================================================
-- PARTE 2: FUNÇÃO DE TAXA DE CARTÃO (CORRIGIDA)
-- =====================================================

CREATE OR REPLACE FUNCTION get_card_fee_percent(p_installments INT)
RETURNS NUMERIC AS $$
BEGIN
    RETURN CASE 
        WHEN p_installments = 1 THEN 2.49
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
        ELSE 4.99
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

SELECT 'Função get_card_fee_percent criada!' as status;

-- =====================================================
-- PARTE 3: SIMULAÇÃO DE PARCELAMENTO
-- =====================================================

CREATE OR REPLACE FUNCTION simulate_installment_plan(
    p_total_value NUMERIC,
    p_down_payment NUMERIC DEFAULT 0,
    p_installments INT DEFAULT 1,
    p_payment_method TEXT DEFAULT 'CREDIT_CARD'
)
RETURNS TABLE (
    downPayment NUMERIC,
    financedAmount NUMERIC,
    installmentCount INT,
    installmentValue NUMERIC,
    cardFeePercent NUMERIC,
    cardFeeTotal NUMERIC,
    totalToReceive NUMERIC,
    netLossFromFees NUMERIC
) AS $$
DECLARE
    v_financed_amount NUMERIC;
    v_installment_value NUMERIC;
    v_card_fee_percent NUMERIC;
    v_card_fee_total NUMERIC;
    v_total_to_receive NUMERIC;
BEGIN
    -- Calcular valor financiado
    v_financed_amount := p_total_value - p_down_payment;
    
    -- Calcular valor da parcela
    v_installment_value := CASE 
        WHEN p_installments > 0 THEN v_financed_amount / p_installments
        ELSE v_financed_amount
    END;
    
    -- Obter taxa de cartão
    v_card_fee_percent := CASE 
        WHEN p_payment_method = 'CREDIT_CARD' THEN get_card_fee_percent(p_installments)
        ELSE 0
    END;
    
    -- Calcular taxa total
    v_card_fee_total := v_financed_amount * (v_card_fee_percent / 100);
    
    -- Calcular total a receber
    v_total_to_receive := p_down_payment + (v_financed_amount - v_card_fee_total);
    
    -- Retornar resultado
    RETURN QUERY SELECT
        p_down_payment,
        v_financed_amount,
        p_installments,
        v_installment_value,
        v_card_fee_percent,
        v_card_fee_total,
        v_total_to_receive,
        v_card_fee_total;
END;
$$ LANGUAGE plpgsql;

SELECT 'Função simulate_installment_plan criada!' as status;

-- =====================================================
-- PARTE 4: SIMULAÇÃO COM ANTECIPAÇÃO
-- =====================================================

CREATE OR REPLACE FUNCTION simulate_installment_with_anticipation(
    p_total_value NUMERIC,
    p_down_payment NUMERIC DEFAULT 0,
    p_installments INT DEFAULT 1,
    p_payment_method TEXT DEFAULT 'CREDIT_CARD',
    p_anticipate BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    downPayment NUMERIC,
    financedAmount NUMERIC,
    installmentCount INT,
    installmentValue NUMERIC,
    cardFeePercent NUMERIC,
    cardFeeTotal NUMERIC,
    totalToReceive NUMERIC,
    netLossFromFees NUMERIC,
    baseFeePercent NUMERIC,
    baseFeeValue NUMERIC,
    anticipationFeePercent NUMERIC,
    anticipationFeeValue NUMERIC,
    totalFeesPercent NUMERIC,
    totalFeesValue NUMERIC,
    totalToReceiveNormal NUMERIC,
    totalToReceiveAnticipated NUMERIC,
    cashLossFromAnticipation NUMERIC,
    daysToReceiveAll INT,
    recommendation TEXT
) AS $$
DECLARE
    v_financed_amount NUMERIC;
    v_installment_value NUMERIC;
    v_card_fee_percent NUMERIC;
    v_card_fee_total NUMERIC;
    v_total_to_receive_normal NUMERIC;
    v_anticipation_fee_percent NUMERIC := 3.5;
    v_anticipation_fee_value NUMERIC;
    v_total_to_receive_anticipated NUMERIC;
    v_cash_loss NUMERIC;
    v_days_to_receive INT;
    v_recommendation TEXT;
BEGIN
    -- Calcular valores básicos
    v_financed_amount := p_total_value - p_down_payment;
    v_installment_value := CASE 
        WHEN p_installments > 0 THEN v_financed_amount / p_installments
        ELSE v_financed_amount
    END;
    
    -- Taxa de cartão
    v_card_fee_percent := CASE 
        WHEN p_payment_method = 'CREDIT_CARD' THEN get_card_fee_percent(p_installments)
        ELSE 0
    END;
    
    v_card_fee_total := v_financed_amount * (v_card_fee_percent / 100);
    v_total_to_receive_normal := p_down_payment + (v_financed_amount - v_card_fee_total);
    
    -- Calcular antecipação
    v_anticipation_fee_value := v_financed_amount * (v_anticipation_fee_percent / 100);
    v_total_to_receive_anticipated := p_down_payment + (v_financed_amount - v_card_fee_total - v_anticipation_fee_value);
    v_cash_loss := v_total_to_receive_normal - v_total_to_receive_anticipated;
    v_days_to_receive := p_installments * 30;
    
    -- Recomendação
    IF v_cash_loss < (p_total_value * 0.05) THEN
        v_recommendation := '✅ Antecipação viável - Perda menor que 5% do total';
    ELSE
        v_recommendation := '⚠️ Antecipação não recomendada - Perda maior que 5% do total';
    END IF;
    
    -- Retornar resultado
    RETURN QUERY SELECT
        p_down_payment,
        v_financed_amount,
        p_installments,
        v_installment_value,
        v_card_fee_percent,
        v_card_fee_total,
        v_total_to_receive_normal,
        v_card_fee_total,
        v_card_fee_percent,
        v_card_fee_total,
        v_anticipation_fee_percent,
        v_anticipation_fee_value,
        v_card_fee_percent + v_anticipation_fee_percent,
        v_card_fee_total + v_anticipation_fee_value,
        v_total_to_receive_normal,
        v_total_to_receive_anticipated,
        v_cash_loss,
        v_days_to_receive,
        v_recommendation;
END;
$$ LANGUAGE plpgsql;

SELECT 'Função simulate_installment_with_anticipation criada!' as status;

-- =====================================================
-- TESTE FINAL
-- =====================================================

-- Testar função de taxa
SELECT get_card_fee_percent(1) as taxa_1x;
SELECT get_card_fee_percent(12) as taxa_12x;

-- Testar simulação
SELECT * FROM simulate_installment_plan(1000, 200, 4, 'CREDIT_CARD');

-- Testar antecipação
SELECT * FROM simulate_installment_with_anticipation(1000, 200, 4, 'CREDIT_CARD', true);

SELECT '✅ BOS 2.0 Motor Financeiro instalado com sucesso!' as status;
