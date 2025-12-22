-- =====================================================
-- BOS 2.0: MOTOR DE ANTECIPAÇÃO DE RECEBÍVEIS
-- Sistema de Cálculo de Fluxo de Caixa Real
-- =====================================================

-- 1. ATUALIZAR FUNÇÃO DE TAXA DE CARTÃO (com antecipação)
DROP FUNCTION IF EXISTS get_card_fee_percent(INT);

CREATE OR REPLACE FUNCTION get_card_fee_percent(
    p_installments INT,
    p_with_anticipation BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
    base_fee_percent NUMERIC,
    anticipation_fee_percent NUMERIC,
    total_fee_percent NUMERIC
) AS $$
DECLARE
    v_base_fee NUMERIC;
    v_anticipation_fee NUMERIC;
BEGIN
    -- Taxa base de intermediação (Stone, Cielo, PagSeguro)
    v_base_fee := CASE 
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

    -- Taxa de antecipação (se solicitada)
    -- Fórmula: 2% a.m. por parcela antecipada
    -- Exemplo: 12x = 12 meses antecipados = 24% adicional
    IF p_with_anticipation THEN
        v_anticipation_fee := CASE
            WHEN p_installments = 1 THEN 0      -- Já cai em 1 dia
            WHEN p_installments = 2 THEN 2.0    -- 1 mês antecipado
            WHEN p_installments = 3 THEN 4.0    -- 2 meses
            WHEN p_installments = 4 THEN 6.0    -- 3 meses
            WHEN p_installments = 5 THEN 8.0    -- 4 meses
            WHEN p_installments = 6 THEN 10.0   -- 5 meses
            WHEN p_installments = 7 THEN 12.0   -- 6 meses
            WHEN p_installments = 8 THEN 14.0   -- 7 meses
            WHEN p_installments = 9 THEN 16.0   -- 8 meses
            WHEN p_installments = 10 THEN 18.0  -- 9 meses
            WHEN p_installments = 11 THEN 20.0  -- 10 meses
            WHEN p_installments = 12 THEN 22.0  -- 11 meses
            ELSE 24.0
        END;
    ELSE
        v_anticipation_fee := 0;
    END IF;

    RETURN QUERY SELECT 
        v_base_fee,
        v_anticipation_fee,
        v_base_fee + v_anticipation_fee;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. FUNÇÃO: SIMULAR PARCELAMENTO COM ANTECIPAÇÃO
CREATE OR REPLACE FUNCTION simulate_installment_with_anticipation(
    p_total_value NUMERIC,
    p_down_payment NUMERIC DEFAULT 0,
    p_installments INT DEFAULT 1,
    p_payment_method TEXT DEFAULT 'CREDIT_CARD',
    p_anticipate BOOLEAN DEFAULT FALSE
)
RETURNS TABLE(
    -- Valores Básicos
    down_payment NUMERIC,
    financed_amount NUMERIC,
    installment_count INT,
    installment_value NUMERIC,
    
    -- Taxas Detalhadas
    base_card_fee_percent NUMERIC,
    base_card_fee_value NUMERIC,
    anticipation_fee_percent NUMERIC,
    anticipation_fee_value NUMERIC,
    total_fees_percent NUMERIC,
    total_fees_value NUMERIC,
    
    -- Valores Finais
    total_to_receive_normal NUMERIC,      -- Recebe ao longo do tempo
    total_to_receive_anticipated NUMERIC, -- Recebe em 24h
    cash_loss_from_anticipation NUMERIC,  -- Quanto perde antecipando
    
    -- Análise de Decisão
    days_to_receive_all INT,
    recommendation TEXT
) AS $$
DECLARE
    v_financed NUMERIC;
    v_fees RECORD;
    v_base_fee_val NUMERIC;
    v_anticipation_fee_val NUMERIC;
    v_total_fees_val NUMERIC;
    v_installment_val NUMERIC;
    v_receive_normal NUMERIC;
    v_receive_anticipated NUMERIC;
    v_days INT;
    v_recommendation TEXT;
