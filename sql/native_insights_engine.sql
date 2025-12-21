-- =====================================================
-- INTELLIGENCE CENTER 7.0 - NATIVE INSIGHTS ENGINE
-- Motor de Inteligência Nativa (Zero API Cost)
-- =====================================================

-- =====================================================
-- FUNÇÃO PRINCIPAL: GERAR INSIGHTS NATIVOS
-- =====================================================

CREATE OR REPLACE FUNCTION generate_native_insights(p_clinic_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Limpar insights antigos resolvidos (mais de 30 dias)
    DELETE FROM public.ai_insights
    WHERE clinic_id = p_clinic_id
      AND status = 'RESOLVED'
      AND created_at < NOW() - INTERVAL '30 days';

    -- =====================================================
    -- SENTINELA 1: VENDAS HIGH-TICKET PARADAS
    -- =====================================================
    INSERT INTO public.ai_insights (
        clinic_id,
        title,
        description,
        priority,
        category,
        entity_type,
        related_entity_id,
        recommended_action,
        status
    )
    SELECT
        p_clinic_id,
        '💰 Orçamento High-Ticket Parado: ' || p.name,
        'Orçamento de R$ ' || TO_CHAR(b.final_value, 'FM999,999,999.00') || 
        ' está em negociação há ' || EXTRACT(DAY FROM NOW() - b.created_at) || ' dias sem movimentação.',
        'CRITICAL',
        'SALES',
        'BUDGET',
        b.id,
        'Entre em contato imediato com o paciente para entender objeções e fechar a venda. Considere oferecer condições especiais de pagamento.',
        'OPEN'
    FROM public.budgets b
    JOIN public.patients p ON b.patient_id = p.id
    WHERE b.clinic_id = p_clinic_id
      AND b.status IN ('DRAFT', 'PENDING')
      AND b.final_value > 15000  -- High-ticket acima de R$ 15k
      AND b.created_at < NOW() - INTERVAL '3 days'
      AND NOT EXISTS (
          SELECT 1 FROM public.ai_insights ai
          WHERE ai.related_entity_id = b.id
            AND ai.status = 'OPEN'
            AND ai.category = 'SALES'
      );

    -- =====================================================
    -- SENTINELA 2: LEADS SEM CONTATO INICIAL
    -- =====================================================
    INSERT INTO public.ai_insights (
        clinic_id,
        title,
        description,
        priority,
        category,
        entity_type,
        related_entity_id,
        recommended_action,
        status
    )
    SELECT
        p_clinic_id,
        '🔥 Lead Quente Sem Contato: ' || l.name,
        'Lead cadastrado há ' || EXTRACT(HOUR FROM NOW() - l.created_at) || ' horas sem nenhuma interação registrada. ' ||
        CASE 
            WHEN l.priority = 'HIGH' THEN 'PRIORIDADE ALTA - '
            ELSE ''
        END ||
        'Fonte: ' || COALESCE(l.source, 'Não informada'),
        CASE 
            WHEN l.priority = 'HIGH' THEN 'CRITICAL'
            WHEN EXTRACT(HOUR FROM NOW() - l.created_at) > 24 THEN 'HIGH'
            ELSE 'MEDIUM'
        END,
        'MARKETING',
        'LEAD',
        l.id,
        'Realizar contato imediato via WhatsApp ou telefone. Leads não contatados em 12h têm 80% menos chance de conversão.',
        'OPEN'
    FROM public.leads l
    WHERE l.clinic_id = p_clinic_id
      AND l.created_at < NOW() - INTERVAL '12 hours'
      AND NOT EXISTS (
          SELECT 1 FROM public.lead_interactions li
          WHERE li.lead_id = l.id
      )
      AND NOT EXISTS (
          SELECT 1 FROM public.ai_insights ai
          WHERE ai.related_entity_id = l.id
            AND ai.status = 'OPEN'
            AND ai.category = 'MARKETING'
      );

    -- =====================================================
    -- SENTINELA 3: CIRURGIA CONCLUÍDA SEM PAGAMENTO TOTAL
    -- =====================================================
    INSERT INTO public.ai_insights (
        clinic_id,
        title,
        description,
        priority,
        category,
        entity_type,
        related_entity_id,
        recommended_action,
        status
    )
    SELECT
        p_clinic_id,
        '⚠️ Inadimplência Pós-Cirúrgica: ' || p.name,
        'Procedimento "' || ti.procedure_name || '" concluído há ' || 
        EXTRACT(DAY FROM NOW() - ti.updated_at) || ' dias com saldo devedor de R$ ' || 
        TO_CHAR(p.balance_due, 'FM999,999,999.00') || '.',
        CASE 
            WHEN p.balance_due > 10000 THEN 'CRITICAL'
            WHEN p.balance_due > 5000 THEN 'HIGH'
            ELSE 'MEDIUM'
        END,
        'FINANCIAL',
        'PATIENT',
        p.id,
        'Acionar cobrança imediata. Procedimento já foi realizado e o pagamento está em atraso. Considere acordo de parcelamento.',
        'OPEN'
    FROM public.treatment_items ti
    JOIN public.treatments t ON ti.treatment_id = t.id
    JOIN public.patients p ON t.patient_id = p.id
    WHERE p.clinic_id = p_clinic_id
      AND ti.status = 'CONCLUDED'
      AND p.balance_due > 0
      AND ti.updated_at < NOW() - INTERVAL '7 days'
      AND NOT EXISTS (
          SELECT 1 FROM public.ai_insights ai
          WHERE ai.related_entity_id = p.id
            AND ai.status = 'OPEN'
            AND ai.category = 'FINANCIAL'
            AND ai.title LIKE '%Inadimplência%'
      );

    -- =====================================================
    -- SENTINELA 4: PACIENTES VIP SEM RETORNO (FIDELIZAÇÃO)
    -- =====================================================
    INSERT INTO public.ai_insights (
        clinic_id,
        title,
        description,
        priority,
        category,
        entity_type,
        related_entity_id,
        recommended_action,
        status
    )
    SELECT
        p_clinic_id,
        '👑 Paciente VIP Inativo: ' || p.name,
        'Cliente com LTV de R$ ' || TO_CHAR(p.total_paid, 'FM999,999,999.00') || 
        ' não retorna há ' || EXTRACT(MONTH FROM NOW() - last_appt.last_date) || ' meses. ' ||
        'Risco de perda de fidelização.',
        'HIGH',
        'RETENTION',
        'PATIENT',
        p.id,
        'Enviar campanha de reativação personalizada. Oferecer avaliação gratuita ou desconto em manutenção. Pacientes VIP são 5x mais valiosos que novos leads.',
        'OPEN'
    FROM public.patients p
    CROSS JOIN LATERAL (
        SELECT MAX(a.date) as last_date
        FROM public.appointments a
        WHERE a.patient_id = p.id
          AND a.status = 'COMPLETED'
    ) last_appt
    WHERE p.clinic_id = p_clinic_id
      AND p.total_paid > 10000  -- VIP: gastou mais de R$ 10k
      AND last_appt.last_date < NOW() - INTERVAL '6 months'
      AND NOT EXISTS (
          SELECT 1 FROM public.ai_insights ai
          WHERE ai.related_entity_id = p.id
            AND ai.status = 'OPEN'
            AND ai.category = 'RETENTION'
      );

    -- =====================================================
    -- SENTINELA 5: NO-SHOW RECORRENTE
    -- =====================================================
    INSERT INTO public.ai_insights (
        clinic_id,
        title,
        description,
        priority,
        category,
        entity_type,
        related_entity_id,
        recommended_action,
        status
    )
    SELECT
        p_clinic_id,
        '🚫 Paciente com No-Show Recorrente: ' || p.name,
        'Paciente faltou ' || missed_count.total || ' vezes nos últimos 3 meses sem avisar. ' ||
        'Impacto operacional: ' || (missed_count.total * 60) || ' minutos de agenda perdidos.',
        'MEDIUM',
        'OPERATIONAL',
        'PATIENT',
        p.id,
        'Implementar política de confirmação obrigatória 24h antes. Considerar cobrança de taxa de reserva para próximos agendamentos.',
        'OPEN'
    FROM public.patients p
    CROSS JOIN LATERAL (
        SELECT COUNT(*) as total
        FROM public.appointments a
        WHERE a.patient_id = p.id
          AND a.status = 'MISSED'
          AND a.date > NOW() - INTERVAL '3 months'
    ) missed_count
    WHERE p.clinic_id = p_clinic_id
      AND missed_count.total >= 3
      AND NOT EXISTS (
          SELECT 1 FROM public.ai_insights ai
          WHERE ai.related_entity_id = p.id
            AND ai.status = 'OPEN'
            AND ai.category = 'OPERATIONAL'
            AND ai.title LIKE '%No-Show%'
      );

    -- =====================================================
    -- SENTINELA 6: ORÇAMENTO APROVADO SEM AGENDAMENTO
    -- =====================================================
    INSERT INTO public.ai_insights (
        clinic_id,
        title,
        description,
        priority,
        category,
        entity_type,
        related_entity_id,
        recommended_action,
        status
    )
    SELECT
        p_clinic_id,
        '📅 Orçamento Aprovado Sem Agendamento: ' || p.name,
        'Orçamento de R$ ' || TO_CHAR(b.final_value, 'FM999,999,999.00') || 
        ' foi aprovado há ' || EXTRACT(DAY FROM NOW() - b.updated_at) || ' dias mas o procedimento ainda não foi agendado.',
        CASE 
            WHEN b.final_value > 20000 THEN 'CRITICAL'
            WHEN b.final_value > 10000 THEN 'HIGH'
            ELSE 'MEDIUM'
        END,
        'CLINICAL',
        'BUDGET',
        b.id,
        'Entrar em contato para agendar o procedimento. Orçamentos aprovados não agendados em 7 dias têm 40% de chance de cancelamento.',
        'OPEN'
    FROM public.budgets b
    JOIN public.patients p ON b.patient_id = p.id
    WHERE b.clinic_id = p_clinic_id
      AND b.status = 'APPROVED'
      AND b.updated_at < NOW() - INTERVAL '7 days'
      AND NOT EXISTS (
          SELECT 1 FROM public.treatments t
          WHERE t.budget_id = b.id
      )
      AND NOT EXISTS (
          SELECT 1 FROM public.ai_insights ai
          WHERE ai.related_entity_id = b.id
            AND ai.status = 'OPEN'
            AND ai.category = 'CLINICAL'
      );

    -- =====================================================
    -- SENTINELA 7: PIPELINE ESTAGNADO (CONVERSÃO BAIXA)
    -- =====================================================
    -- Verifica se a taxa de conversão está abaixo de 20% nos últimos 30 dias
    WITH conversion_stats AS (
        SELECT
            COUNT(*) FILTER (WHERE status = 'APPROVED') as approved,
            COUNT(*) as total,
            ROUND((COUNT(*) FILTER (WHERE status = 'APPROVED')::numeric / NULLIF(COUNT(*), 0)) * 100, 2) as rate
        FROM public.budgets
        WHERE clinic_id = p_clinic_id
          AND created_at > NOW() - INTERVAL '30 days'
    )
    INSERT INTO public.ai_insights (
        clinic_id,
        title,
        description,
        priority,
        category,
        entity_type,
        related_entity_id,
        recommended_action,
        status
    )
    SELECT
        p_clinic_id,
        '📉 Taxa de Conversão Crítica',
        'A taxa de conversão dos últimos 30 dias está em ' || cs.rate || '% (Meta: 30%). ' ||
        'De ' || cs.total || ' orçamentos, apenas ' || cs.approved || ' foram aprovados.',
        'HIGH',
        'SALES',
        'BUDGET',
        NULL,
        'Revisar processo de vendas. Treinar equipe em técnicas de fechamento. Analisar principais objeções dos clientes.',
        'OPEN'
    FROM conversion_stats cs
    WHERE cs.rate < 20
      AND cs.total > 10  -- Só alerta se houver volume mínimo
      AND NOT EXISTS (
          SELECT 1 FROM public.ai_insights ai
          WHERE ai.clinic_id = p_clinic_id
            AND ai.status = 'OPEN'
            AND ai.title LIKE '%Taxa de Conversão%'
            AND ai.created_at > NOW() - INTERVAL '7 days'
      );

    -- Log de execução
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Native Insights Engine: % novos insights gerados para clinic_id %', v_count, p_clinic_id;

END;
$$;

-- =====================================================
-- TRIGGER: EXECUTAR MOTOR DE INSIGHTS AUTOMATICAMENTE
-- =====================================================

-- Função trigger para executar após inserções/atualizações relevantes
CREATE OR REPLACE FUNCTION trigger_native_insights()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Executar motor de insights de forma assíncrona
    PERFORM generate_native_insights(NEW.clinic_id);
    RETURN NEW;
END;
$$;

-- Triggers em tabelas relevantes
DROP TRIGGER IF EXISTS trigger_insights_on_budget ON public.budgets;
CREATE TRIGGER trigger_insights_on_budget
    AFTER INSERT OR UPDATE ON public.budgets
    FOR EACH ROW
    WHEN (NEW.status IN ('DRAFT', 'PENDING', 'APPROVED'))
    EXECUTE FUNCTION trigger_native_insights();

DROP TRIGGER IF EXISTS trigger_insights_on_lead ON public.leads;
CREATE TRIGGER trigger_insights_on_lead
    AFTER INSERT ON public.leads
    FOR EACH ROW
    EXECUTE FUNCTION trigger_native_insights();

DROP TRIGGER IF EXISTS trigger_insights_on_treatment ON public.treatment_items;
CREATE TRIGGER trigger_insights_on_treatment
    AFTER UPDATE ON public.treatment_items
    FOR EACH ROW
    WHEN (NEW.status = 'CONCLUDED')
    EXECUTE FUNCTION trigger_native_insights();

-- =====================================================
-- FUNÇÃO: EXECUTAR MOTOR MANUALMENTE (CRON JOB)
-- =====================================================

CREATE OR REPLACE FUNCTION run_insights_engine_for_all_clinics()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    clinic_record RECORD;
BEGIN
    FOR clinic_record IN SELECT id FROM public.clinics WHERE status = 'ACTIVE'
    LOOP
        PERFORM generate_native_insights(clinic_record.id);
    END LOOP;
    
    RAISE NOTICE 'Native Insights Engine executed for all active clinics';
END;
$$;

-- =====================================================
-- NÍVEIS DE ALERTA (PRIORIDADES)
-- =====================================================

COMMENT ON COLUMN public.ai_insights.priority IS 
'Níveis de Alerta:
- CRITICAL (Vermelho): Impacto financeiro imediato > R$ 10k ou perda de cliente VIP
- HIGH (Laranja): Impacto financeiro > R$ 5k ou risco de perda de conversão
- MEDIUM (Amarelo): Oportunidade de melhoria operacional ou fidelização
- LOW (Verde): Informativo, sem urgência';

-- =====================================================
-- GRANTS
-- =====================================================

GRANT EXECUTE ON FUNCTION generate_native_insights(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION run_insights_engine_for_all_clinics() TO authenticated;

-- =====================================================
-- EXEMPLO DE USO
-- =====================================================

-- Executar manualmente para uma clínica específica:
-- SELECT generate_native_insights('clinic-uuid-here');

-- Executar para todas as clínicas (usar em CRON):
-- SELECT run_insights_engine_for_all_clinics();
