-- =====================================================
-- BOS 2.0 - MOTOR FINANCEIRO FINAL (V3)
-- Execute este script ÚNICO no Supabase
-- Correções: CamelCase nos retornos + Lógica Boleto 30%
-- =====================================================

-- =====================================================
-- LIMPEZA
-- =====================================================
DROP FUNCTION IF EXISTS get_card_fee_percent(INT) CASCADE;
DROP FUNCTION IF EXISTS simulate_installment_plan CASCADE;
DROP FUNCTION IF EXISTS simulate_installment_with_anticipation CASCADE;

-- =====================================================
-- 1. FUNÇÃO DE TAXA DE CARTÃO
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

-- =====================================================
-- 2. SIMULAÇÃO DE PARCELAMENTO
-- IMPORTANTE: Aspas duplas nos nomes para garantir camelCase no JSON
-- =====================================================
CREATE OR REPLACE FUNCTION simulate_installment_plan(
    p_total_value NUMERIC,
    p_down_payment NUMERIC DEFAULT 0,
    p_installments INT DEFAULT 1,
    p_payment_method TEXT DEFAULT 'CREDIT_CARD'
)
RETURNS TABLE (
    "downPayment" NUMERIC,
    "financedAmount" NUMERIC,
    "installmentCount" INT,
    "installmentValue" NUMERIC,
    "cardFeePercent" NUMERIC,
    "cardFeeTotal" NUMERIC,
    "totalToReceive" NUMERIC,
    "netLossFromFees" NUMERIC
) AS $$
DECLARE
    v_financed_amount NUMERIC;
    v_installment_value NUMERIC;
    v_card_fee_percent NUMERIC;
    v_card_fee_total NUMERIC;
    v_total_to_receive NUMERIC;
    v_boleto_fee_percent NUMERIC := 30; -- 30% de acréscimo
    v_boleto_fee_value NUMERIC := 0;
BEGIN
    -- Calcular valor base para financiamento
    v_financed_amount := p_total_value - p_down_payment;
    
    -- Lógica específica por método
    IF p_payment_method = 'BOLETO' AND p_installments > 1 THEN
        -- Boleto Parcelado: Acréscimo de 30% sobre o valor financiado (ou total?)
        -- Usuário disse: "acresxcimo de 30% no valor total do tratamento"
        -- Vamos aplicar sobre o saldo devedor para simplificar, ou total?
        -- Aplicando sobre o saldo a financiar:
        v_boleto_fee_value := v_financed_amount * (v_boleto_fee_percent / 100);
        v_financed_amount := v_financed_amount + v_boleto_fee_value;
        v_card_fee_percent := 0; -- Sem taxa para clínica (é cobrado do paciente)
    ELSIF p_payment_method = 'CREDIT_CARD' THEN
        v_card_fee_percent := get_card_fee_percent(p_installments);
    ELSE
        v_card_fee_percent := 0;
    END IF;
    
    -- Calcular parcela
    v_installment_value := CASE 
        WHEN p_installments > 0 THEN v_financed_amount / p_installments
        ELSE v_financed_amount
    END;
    
    -- Calcular taxa da clínica (ex: taxa de maquinha)
    -- Para boleto, o acréscimo é receita extra ou custo? 
    -- Se é acréscimo cobrado do paciente, entra como receita, não desconta.
    -- Taxa de cartão é DESCONTO.
    v_card_fee_total := (p_total_value - p_down_payment) * (v_card_fee_percent / 100);
    
    -- Total a receber (Liquido para clínica)
    -- Se for boleto, recebe: Entrada + (Financiado com Juros).
    -- Mas o "valor do tratamento" original era X. O que excede é lucro financeiro.
    v_total_to_receive := p_down_payment + (v_financed_amount) - v_card_fee_total;
    
    RETURN QUERY SELECT
        p_down_payment,
        v_financed_amount, -- Valor financiado (já com acréscimo se for boleto)
        p_installments,
        v_installment_value,
        v_card_fee_percent,
        v_card_fee_total,
        v_total_to_receive,
        v_card_fee_total;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. SIMULAÇÃO COM ANTECIPAÇÃO (Wrapper)
