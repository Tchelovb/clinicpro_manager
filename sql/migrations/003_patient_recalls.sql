-- =====================================================
-- MIGRATION 003: RECALLS ESTRUTURADOS (RETENÇÃO)
-- Prioridade: P0 - Crítico
-- Impacto: +R$ 22.500/mês (reativação de pacientes)
-- Data: 21/12/2025
-- =====================================================

-- Tabela de Recalls de Pacientes
CREATE TABLE IF NOT EXISTS public.patient_recalls (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  
  -- Tipo de Recall
  recall_type text NOT NULL CHECK (recall_type IN (
    'PROPHYLAXIS',           -- Limpeza/Profilaxia
    'PERIO',                 -- Periodontal
    'BOTOX_RENEWAL',         -- Renovação de Botox
    'FILLER_RENEWAL',        -- Renovação de Preenchimento
    'ORTHO_CHECK',           -- Manutenção Ortodôntica
    'IMPLANT_MAINTENANCE',   -- Manutenção de Implante
    'CROWN_CHECK',           -- Revisão de Coroa/Prótese
    'GENERAL_CHECKUP',       -- Check-up Geral
    'TREATMENT_CONTINUATION',-- Continuação de Tratamento
    'REACTIVATION'           -- Reativação (6+ meses sem visita)
  )),
  
  -- Datas
  due_date date NOT NULL, -- Quando ele DEVERIA voltar
  created_date date DEFAULT CURRENT_DATE,
  
  -- Status
  status text DEFAULT 'PENDING' CHECK (status IN (
    'PENDING',      -- Aguardando contato
    'CONTACTED',    -- Paciente foi contatado
    'SCHEDULED',    -- Paciente agendou
    'OVERDUE',      -- Vencido sem contato
    'LOST',         -- Paciente perdido (não responde)
    'COMPLETED'     -- Recall concluído (paciente retornou)
  )),
  
  -- Vinculação
  linked_appointment_id uuid REFERENCES public.appointments(id), -- Se agendou, vincula aqui
  original_treatment_id uuid REFERENCES public.treatment_items(id), -- Tratamento que gerou o recall
  
  -- Histórico de Contato
  last_contact_date timestamp with time zone,
  contact_attempts integer DEFAULT 0,
  contact_method text CHECK (contact_method IN ('WHATSAPP', 'SMS', 'EMAIL', 'PHONE', 'IN_PERSON')),
  contact_notes text,
  
  -- Prioridade (calculada automaticamente)
  priority integer DEFAULT 50 CHECK (priority BETWEEN 0 AND 100),
  
  -- Notas
  notes text,
  
  -- Auditoria
  created_by uuid REFERENCES public.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  PRIMARY KEY (id)
);

-- Índices para performance
CREATE INDEX idx_recalls_clinic_status ON public.patient_recalls(clinic_id, status);
CREATE INDEX idx_recalls_patient ON public.patient_recalls(patient_id);
CREATE INDEX idx_recalls_due_date ON public.patient_recalls(clinic_id, due_date)
  WHERE status IN ('PENDING', 'CONTACTED', 'OVERDUE');
CREATE INDEX idx_recalls_type ON public.patient_recalls(clinic_id, recall_type);
CREATE INDEX idx_recalls_priority ON public.patient_recalls(clinic_id, priority DESC)
  WHERE status IN ('PENDING', 'CONTACTED', 'OVERDUE');

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_recall_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recall_timestamp
BEFORE UPDATE ON public.patient_recalls
FOR EACH ROW
EXECUTE FUNCTION update_recall_timestamp();

-- Trigger para atualizar status para OVERDUE automaticamente
CREATE OR REPLACE FUNCTION auto_update_recall_status_to_overdue()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.due_date < CURRENT_DATE AND NEW.status = 'PENDING' THEN
    NEW.status := 'OVERDUE';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_update_recall_overdue
BEFORE INSERT OR UPDATE ON public.patient_recalls
FOR EACH ROW
EXECUTE FUNCTION auto_update_recall_status_to_overdue();

-- Função para calcular prioridade do recall
CREATE OR REPLACE FUNCTION calculate_recall_priority(recall_id uuid)
RETURNS integer AS $$
DECLARE
  recall_record RECORD;
  priority_score integer := 50;
  days_overdue integer;
  patient_ltv numeric;