BEGIN
    -- Calcular valor financiado
    v_financed := p_total_value - p_down_payment;

    -- Calcular taxas
    IF p_payment_method = 'CREDIT_CARD' THEN
        SELECT * INTO v_fees FROM get_card_fee_percent(p_installments, p_anticipate);
        
        v_base_fee_val := v_financed * (v_fees.base_fee_percent / 100);
        v_anticipation_fee_val := v_financed * (v_fees.anticipation_fee_percent / 100);
        v_total_fees_val := v_base_fee_val + v_anticipation_fee_val;
    ELSE
        v_fees.base_fee_percent := 0;
        v_fees.anticipation_fee_percent := 0;
        v_fees.total_fee_percent := 0;
        v_base_fee_val := 0;
        v_anticipation_fee_val := 0;
        v_total_fees_val := 0;
    END IF;

    -- Calcular valor da parcela
    v_installment_val := CASE 
        WHEN p_installments > 0 THEN v_financed / p_installments 
        ELSE 0 
    END;

    -- Calcular valores a receber
    v_receive_normal := p_down_payment + (v_financed - v_base_fee_val);
    v_receive_anticipated := p_down_payment + (v_financed - v_total_fees_val);

    -- Calcular dias até receber tudo
    v_days := p_installments * 30;

    -- Gerar recomendação
    IF p_installments <= 3 THEN
        v_recommendation := 'NÃO ANTECIPAR - Prazo curto, perda não compensa';
    ELSIF v_fees.anticipation_fee_percent > 15 THEN
        v_recommendation := 'EVITAR - Taxa de antecipação muito alta';
    ELSIF v_anticipation_fee_val < (p_total_value * 0.05) THEN
        v_recommendation := 'CONSIDERAR - Perda aceitável para liquidez imediata';
    ELSE
        v_recommendation := 'AVALIAR NECESSIDADE - Impacto moderado no caixa';
    END IF;

    RETURN QUERY SELECT 
        p_down_payment,
        v_financed,
        p_installments,
        v_installment_val,
        v_fees.base_fee_percent,
        v_base_fee_val,
        v_fees.anticipation_fee_percent,
        v_anticipation_fee_val,
        v_fees.total_fee_percent,
        v_total_fees_val,
        v_receive_normal,
        v_receive_anticipated,
        v_receive_normal - v_receive_anticipated,
        v_days,
        v_recommendation;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. FUNÇÃO: ANÁLISE COMPARATIVA DE CENÁRIOS
CREATE OR REPLACE FUNCTION compare_payment_scenarios(
    p_total_value NUMERIC,
    p_down_payment NUMERIC DEFAULT 0
)
RETURNS TABLE(
    scenario TEXT,
    installments INT,
    installment_value NUMERIC,
    total_fees NUMERIC,
    net_to_receive NUMERIC,
    days_to_full_payment INT,
    margin_impact_percent NUMERIC,
    recommendation_score INT
) AS $$
BEGIN
    RETURN QUERY
    WITH scenarios AS (
        SELECT 
            CASE 
                WHEN i = 1 THEN 'À Vista (Cartão)'
                WHEN i <= 3 THEN 'Curto Prazo'
                WHEN i <= 6 THEN 'Médio Prazo'
                ELSE 'Longo Prazo'
            END as scenario_name,
            i as inst_count,
            s.*
        FROM generate_series(1, 12) i,
        LATERAL simulate_installment_with_anticipation(
            p_total_value, 
            p_down_payment, 
            i, 
            'CREDIT_CARD', 
            FALSE
        ) s
    )
    SELECT 
        scenario_name,
        inst_count,
        installment_value,
        total_fees_value,
        total_to_receive_normal,
        days_to_receive_all,
        (total_fees_value / p_total_value * 100)::NUMERIC(10,2),
        CASE 
            WHEN inst_count = 1 THEN 100
            WHEN inst_count <= 3 THEN 90
            WHEN inst_count <= 6 THEN 75
            WHEN inst_count <= 10 THEN 60
            ELSE 40
        END
    FROM scenarios
    ORDER BY inst_count;
