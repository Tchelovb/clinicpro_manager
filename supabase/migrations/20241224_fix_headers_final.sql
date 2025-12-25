-- ============================================
-- FIX FINAL: Corrigir headers JSON nos triggers
-- ============================================

CREATE OR REPLACE FUNCTION notify_sniper_agent()
RETURNS TRIGGER AS $$
DECLARE
  is_proc_high_ticket BOOLEAN;
  priority_level TEXT;
  v_edge_url TEXT;
  v_service_key TEXT;
  v_request_id BIGINT;
BEGIN
  -- Buscar configurações
  v_edge_url := get_system_setting('edge_function_url');
  v_service_key := get_system_setting('service_role_key');
  
  IF v_edge_url IS NULL OR v_service_key IS NULL THEN
    RAISE WARNING '[SNIPER] Edge Function não configurada';
    RETURN NEW;
  END IF;

  -- Classificação High Ticket
  SELECT is_high_ticket INTO is_proc_high_ticket
  FROM procedure WHERE name = NEW.desired_treatment LIMIT 1;
  
  IF is_proc_high_ticket IS NULL THEN
    is_proc_high_ticket := NEW.desired_treatment ILIKE ANY (
      ARRAY['%Cervico%', '%Lip Lift%', '%Temporal%', '%Blefaro%', '%Implante%', '%Protocolo%', '%Alinhador%', '%Rinoplast%', '%Lipoescultura%', '%Mentoplast%', '%Lifting%']
    );
  END IF;

  -- Define Prioridade e Tags
  IF is_proc_high_ticket THEN
    priority_level := 'HIGH';
    NEW.lead_temperature := 'HOT';
    IF NOT (NEW.tags @> '["DIAMOND"]'::jsonb) THEN
      NEW.tags := COALESCE(NEW.tags, '[]'::jsonb) || '["DIAMOND", "HIGH_TICKET"]'::jsonb;
    END IF;
  ELSE
    priority_level := 'STANDARD';
    NEW.lead_temperature := 'WARM';
    IF NOT (NEW.tags @> '["STANDARD"]'::jsonb) THEN
      NEW.tags := COALESCE(NEW.tags, '[]'::jsonb) || '["STANDARD"]'::jsonb;
    END IF;
  END IF;

  -- DISPARO COM HEADERS CORRETOS (usando jsonb_build_object)
  SELECT net.http_post(
    url := v_edge_url || '/agent-orchestrator',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_service_key,
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
        'priority', priority_level,
        'origin', NEW.source,
        'is_high_ticket', is_proc_high_ticket
      )
    )
  ) INTO v_request_id;
  
  -- Log
  INSERT INTO agent_logs (
    clinic_id, agent_name, event_type, entity_type, entity_id,
    action_taken, status, metadata
  ) VALUES (
    NEW.clinic_id, 'sniper', 'new_lead', 'LEAD', NEW.id,
    'Trigger acionado - Captura Universal', 'PENDING',
    jsonb_build_object('priority', priority_level, 'procedure', NEW.desired_treatment, 'request_id', v_request_id)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================

CREATE OR REPLACE FUNCTION notify_guardian_agent()
RETURNS TRIGGER AS $$
DECLARE
  v_patient_name TEXT;
  v_patient_phone TEXT;
  v_days_overdue INTEGER;
  v_edge_url TEXT;
  v_service_key TEXT;
  v_request_id BIGINT;
BEGIN
  v_edge_url := get_system_setting('edge_function_url');
  v_service_key := get_system_setting('service_role_key');
  
  IF v_edge_url IS NULL OR v_service_key IS NULL THEN
    RAISE WARNING '[GUARDIAN] Edge Function não configurada';
    RETURN NEW;
  END IF;

  IF NEW.status = 'OVERDUE' AND (
    OLD.status != 'OVERDUE' OR 
    NEW.last_collection_attempt_at IS NULL OR
    NEW.last_collection_attempt_at < NOW() - INTERVAL '24 hours'
  ) THEN
    
    SELECT p.name, p.phone INTO v_patient_name, v_patient_phone
    FROM patients p WHERE p.id = NEW.patient_id;
    
    v_days_overdue := CURRENT_DATE - NEW.due_date;
    
    SELECT net.http_post(
      url := v_edge_url || '/agent-orchestrator',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || v_service_key,
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
      )
    ) INTO v_request_id;
    
    NEW.last_collection_attempt_at := NOW();
    NEW.collection_attempts_count := COALESCE(NEW.collection_attempts_count, 0) + 1;
    NEW.collection_agent_status := 'CONTACTED';
    
    INSERT INTO agent_logs (
      clinic_id, agent_name, event_type, entity_type, entity_id,
      action_taken, status, metadata
    ) VALUES (
      NEW.clinic_id, 'guardian', 'installment_overdue', 'INSTALLMENT', NEW.id,
      'Cobrança iniciada', 'PENDING',
      jsonb_build_object('amount', NEW.amount, 'days_overdue', v_days_overdue, 'request_id', v_request_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================

CREATE OR REPLACE FUNCTION notify_caretaker_agent()
RETURNS TRIGGER AS $$
DECLARE
  v_patient_name TEXT;
  v_patient_phone TEXT;
  v_procedure_name TEXT;
  v_recovery_days INTEGER;
  v_edge_url TEXT;
  v_service_key TEXT;
  v_request_id BIGINT;
BEGIN
  v_edge_url := get_system_setting('edge_function_url');
  v_service_key := get_system_setting('service_role_key');
  
  IF v_edge_url IS NULL OR v_service_key IS NULL THEN
    RAISE WARNING '[CARETAKER] Edge Function não configurada';
    RETURN NEW;
  END IF;

  IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
    
    SELECT p.name, p.phone INTO v_patient_name, v_patient_phone
    FROM patients p WHERE p.id = NEW.patient_id;
    
    SELECT pr.name, pr.recovery_days INTO v_procedure_name, v_recovery_days
    FROM procedure pr WHERE pr.name = NEW.procedure_name LIMIT 1;
    
    NEW.completion_date := NOW();
    NEW.post_op_followup_status := 'PENDING';
    
    SELECT net.http_post(
      url := v_edge_url || '/agent-orchestrator',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || v_service_key,
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
      )
    ) INTO v_request_id;
    
    INSERT INTO agent_logs (
      clinic_id, agent_name, event_type, entity_type, entity_id,
      action_taken, status, metadata
    ) VALUES (
      (SELECT clinic_id FROM patients WHERE id = NEW.patient_id),
      'caretaker', 'treatment_completed', 'TREATMENT', NEW.id,
      'Follow-up pós-op iniciado', 'PENDING',
      jsonb_build_object('procedure', NEW.procedure_name, 'recovery_days', v_recovery_days, 'request_id', v_request_id)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Triggers corrigidos com jsonb_build_object!';
  RAISE NOTICE '🧪 Teste agora inserindo um novo lead';
END $$;
