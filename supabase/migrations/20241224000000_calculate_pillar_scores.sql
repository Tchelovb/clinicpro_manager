-- 10x50 Engine Score Calculation RPC
-- Function: calculate_pillar_scores
-- Description: Calculates scores (0-100) for the 10 management pillars of the 10x50 Method.
-- Parameters: p_clinic_id (UUID)
-- Returns: JSON object with keys matching the 10 pillars.

CREATE OR REPLACE FUNCTION calculate_pillar_scores(p_clinic_id UUID)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
    
    -- Variables for scores
    v_atracao NUMERIC := 0;
    v_conversao NUMERIC := 0;
    v_producao NUMERIC := 0;
    v_lucro NUMERIC := 0;
    v_inovacao NUMERIC := 0;
    v_retencao NUMERIC := 0;
    v_encantamento NUMERIC := 0;
    v_gente NUMERIC := 0;
    v_processos NUMERIC := 0;
    v_compliance NUMERIC := 0;
    
    -- Variables for intermediate calculations
    v_total_leads INT;
    v_total_budgets INT;
    v_approved_budgets INT;
BEGIN
    ---------------------------------------------------------------------------
    -- 1. ATRAÇÃO (Marketing)
    -- Metrica: Volume de Leads vs Meta (Ex: 100)
    ---------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_total_leads FROM "patients" 
    WHERE clinic_id = p_clinic_id 
    AND created_at > (NOW() - INTERVAL '30 days');
    
    v_atracao := LEAST((COALESCE(v_total_leads, 0)::NUMERIC / 100.0) * 100, 100);

    ---------------------------------------------------------------------------
    -- 2. CONVERSÃO (Vendas)
    -- Metrica: Taxa de Aprovação de Orçamentos
    ---------------------------------------------------------------------------
    SELECT COUNT(*) INTO v_total_budgets FROM "budgets"
    WHERE clinic_id = p_clinic_id
    AND created_at > (NOW() - INTERVAL '30 days');
    
    SELECT COUNT(*) INTO v_approved_budgets FROM "budgets"
    WHERE clinic_id = p_clinic_id
    AND status = 'APPROVED'
    AND created_at > (NOW() - INTERVAL '30 days');
    
    IF v_total_budgets > 0 THEN
        v_conversao := (v_approved_budgets::NUMERIC / v_total_budgets::NUMERIC) * 100;
    ELSE
        v_conversao := 0;
    END IF;

    ---------------------------------------------------------------------------
    -- 3. PRODUÇÃO (Capacidade)
    -- Placeholder: Simulação de ocupação de agenda (80%)
    ---------------------------------------------------------------------------
    v_producao := 80; 

    ---------------------------------------------------------------------------
    -- 4. LUCRO (Financeiro)
    -- Metrica: Margem média dos orçamentos aprovados (usando potential_margin)
    ---------------------------------------------------------------------------
    SELECT COALESCE(AVG(
        CASE 
            WHEN final_value > 0 THEN (potential_margin / final_value) * 100
            ELSE 0
        END
    ), 0) INTO v_lucro
    FROM "budgets"
    WHERE clinic_id = p_clinic_id
    AND status = 'APPROVED'
    AND created_at > (NOW() - INTERVAL '30 days')
    AND potential_margin IS NOT NULL
    AND final_value > 0;

    ---------------------------------------------------------------------------
    -- 5. INOVAÇÃO
    ---------------------------------------------------------------------------
    v_inovacao := 30; -- Placeholder

    ---------------------------------------------------------------------------
    -- 6. RETENÇÃO
    ---------------------------------------------------------------------------
    v_retencao := 70; -- Placeholder

    ---------------------------------------------------------------------------
    -- 7. ENCANTAMENTO (NPS)
    ---------------------------------------------------------------------------
    v_encantamento := 90; -- Placeholder

    ---------------------------------------------------------------------------
    -- 8. GENTE (Equipe)
    ---------------------------------------------------------------------------
    v_gente := 85; -- Placeholder

    ---------------------------------------------------------------------------
    -- 9. PROCESSOS
    ---------------------------------------------------------------------------
    v_processos := 75; -- Placeholder

    ---------------------------------------------------------------------------
    -- 10. COMPLIANCE (Legal)
    ---------------------------------------------------------------------------
    v_compliance := 100; -- Placeholder

    -- Build JSON Response
    v_result := json_build_object(
        'atracao', ROUND(v_atracao, 2),
        'conversao', ROUND(v_conversao, 2),
        'producao', ROUND(v_producao, 2),
        'lucro', ROUND(v_lucro, 2),
        'inovacao', ROUND(v_inovacao, 2),
        'retencao', ROUND(v_retencao, 2),
        'encantamento', ROUND(v_encantamento, 2),
        'gente', ROUND(v_gente, 2),
        'processos', ROUND(v_processos, 2),
        'compliance', ROUND(v_compliance, 2)
    );

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    -- Fallback em caso de erro
    RETURN json_build_object(
        'error', SQLERRM,
        'atracao', 0, 'conversao', 0, 'producao', 0, 'lucro', 0, 
        'inovacao', 0, 'retencao', 0, 'encantamento', 0, 'gente', 0, 
        'processos', 0, 'compliance', 0
    );
END;
$$ LANGUAGE plpgsql;
