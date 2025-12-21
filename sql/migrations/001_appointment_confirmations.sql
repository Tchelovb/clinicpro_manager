-- =====================================================
-- MIGRATION 001: CONFIRMAÇÃO AUTOMÁTICA DE CONSULTAS
-- Prioridade: P0 - Crítico
-- Impacto: +R$ 7.500/mês (redução de no-show)
-- Data: 21/12/2025
-- =====================================================

-- Tabela de Confirmações de Consultas
CREATE TABLE IF NOT EXISTS public.appointment_confirmations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  
  -- Rastreamento de Lembretes
  reminder_sent_at timestamp with time zone,
  reminder_channel text CHECK (reminder_channel IN ('WHATSAPP', 'SMS', 'EMAIL', 'PHONE')),
  reminder_message text,
  
  -- Status de Confirmação
  confirmation_status text DEFAULT 'PENDING' CHECK (confirmation_status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'RESCHEDULED', 'NO_RESPONSE')),
  confirmed_at timestamp with time zone,
  confirmed_by text, -- 'PATIENT' ou 'RECEPTIONIST'
  confirmation_method text CHECK (confirmation_method IN ('WHATSAPP', 'SMS', 'EMAIL', 'PHONE', 'IN_PERSON')),
  
  -- Reagendamento
  rescheduled_to uuid REFERENCES public.appointments(id),
  cancellation_reason text,
  cancellation_notes text,
  
  -- Automação
  auto_reminder_24h_sent boolean DEFAULT false,
  auto_reminder_24h_sent_at timestamp with time zone,
  auto_reminder_2h_sent boolean DEFAULT false,
  auto_reminder_2h_sent_at timestamp with time zone,
  
  -- Auditoria
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  PRIMARY KEY (id),
  UNIQUE(appointment_id) -- Uma confirmação por agendamento
);

-- Índices para performance
CREATE INDEX idx_confirmation_pending ON public.appointment_confirmations(clinic_id, confirmation_status, reminder_sent_at)
  WHERE confirmation_status = 'PENDING';

CREATE INDEX idx_confirmation_clinic_date ON public.appointment_confirmations(clinic_id, created_at DESC);

CREATE INDEX idx_confirmation_appointment ON public.appointment_confirmations(appointment_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_appointment_confirmation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_appointment_confirmation_timestamp
BEFORE UPDATE ON public.appointment_confirmations
FOR EACH ROW
EXECUTE FUNCTION update_appointment_confirmation_timestamp();

-- Trigger para criar confirmação automaticamente ao criar agendamento
CREATE OR REPLACE FUNCTION auto_create_appointment_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.appointment_confirmations (appointment_id, clinic_id, confirmation_status)
  VALUES (NEW.id, NEW.clinic_id, 'PENDING');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_create_confirmation
AFTER INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION auto_create_appointment_confirmation();

-- Trigger para atualizar status do agendamento ao confirmar
CREATE OR REPLACE FUNCTION sync_appointment_status_on_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.confirmation_status = 'CONFIRMED' AND OLD.confirmation_status != 'CONFIRMED' THEN
    UPDATE public.appointments
    SET status = 'CONFIRMED'
    WHERE id = NEW.appointment_id;
  END IF;
  
  IF NEW.confirmation_status = 'CANCELLED' AND OLD.confirmation_status != 'CANCELLED' THEN
    UPDATE public.appointments
    SET status = 'CANCELLED'
    WHERE id = NEW.appointment_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_appointment_status
AFTER UPDATE ON public.appointment_confirmations
FOR EACH ROW
EXECUTE FUNCTION sync_appointment_status_on_confirmation();

-- View para confirmações pendentes (Dashboard)
CREATE OR REPLACE VIEW pending_confirmations_view AS
SELECT 
  ac.id as confirmation_id,
  ac.appointment_id,
  ac.confirmation_status,
  ac.reminder_sent_at,
  ac.auto_reminder_24h_sent,
  ac.auto_reminder_2h_sent,
  a.date as appointment_date,
  a.duration,
  a.type as appointment_type,
  p.id as patient_id,
  p.name as patient_name,
  p.phone as patient_phone,
  p.email as patient_email,
  u.name as professional_name,
  c.name as clinic_name,
  EXTRACT(EPOCH FROM (a.date - now())) / 3600 as hours_until_appointment
FROM public.appointment_confirmations ac
JOIN public.appointments a ON ac.appointment_id = a.id
JOIN public.patients p ON a.patient_id = p.id
JOIN public.users u ON a.doctor_id = u.id
JOIN public.clinics c ON ac.clinic_id = c.id
WHERE ac.confirmation_status = 'PENDING'
  AND a.date > now()
ORDER BY a.date ASC;

-- Comentários para documentação
COMMENT ON TABLE public.appointment_confirmations IS 'Rastreamento de confirmações de consultas e lembretes automáticos';
COMMENT ON COLUMN public.appointment_confirmations.confirmation_status IS 'Status da confirmação: PENDING, CONFIRMED, CANCELLED, RESCHEDULED, NO_RESPONSE';
COMMENT ON COLUMN public.appointment_confirmations.auto_reminder_24h_sent IS 'Flag indicando se lembrete de 24h foi enviado';
COMMENT ON COLUMN public.appointment_confirmations.auto_reminder_2h_sent IS 'Flag indicando se lembrete de 2h foi enviado';

-- Grant permissions (ajustar conforme RLS policies)
-- ALTER TABLE public.appointment_confirmations ENABLE ROW LEVEL SECURITY;