BEGIN
  SELECT 
    pr.*,
    p.total_approved,
    p.patient_ranking
  INTO recall_record
  FROM public.patient_recalls pr
  JOIN public.patients p ON pr.patient_id = p.id
  WHERE pr.id = recall_id;
  
  -- Base: Tipo de recall
  CASE recall_record.recall_type
    WHEN 'BOTOX_RENEWAL' THEN priority_score := priority_score + 30;
    WHEN 'FILLER_RENEWAL' THEN priority_score := priority_score + 25;
    WHEN 'IMPLANT_MAINTENANCE' THEN priority_score := priority_score + 20;
    WHEN 'ORTHO_CHECK' THEN priority_score := priority_score + 15;
    WHEN 'TREATMENT_CONTINUATION' THEN priority_score := priority_score + 25;
    WHEN 'REACTIVATION' THEN priority_score := priority_score + 10;
    ELSE priority_score := priority_score + 5;
  END CASE;
  
  -- Ranking do paciente (VIP = mais prioridade)
  CASE recall_record.patient_ranking
    WHEN 'VIP' THEN priority_score := priority_score + 20;
    WHEN 'PREMIUM' THEN priority_score := priority_score + 10;
    ELSE priority_score := priority_score + 0;
  END CASE;
  
  -- LTV do paciente
  patient_ltv := COALESCE(recall_record.total_approved, 0);
  IF patient_ltv > 50000 THEN
    priority_score := priority_score + 15;
  ELSIF patient_ltv > 20000 THEN
    priority_score := priority_score + 10;
  ELSIF patient_ltv > 10000 THEN
    priority_score := priority_score + 5;
  END IF;
  
  -- Dias de atraso
  days_overdue := CURRENT_DATE - recall_record.due_date;
  IF days_overdue > 30 THEN
    priority_score := priority_score - 20; -- Muito atrasado, pode estar perdido
  ELSIF days_overdue > 14 THEN
    priority_score := priority_score + 10;
  ELSIF days_overdue > 7 THEN
    priority_score := priority_score + 15;
  ELSIF days_overdue > 0 THEN
    priority_score := priority_score + 20;
  END IF;
  
  -- Limitar entre 0 e 100
  priority_score := GREATEST(0, LEAST(100, priority_score));
  
  RETURN priority_score;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar prioridade automaticamente
