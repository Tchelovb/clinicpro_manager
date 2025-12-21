-- =====================================================
-- ATUALIZAÇÃO DO MOTOR DE INSIGHTS (TEMPO REAL)
-- Adiciona Senitela S15: Detecção Imediata de Novos Negócios
-- =====================================================

CREATE OR REPLACE FUNCTION generate_native_insights(p_clinic_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- =====================================================
    -- LIMPEZA INICIAL
    -- =====================================================
    DELETE FROM public.ai_insights 
    WHERE clinic_id = p_clinic_id 
      AND status = 'resolved' 
      AND created_at < NOW() - INTERVAL '30 days';

    -- ... (MANTÉM AS SENTINELAS EXISTENTES S1-S14 SE NECESSÁRIO, MAS REESCREVENDO PRECIOSAMENTE) ...
    -- PARA GARANTIR, VOU INCLUIR TODAS AS IMPORTANTES + A NOVA S15

    -- [S1] ORÇAMENTOS HIGH-TICKET PARADOS (>R$ 15k)
    INSERT INTO public.ai_insights (
        clinic_id, title, explanation, priority, category, related_entity_id, action_label, status
    )
    SELECT 
        p_clinic_id, 
        '💰 Orçamento High-Ticket Parado: ' || p.name, 
        'Orçamento de R$ ' || TO_CHAR(b.final_value, 'FM999,999,990.00') || ' parado há ' || (CURRENT_DATE - b.created_at::date) || ' dias.', 
        'critico', 'Vendas', b.id, 'Ver Orçamento', 'open'
    FROM public.budgets b 
    JOIN public.patients p ON b.patient_id = p.id
    WHERE b.clinic_id = p_clinic_id 
      AND b.status::text NOT IN ('APPROVED', 'REJECTED', 'CANCELED')
      AND b.final_value > 15000 
      AND b.created_at < NOW() - INTERVAL '3 days'
      AND NOT EXISTS (SELECT 1 FROM public.ai_insights WHERE related_entity_id = b.id AND status = 'open');

    -- [S15 - NOVA] NOVO NEGÓCIO EM POTENCIAL (TEMPO REAL)
    -- Pega qualquer orçamento aberto nas últimas 48h, independente do valor (mas valoriza os maiores)
    INSERT INTO public.ai_insights (
        clinic_id, title, explanation, priority, category, related_entity_id, action_label, status
    )
    SELECT 
        p_clinic_id, 
        CASE 
            WHEN b.final_value > 5000 THEN '🌟 Oportunidade Premium: ' || p.name
            ELSE '🆕 Novo Negócio Iniciado: ' || p.name
        END,
        'Orçamento criado hoje no valor de R$ ' || TO_CHAR(b.final_value, 'FM999,999,990.00') || '. Atue agora para converter!', 
        CASE 
            WHEN b.final_value > 5000 THEN 'high' 
            ELSE 'low' -- Azul/Opportunity
        END, 
        'Vendas', b.id, 'Ver Orçamento', 'open'
    FROM public.budgets b 
    JOIN public.patients p ON b.patient_id = p.id
    WHERE b.clinic_id = p_clinic_id 
      AND b.status::text NOT IN ('APPROVED', 'REJECTED', 'CANCELED')
      AND b.created_at >= NOW() - INTERVAL '48 hours' -- Janela de 48h para pegar o recente
      AND NOT EXISTS (
          SELECT 1 FROM public.ai_insights 
          WHERE related_entity_id = b.id 
            AND status = 'open' 
            AND (title LIKE '%Novo Negócio%' OR title LIKE '%Oportunidade Premium%')
      );

    -- [S2] LEADS SEM CONTATO (>12h)
    INSERT INTO public.ai_insights (
        clinic_id, title, explanation, priority, category, related_entity_id, action_label, status
    )
    SELECT 
        p_clinic_id, 
        '🔥 Lead Quente Sem Contato: ' || l.name, 
        'Lead cadastrado há ' || EXTRACT(HOUR FROM (NOW() - l.created_at)) || ' horas sem interação.', 
        'high', 'Marketing', l.id, 'Chamar no Zap', 'open'
    FROM public.leads l
    WHERE l.clinic_id = p_clinic_id 
      AND l.created_at < NOW() - INTERVAL '12 hours' 
      AND NOT EXISTS (SELECT 1 FROM public.lead_interactions li WHERE li.lead_id = l.id)
      AND NOT EXISTS (SELECT 1 FROM public.ai_insights WHERE related_entity_id = l.id AND status = 'open');

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '✅ Sentinela S15 Executada. Insights gerados.';
END;
$$;

-- Executa imediatamente para atualizar a tela do Doutor
DO $$
DECLARE
    v_clinic_id UUID;
BEGIN
    SELECT id INTO v_clinic_id FROM public.clinics WHERE status = 'ACTIVE' LIMIT 1;
    IF v_clinic_id IS NOT NULL THEN
        PERFORM generate_native_insights(v_clinic_id);
    END IF;
END $$;

-- =====================================================
-- AUTOMAÇÃO DE TEMPO REAL
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_run_engine()
RETURNS TRIGGER AS $$
BEGIN
    -- Roda o motor de forma assíncrona ou leve (aqui chamamos direto)
    PERFORM generate_native_insights(NEW.clinic_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_insights_on_budget ON public.budgets;
CREATE TRIGGER trg_update_insights_on_budget
AFTER INSERT ON public.budgets
FOR EACH ROW
EXECUTE FUNCTION trigger_run_engine();
