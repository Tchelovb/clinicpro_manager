-- ============================================================================
-- CLINICHEALTH SETUP SCRIPT
-- Execute este script no Supabase SQL Editor para ativar o ClinicHealth
-- ============================================================================

-- PASSO 1: Criar Índices para Performance
-- ============================================================================

-- Índice para contagem de leads (Pilar Atração)
CREATE INDEX IF NOT EXISTS idx_patients_clinic_created 
ON patients(clinic_id, created_at DESC);

-- Índice para taxa de conversão (Pilar Conversão)
CREATE INDEX IF NOT EXISTS idx_budgets_clinic_status_created 
ON budgets(clinic_id, status, created_at DESC);

-- Índice para cálculo de margem (Pilar Lucro)
CREATE INDEX IF NOT EXISTS idx_budgets_clinic_approved_value 
ON budgets(clinic_id, status, final_value) 
WHERE status = 'APPROVED' AND final_value > 0;

-- PASSO 2: Criar Função RPC para Cálculo dos Pilares
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_pillar_scores(p_clinic_id UUID)
RETURNS JSON AS $$
DECLARE
    v_result JSON;
BEGIN
    -- Optimized with CTEs for parallel execution
    WITH 
    -- 1. ATRAÇÃO: Lead volume in last 30 days
    leads_data AS (
        SELECT COUNT(*) as total_leads
        FROM patients 
        WHERE clinic_id = p_clinic_id 
        AND created_at > (NOW() - INTERVAL '30 days')
    ),
    
    -- 2. CONVERSÃO: Budget approval rate
    budget_data AS (
        SELECT 
            COUNT(*) as total_budgets,
            COUNT(*) FILTER (WHERE status = 'APPROVED') as approved_budgets
        FROM budgets
        WHERE clinic_id = p_clinic_id
        AND created_at > (NOW() - INTERVAL '30 days')
    ),
    
    -- 4. LUCRO: Average profit margin
    profit_data AS (
        SELECT COALESCE(AVG(
            CASE 
                WHEN final_value > 0 THEN (potential_margin / final_value) * 100
                ELSE 0
            END
        ), 0) as avg_margin
        FROM budgets
        WHERE clinic_id = p_clinic_id
        AND status = 'APPROVED'
        AND created_at > (NOW() - INTERVAL '30 days')
        AND potential_margin IS NOT NULL
        AND final_value > 0
    ),
    
    -- Calculate all scores in one go
    scores AS (
        SELECT
            -- 1. ATRAÇÃO (0-100 based on lead volume, target: 100 leads/month)
            LEAST((COALESCE(l.total_leads, 0)::NUMERIC / 100.0) * 100, 100) as atracao,
            
            -- 2. CONVERSÃO (0-100 based on approval rate)
            CASE 
                WHEN b.total_budgets > 0 
                THEN (b.approved_budgets::NUMERIC / b.total_budgets::NUMERIC) * 100
                ELSE 0
            END as conversao,
            
            -- 3. PRODUÇÃO (placeholder: 80% capacity utilization)
            80 as producao,
            
            -- 4. LUCRO (average margin percentage)
            ROUND(p.avg_margin, 2) as lucro,
            
            -- 5-10. Placeholders for future implementation
            30 as inovacao,
            70 as retencao,
            90 as encantamento,
            85 as gente,
            75 as processos,
            100 as compliance
            
        FROM leads_data l
        CROSS JOIN budget_data b
        CROSS JOIN profit_data p
    )
    
    -- Build JSON response
    SELECT json_build_object(
        'atracao', ROUND(atracao, 2),
        'conversao', ROUND(conversao, 2),
        'producao', ROUND(producao, 2),
        'lucro', lucro,
        'inovacao', ROUND(inovacao, 2),
        'retencao', ROUND(retencao, 2),
        'encantamento', ROUND(encantamento, 2),
        'gente', ROUND(gente, 2),
        'processos', ROUND(processos, 2),
        'compliance', ROUND(compliance, 2)
    ) INTO v_result
    FROM scores;

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    -- Fallback with error info
    RETURN json_build_object(
        'error', SQLERRM,
        'atracao', 0, 'conversao', 0, 'producao', 0, 'lucro', 0, 
        'inovacao', 0, 'retencao', 0, 'encantamento', 0, 'gente', 0, 
        'processos', 0, 'compliance', 0
    );
END;
$$ LANGUAGE plpgsql;

-- PASSO 3: Testar a Função
-- ============================================================================
-- Descomente a linha abaixo e substitua 'SEU-CLINIC-ID' pelo ID real da clínica
-- SELECT calculate_pillar_scores('SEU-CLINIC-ID');

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
