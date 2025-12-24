-- ============================================
-- MIGRATION 1: Squad BOS Triggers (Universal Capture)
-- Phase 1: Database Triggers para Agentes Autônomos
-- ============================================
-- Objetivo: Criar triggers que acionam os agentes:
-- 1. Sniper - CAPTURA UNIVERSAL (todos os leads)
-- 2. Guardian - Parcelas vencidas
-- 3. Caretaker - Procedimentos concluídos
-- ============================================

-- Habilitar extensão para chamadas HTTP
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================
-- 1. SNIPER AGENT: Captura Universal de Leads
-- ============================================
-- Filosofia BOS: NENHUM LEAD FICA PARA TRÁS
-- High-Ticket: Abordagem VIP + Alerta Dr. Marcelo
-- Standard: Abordagem padrão para agenda cheia

CREATE OR REPLACE FUNCTION notify_sniper_agent()
RETURNS TRIGGER AS $$
DECLARE
  is_proc_high_ticket BOOLEAN;
  priority_level TEXT;
BEGIN
  -- 1. Classificação: É High Ticket?
  SELECT is_high_ticket INTO is_proc_high_ticket
  FROM procedure 
  WHERE name = NEW.desired_treatment 
  LIMIT 1;
  
  -- Fallback: busca por texto se não encontrar no cadastro
  IF is_proc_high_ticket IS NULL THEN
      is_proc_high_ticket := NEW.desired_treatment ILIKE ANY (
        ARRAY[
          '%Cervico%', '%Lip Lift%', '%Temporal%', '%Blefaro%',
          '%Implante%', '%Protocolo%', '%Alinhador%', '%Rinoplast%',
          '%Lipoescultura%', '%Mentoplast%', '%Lifting%'
        ]
      );
  END IF;

  -- 2. Define Prioridade e Tags
  IF is_proc_high_ticket THEN
    priority_level := 'HIGH';
    NEW.lead_temperature := 'HOT'; -- Marca como quente
    
    -- Adiciona tags DIAMOND e HIGH_TICKET
    IF NOT (NEW.tags @> '["DIAMOND"]'::jsonb) THEN
      NEW.tags := COALESCE(NEW.tags, '[]'::jsonb) || '["DIAMOND", "HIGH_TICKET"]'::jsonb;
    END IF;
  ELSE
    priority_level := 'STANDARD';
    NEW.lead_temperature := 'WARM'; -- Marca como morno
    
    -- Adiciona tag STANDARD
    IF NOT (NEW.tags @> '["STANDARD"]'::jsonb) THEN
      NEW.tags := COALESCE(NEW.tags, '[]'::jsonb) || '["STANDARD"]'::jsonb;
    END IF;
  END IF;

  -- 3. DISPARO UNIVERSAL (SEM FILTRO IF)
  -- Agente é chamado para QUALQUER lead, mas com prioridade diferente
  PERFORM net.http_post(
    url := current_setting('app.edge_function_url', true) || '/agent-orchestrator',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'agent', 'sniper',
      'event', 'new_lead',
      'data', jsonb_build_object(
        'lead_id', NEW.id,
        'clinic_id', NEW.clinic_id,
        'procedure', NEW.desired_treatment,
        'phone', NEW.phone,
        'name', NEW.name,
        'email', NEW.email,
        'priority', priority_level, -- HIGH ou STANDARD
        'origin', NEW.source,
        'is_high_ticket', is_proc_high_ticket
      )
    )::text
  );
  
  -- Log de ativação
  INSERT INTO agent_logs (
    clinic_id,
    agent_name,
    event_type,
    entity_type,
    entity_id,
    action_taken,
    status,
    metadata
  ) VALUES (
    NEW.clinic_id,
    'sniper',
    'new_lead',
    'LEAD',
    NEW.id,
    'Trigger acionado - Captura Universal',
    'PENDING',
    jsonb_build_object(
      'priority', priority_level,
      'procedure', NEW.desired_treatment,
      'is_high_ticket', is_proc_high_ticket
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION notify_sniper_agent IS 'Captura Universal: aciona Sniper para TODOS os leads com priorização inteligente';

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_sniper_agent ON leads;
CREATE TRIGGER trigger_sniper_agent
  BEFORE INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION notify_sniper_agent();

-- ============================================
-- 2. GUARDIAN AGENT: Recuperação de Inadimplência
-- ============================================
-- Aciona quando parcela vence e não foi cobrada nas últimas 24h

CREATE OR REPLACE FUNCTION notify_guardian_agent()
RETURNS TRIGGER AS $$
DECLARE
  v_patient_name TEXT;
  v_patient_phone TEXT;
  v_days_overdue INTEGER;
BEGIN
  -- Só aciona se:
  -- 1. Status mudou para OVERDUE (vencida)
  -- 2. Não foi cobrada nas últimas 24h (evita spam)
  IF NEW.status = 'OVERDUE' AND (
    OLD.status != 'OVERDUE' OR 
    NEW.last_collection_attempt_at IS NULL OR
    NEW.last_collection_attempt_at < NOW() - INTERVAL '24 hours'
  ) THEN
    
    -- Buscar dados do paciente
    SELECT p.name, p.phone
    INTO v_patient_name, v_patient_phone
    FROM patients p
    WHERE p.id = NEW.patient_id;
    
    -- Calcular dias de atraso
    v_days_overdue := CURRENT_DATE - NEW.due_date;
    
    -- Acionar Guardian
    PERFORM net.http_post(
      url := current_setting('app.edge_function_url', true) || '/agent-orchestrator',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true),
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'agent', 'guardian',
        'event', 'installment_overdue',
        'data', jsonb_build_object(
          'installment_id', NEW.id,
          'clinic_id', NEW.clinic_id,
          'patient_id', NEW.patient_id,
          'patient_name', v_patient_name,
          'patient_phone', v_patient_phone,
          'amount', NEW.amount,
          'due_date', NEW.due_date,
          'days_overdue', v_days_overdue,
          'attempts_count', COALESCE(NEW.collection_attempts_count, 0)
        )
      )::text
    );
    
    -- Atualizar contadores
    NEW.last_collection_attempt_at := NOW();
    NEW.collection_attempts_count := COALESCE(NEW.collection_attempts_count, 0) + 1;
    NEW.collection_agent_status := 'CONTACTED';
    
    -- Log
    INSERT INTO agent_logs (
      clinic_id,
      agent_name,
      event_type,
      entity_type,
      entity_id,
      action_taken,
      status,
      metadata
    ) VALUES (
      NEW.clinic_id,
      'guardian',
      'installment_overdue',
      'INSTALLMENT',
      NEW.id,
      'Cobrança iniciada',
      'PENDING',
      jsonb_build_object(
        'amount', NEW.amount,
        'days_overdue', v_days_overdue,
        'attempt', NEW.collection_attempts_count
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION notify_guardian_agent IS 'Aciona Guardian para recuperar inadimplência com controle de frequência';

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_guardian_agent ON financial_installments;
CREATE TRIGGER trigger_guardian_agent
  BEFORE UPDATE ON financial_installments
  FOR EACH ROW
  EXECUTE FUNCTION notify_guardian_agent();

-- ============================================
-- 3. CARETAKER AGENT: Follow-up Pós-Operatório
-- ============================================
-- Aciona quando procedimento é marcado como concluído

CREATE OR REPLACE FUNCTION notify_caretaker_agent()
RETURNS TRIGGER AS $$
DECLARE
  v_patient_name TEXT;
  v_patient_phone TEXT;
  v_procedure_name TEXT;
  v_recovery_days INTEGER;
BEGIN
  -- Só aciona se procedimento foi concluído agora
  IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
    
    -- Buscar dados do paciente
    SELECT p.name, p.phone
    INTO v_patient_name, v_patient_phone
    FROM patients p
    WHERE p.id = NEW.patient_id;
    
    -- Buscar dados do procedimento
    SELECT pr.name, pr.recovery_days
    INTO v_procedure_name, v_recovery_days
    FROM procedure pr
    WHERE pr.name = NEW.procedure_name
    LIMIT 1;
    
    -- Definir data de conclusão
    NEW.completion_date := NOW();
    NEW.post_op_followup_status := 'PENDING';
    
    -- Acionar Caretaker
    PERFORM net.http_post(
      url := current_setting('app.edge_function_url', true) || '/agent-orchestrator',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true),
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'agent', 'caretaker',
        'event', 'treatment_completed',
        'data', jsonb_build_object(
          'treatment_id', NEW.id,
          'clinic_id', (SELECT clinic_id FROM patients WHERE id = NEW.patient_id),
          'patient_id', NEW.patient_id,
          'patient_name', v_patient_name,
          'patient_phone', v_patient_phone,
          'procedure', COALESCE(v_procedure_name, NEW.procedure_name),
          'completion_date', NEW.completion_date,
          'recovery_days', COALESCE(v_recovery_days, 7),
          'category', NEW.category
        )
      )::text
    );
    
    -- Log
    INSERT INTO agent_logs (
      clinic_id,
      agent_name,
      event_type,
      entity_type,
      entity_id,
      action_taken,
      status,
      metadata
    ) VALUES (
      (SELECT clinic_id FROM patients WHERE id = NEW.patient_id),
      'caretaker',
      'treatment_completed',
      'TREATMENT',
      NEW.id,
      'Follow-up pós-op iniciado',
      'PENDING',
      jsonb_build_object(
        'procedure', NEW.procedure_name,
        'recovery_days', v_recovery_days
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION notify_caretaker_agent IS 'Aciona Caretaker para follow-up pós-operatório e fidelização';

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_caretaker_agent ON treatment_items;
CREATE TRIGGER trigger_caretaker_agent
  BEFORE UPDATE ON treatment_items
  FOR EACH ROW
  EXECUTE FUNCTION notify_caretaker_agent();

-- ============================================
-- 4. CONFIGURAR VARIÁVEIS DE AMBIENTE
-- ============================================
-- Estas configurações precisam ser definidas manualmente no Supabase

-- Para configurar, execute no SQL Editor:
-- ALTER DATABASE postgres SET app.edge_function_url = 'https://[seu-project-id].supabase.co/functions/v1';
-- ALTER DATABASE postgres SET app.service_role_key = '[sua-service-role-key]';

-- Verificar se estão configuradas:
DO $$
BEGIN
  IF current_setting('app.edge_function_url', true) IS NULL THEN
    RAISE WARNING 'ATENÇÃO: Configure app.edge_function_url com: ALTER DATABASE postgres SET app.edge_function_url = ''https://[project-id].supabase.co/functions/v1'';';
  END IF;
  
  IF current_setting('app.service_role_key', true) IS NULL THEN
    RAISE WARNING 'ATENÇÃO: Configure app.service_role_key com: ALTER DATABASE postgres SET app.service_role_key = ''[service-role-key]'';';
  END IF;
END $$;

-- ============================================
-- FIM DA MIGRATION 1
-- ============================================

-- Verificação de integridade
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 1 concluída com sucesso!';
  RAISE NOTICE '🎯 Sniper: Captura Universal ativada (TODOS os leads)';
  RAISE NOTICE '🛡️ Guardian: Recuperação de inadimplência ativada';
  RAISE NOTICE '💚 Caretaker: Follow-up pós-op ativado';
  RAISE NOTICE '⚠️ IMPORTANTE: Configure as variáveis de ambiente (edge_function_url e service_role_key)';
  RAISE NOTICE '🚀 Squad BOS pronto para ação!';
END $$;