CREATE OR REPLACE FUNCTION auto_update_recall_priority()
RETURNS TRIGGER AS $$
BEGIN
  NEW.priority := calculate_recall_priority(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_update_recall_priority
BEFORE INSERT OR UPDATE ON public.patient_recalls
FOR EACH ROW
EXECUTE FUNCTION auto_update_recall_priority();

-- View para Radar de Oportunidades (Camada Prata)
CREATE OR REPLACE VIEW recall_opportunities_view AS
SELECT 
  pr.id as recall_id,
  pr.clinic_id,
  pr.patient_id,
  p.name as patient_name,
  p.phone as patient_phone,
  p.email as patient_email,
  p.patient_ranking,
  p.total_approved as patient_ltv,
  pr.recall_type,
  pr.due_date,
  pr.status,
  pr.priority,
  pr.contact_attempts,
  pr.last_contact_date,
  CURRENT_DATE - pr.due_date as days_overdue,
  CASE 
    WHEN pr.recall_type IN ('BOTOX_RENEWAL', 'FILLER_RENEWAL') THEN 'HOF'
    WHEN pr.recall_type IN ('ORTHO_CHECK') THEN 'ORTODONTIA'
    WHEN pr.recall_type IN ('IMPLANT_MAINTENANCE', 'CROWN_CHECK') THEN 'IMPLANTODONTIA'
    WHEN pr.recall_type = 'REACTIVATION' THEN 'REATIVAÇÃO'
    ELSE 'GERAL'
  END as category,
  CASE 
    WHEN pr.recall_type = 'BOTOX_RENEWAL' THEN 'Está na hora de renovar seu Botox! Agende já e mantenha os resultados.'
    WHEN pr.recall_type = 'FILLER_RENEWAL' THEN 'Seu preenchimento precisa de manutenção. Vamos agendar?'
    WHEN pr.recall_type = 'ORTHO_CHECK' THEN 'Hora da manutenção ortodôntica! Não deixe seu tratamento atrasar.'
    WHEN pr.recall_type = 'IMPLANT_MAINTENANCE' THEN 'Manutenção do implante é essencial. Vamos agendar?'
    WHEN pr.recall_type = 'REACTIVATION' THEN 'Sentimos sua falta! Que tal retomar seu tratamento?'
    ELSE 'Está na hora de voltar para sua consulta!'
  END as suggested_message
FROM public.patient_recalls pr
JOIN public.patients p ON pr.patient_id = p.id
WHERE pr.status IN ('PENDING', 'CONTACTED', 'OVERDUE')
ORDER BY pr.priority DESC, pr.due_date ASC;

-- Função para criar recall automático após procedimento
CREATE OR REPLACE FUNCTION auto_create_recall_after_procedure()
RETURNS TRIGGER AS $$
DECLARE
  recall_type_to_create text;
  recall_due_date date;
BEGIN
  -- Apenas criar recall se procedimento foi COMPLETED
  IF NEW.status = 'COMPLETED' AND OLD.status != 'COMPLETED' THEN
    
    -- Determinar tipo de recall baseado no procedimento
    IF NEW.procedure_name ILIKE '%botox%' OR NEW.procedure_name ILIKE '%toxina%' THEN
      recall_type_to_create := 'BOTOX_RENEWAL';
      recall_due_date := NEW.execution_date + INTERVAL '4 months';
      
    ELSIF NEW.procedure_name ILIKE '%preenchimento%' OR NEW.procedure_name ILIKE '%filler%' THEN
      recall_type_to_create := 'FILLER_RENEWAL';
      recall_due_date := NEW.execution_date + INTERVAL '6 months';
      
    ELSIF NEW.procedure_name ILIKE '%implante%' THEN
      recall_type_to_create := 'IMPLANT_MAINTENANCE';
      recall_due_date := NEW.execution_date + INTERVAL '6 months';
      
    ELSIF NEW.procedure_name ILIKE '%ortodon%' OR NEW.procedure_name ILIKE '%alinhador%' THEN
      recall_type_to_create := 'ORTHO_CHECK';
      recall_due_date := NEW.execution_date + INTERVAL '30 days';
      
    ELSIF NEW.procedure_name ILIKE '%coroa%' OR NEW.procedure_name ILIKE '%protese%' THEN
      recall_type_to_create := 'CROWN_CHECK';
      recall_due_date := NEW.execution_date + INTERVAL '6 months';
      
    ELSE
      -- Procedimento genérico: check-up em 6 meses
      recall_type_to_create := 'GENERAL_CHECKUP';
      recall_due_date := NEW.execution_date + INTERVAL '6 months';
    END IF;
    
    -- Criar recall
    INSERT INTO public.patient_recalls (
      clinic_id,
      patient_id,
      recall_type,
      due_date,
      original_treatment_id,
      status
    )
    SELECT 
      (SELECT clinic_id FROM public.patients WHERE id = NEW.patient_id),
      NEW.patient_id,
      recall_type_to_create,
      recall_due_date,
      NEW.id,
      'PENDING'
    WHERE NOT EXISTS (
      -- Evitar duplicatas
      SELECT 1 FROM public.patient_recalls
      WHERE patient_id = NEW.patient_id
        AND recall_type = recall_type_to_create
        AND status IN ('PENDING', 'CONTACTED')
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_create_recall_after_procedure
AFTER UPDATE ON public.treatment_items
FOR EACH ROW
EXECUTE FUNCTION auto_create_recall_after_procedure();

-- Comentários para documentação
COMMENT ON TABLE public.patient_recalls IS 'Sistema de recalls estruturados para retenção e reativação de pacientes';
COMMENT ON COLUMN public.patient_recalls.recall_type IS 'Tipo de recall: PROPHYLAXIS, PERIO, BOTOX_RENEWAL, ORTHO_CHECK, IMPLANT_MAINTENANCE, etc';
COMMENT ON COLUMN public.patient_recalls.priority IS 'Prioridade calculada automaticamente (0-100) baseada em tipo, LTV do paciente e dias de atraso';
COMMENT ON VIEW recall_opportunities_view IS 'View para Radar de Oportunidades (Camada Prata) com recalls priorizados';
COMMENT ON FUNCTION calculate_recall_priority IS 'Calcula prioridade do recall baseado em tipo, LTV do paciente, ranking e dias de atraso';