END;
$$ LANGUAGE plpgsql;

-- 4. VIEW: ORÇAMENTOS COM ANÁLISE DE ANTECIPAÇÃO
CREATE OR REPLACE VIEW v_budgets_cash_flow_analysis AS
SELECT 
    b.id,
    b.patient_id,
    p.name as patient_name,
    b.status,
    b.final_value,
    b.down_payment_value,
    b.installments_count,
    
    -- Cenário Normal (sem antecipação)
    s_normal.total_to_receive_normal as cash_flow_normal,
    s_normal.total_fees_value as fees_normal,
    s_normal.days_to_receive_all as days_to_receive,
    
    -- Cenário Antecipado
    s_anticipated.total_to_receive_anticipated as cash_available_24h,
    s_anticipated.total_fees_value as fees_with_anticipation,
    s_anticipated.cash_loss_from_anticipation as anticipation_cost,
    
    -- Análise de Decisão
    CASE 
        WHEN s_anticipated.cash_loss_from_anticipation < (b.final_value * 0.05) THEN 'VIÁVEL'
        WHEN s_anticipated.cash_loss_from_anticipation < (b.final_value * 0.10) THEN 'MODERADO'
        ELSE 'ALTO CUSTO'
    END as anticipation_viability,
    
    s_anticipated.recommendation
    
FROM budgets b
JOIN patients p ON b.patient_id = p.id
CROSS JOIN LATERAL simulate_installment_with_anticipation(
    b.final_value,
    COALESCE(b.down_payment_value, 0),
    COALESCE(b.installments_count, 1),
    'CREDIT_CARD',
    FALSE
) s_normal
CROSS JOIN LATERAL simulate_installment_with_anticipation(
    b.final_value,
    COALESCE(b.down_payment_value, 0),
    COALESCE(b.installments_count, 1),
    'CREDIT_CARD',
    TRUE
) s_anticipated
WHERE b.status IN ('DRAFT', 'SENT', 'APPROVED');

-- 5. COMENTÁRIOS
COMMENT ON FUNCTION simulate_installment_with_anticipation IS 
'Simula parcelamento com opção de antecipação, mostrando o impacto real no caixa em 24h';

COMMENT ON FUNCTION compare_payment_scenarios IS 
'Compara todos os cenários de parcelamento (1x a 12x) para tomada de decisão estratégica';

COMMENT ON VIEW v_budgets_cash_flow_analysis IS 
'Análise de fluxo de caixa de orçamentos com comparativo entre recebimento normal vs antecipado';

-- =====================================================
-- EXEMPLOS DE USO:
-- =====================================================

-- Exemplo 1: Simular R$ 50.000 (CEF) com R$ 10.000 entrada em 12x COM antecipação
-- SELECT * FROM simulate_installment_with_anticipation(50000, 10000, 12, 'CREDIT_CARD', TRUE);
-- Resultado esperado:
-- - Parcelas de R$ 3.333,33
-- - Taxa base: 4.69% (R$ 1.876)
-- - Taxa antecipação: 22% (R$ 8.800)
-- - Caixa em 24h: R$ 39.324 (vs R$ 48.124 ao longo de 12 meses)
-- - Perda: R$ 8.800 para ter liquidez imediata

-- Exemplo 2: Comparar todos os cenários para um orçamento de R$ 30.000
-- SELECT * FROM compare_payment_scenarios(30000, 5000);

-- Exemplo 3: Ver análise de todos os orçamentos pendentes
-- SELECT * FROM v_budgets_cash_flow_analysis WHERE status = 'SENT';

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