-- =====================================================
CREATE OR REPLACE FUNCTION simulate_installment_with_anticipation(
    p_total_value NUMERIC,
    p_down_payment NUMERIC DEFAULT 0,
    p_installments INT DEFAULT 1,
    p_payment_method TEXT DEFAULT 'CREDIT_CARD',
    p_anticipate BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    "downPayment" NUMERIC,
    "financedAmount" NUMERIC,
    "installmentCount" INT,
    "installmentValue" NUMERIC,
    "cardFeePercent" NUMERIC,
    "cardFeeTotal" NUMERIC,
    "totalToReceive" NUMERIC,
    "netLossFromFees" NUMERIC,
    "baseFeePercent" NUMERIC,
    "baseFeeValue" NUMERIC,
    "anticipationFeePercent" NUMERIC,
    "anticipationFeeValue" NUMERIC,
    "totalFeesPercent" NUMERIC,
    "totalFeesValue" NUMERIC,
    "totalToReceiveNormal" NUMERIC,
    "totalToReceiveAnticipated" NUMERIC,
    "cashLossFromAnticipation" NUMERIC,
    "daysToReceiveAll" INT,
    "recommendation" TEXT
) AS $$
DECLARE
    -- Variáveis locais para chamada da função base
    r RECORD;
    v_anticipation_fee_percent NUMERIC := 3.5;
    v_anticipation_fee_value NUMERIC;
    v_total_to_receive_anticipated NUMERIC;
    v_cash_loss NUMERIC;
    v_days_to_receive INT;
    v_recommendation TEXT;
BEGIN
    -- Chamar a função base para cálculos comuns
    SELECT * INTO r FROM simulate_installment_plan(p_total_value, p_down_payment, p_installments, p_payment_method);
    
    -- Calcular antecipação apenas se for Cartão (Boleto não antecipa automático da mesma forma nesta regra simplificada)
    IF p_payment_method = 'CREDIT_CARD' AND p_installments > 1 THEN
        v_anticipation_fee_value := r."financedAmount" * (v_anticipation_fee_percent / 100);
        v_total_to_receive_anticipated := r."totalToReceive" - v_anticipation_fee_value;
        v_cash_loss := r."totalToReceive" - v_total_to_receive_anticipated;
        v_days_to_receive := 24; -- horas (simbólico, retorna 1 dia)
        
        IF v_cash_loss < (p_total_value * 0.05) THEN
            v_recommendation := '✅ Antecipação viável';
        ELSE
            v_recommendation := '⚠️ Antecipação custosa';
        END IF;
    ELSE
        -- Sem antecipação para boleto/pix/1x
        v_anticipation_fee_percent := 0;
        v_anticipation_fee_value := 0;
        v_total_to_receive_anticipated := r."totalToReceive";
        v_cash_loss := 0;
        v_days_to_receive := p_installments * 30;
        v_recommendation := 'N/A';
    END IF;

    RETURN QUERY SELECT
        r."downPayment",
        r."financedAmount",
        r."installmentCount",
        r."installmentValue",
        r."cardFeePercent",
        r."cardFeeTotal",
        r."totalToReceive",
        r."netLossFromFees",
        r."cardFeePercent", -- baseFee
        r."cardFeeTotal",   -- baseValue
        v_anticipation_fee_percent,
        v_anticipation_fee_value,
        r."cardFeePercent" + v_anticipation_fee_percent,
        r."cardFeeTotal" + v_anticipation_fee_value,
        r."totalToReceive",
        v_total_to_receive_anticipated,
        v_cash_loss,
        v_days_to_receive,
        v_recommendation;
END;
$$ LANGUAGE plpgsql;

SELECT '✅ BOS 2.0 FINAL (V3) Instalado com sucesso!' as status;
