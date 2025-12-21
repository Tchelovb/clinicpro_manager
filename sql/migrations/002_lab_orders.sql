-- =====================================================
-- MIGRATION 002: GESTÃO LABORATORIAL
-- Prioridade: P0 - Crítico
-- Impacto: +R$ 15.000/mês (redução de atrasos)
-- Data: 21/12/2025
-- =====================================================

-- Tabela de Pedidos de Laboratório
CREATE TABLE IF NOT EXISTS public.lab_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES public.professionals(id),
  
  -- Laboratório
  supplier_name text NOT NULL,
  supplier_contact text,
  supplier_email text,
  supplier_phone text,
  
  -- Vinculação com Tratamento
  treatment_item_id uuid REFERENCES public.treatment_items(id),
  budget_id uuid REFERENCES public.budgets(id),
  
  -- Descrição do Trabalho
  work_description text NOT NULL,
  work_type text CHECK (work_type IN ('CROWN', 'BRIDGE', 'DENTURE', 'IMPLANT', 'VENEER', 'ORTHODONTIC', 'OTHER')),
  quantity integer DEFAULT 1,
  
  -- Datas Críticas
  sent_date date NOT NULL,
  expected_return_date date NOT NULL,
  received_date date,
  delivered_to_patient_date date,
  
  -- Financeiro do Lab
  cost numeric DEFAULT 0,
  is_paid boolean DEFAULT false,
  payment_date date,
  payment_method text,
  
  -- Workflow
  status text DEFAULT 'PREPARING' CHECK (status IN ('PREPARING', 'SENT', 'IN_PROGRESS', 'READY', 'RECEIVED', 'DELIVERED_TO_PATIENT', 'RETURNED_FOR_CORRECTION', 'CANCELLED')),
  
  -- Detalhes Técnicos
  shade_guide text, -- Ex: "Cor A1, escala Vita"
  material text, -- Ex: "Porcelana", "Zircônia"
  special_instructions text,
  
  -- Controle de Qualidade
  quality_check_passed boolean,
  quality_notes text,
  returned_for_correction_count integer DEFAULT 0,
  correction_reason text,
  
  -- Notas e Observações
  notes text,
  
  -- Auditoria
  created_by uuid REFERENCES public.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  PRIMARY KEY (id)
);

-- Índices para performance
CREATE INDEX idx_lab_orders_clinic ON public.lab_orders(clinic_id, created_at DESC);
CREATE INDEX idx_lab_orders_patient ON public.lab_orders(patient_id);
CREATE INDEX idx_lab_orders_professional ON public.lab_orders(professional_id);
CREATE INDEX idx_lab_orders_status ON public.lab_orders(clinic_id, status);
CREATE INDEX idx_lab_orders_expected_return ON public.lab_orders(clinic_id, expected_return_date)
  WHERE status IN ('SENT', 'IN_PROGRESS');
CREATE INDEX idx_lab_orders_supplier ON public.lab_orders(clinic_id, supplier_name);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_lab_order_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lab_order_timestamp
BEFORE UPDATE ON public.lab_orders
FOR EACH ROW
EXECUTE FUNCTION update_lab_order_timestamp();

-- View para pedidos atrasados (Dashboard de Alertas)
CREATE OR REPLACE VIEW overdue_lab_orders_view AS
SELECT 
  lo.id,
  lo.clinic_id,
  lo.patient_id,
  p.name as patient_name,
  p.phone as patient_phone,
  lo.professional_id,
  prof.name as professional_name,
  lo.supplier_name,
  lo.work_description,
  lo.work_type,
  lo.sent_date,
  lo.expected_return_date,
  lo.status,
  lo.cost,
  CURRENT_DATE - lo.expected_return_date as days_overdue,
  lo.returned_for_correction_count
FROM public.lab_orders lo
JOIN public.patients p ON lo.patient_id = p.id
JOIN public.professionals prof ON lo.professional_id = prof.id
WHERE lo.status IN ('SENT', 'IN_PROGRESS')
  AND lo.expected_return_date < CURRENT_DATE
ORDER BY lo.expected_return_date ASC;

-- View para dashboard de laboratórios (ranking por performance)
CREATE OR REPLACE VIEW lab_supplier_performance_view AS
SELECT 
  clinic_id,
  supplier_name,
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE status = 'DELIVERED_TO_PATIENT') as completed_orders,
  COUNT(*) FILTER (WHERE received_date > expected_return_date) as late_deliveries,
  COUNT(*) FILTER (WHERE returned_for_correction_count > 0) as orders_with_corrections,
  AVG(cost) as average_cost,
  AVG(CASE 
    WHEN received_date IS NOT NULL AND sent_date IS NOT NULL 
    THEN received_date - sent_date 
    ELSE NULL 
  END) as average_turnaround_days,
  AVG(CASE 
    WHEN received_date IS NOT NULL AND expected_return_date IS NOT NULL 
    THEN received_date - expected_return_date 
    ELSE NULL 
  END) as average_delay_days
FROM public.lab_orders
WHERE status != 'CANCELLED'
GROUP BY clinic_id, supplier_name
ORDER BY clinic_id, total_orders DESC;

-- Função para calcular status de atraso
CREATE OR REPLACE FUNCTION get_lab_order_delay_status(order_id uuid)
RETURNS text AS $$
DECLARE
  order_record RECORD;
  delay_days integer;
BEGIN
  SELECT expected_return_date, received_date, status
  INTO order_record
  FROM public.lab_orders
  WHERE id = order_id;
  
  IF order_record.status IN ('RECEIVED', 'DELIVERED_TO_PATIENT') THEN
    RETURN 'COMPLETED';
  END IF;
  
  delay_days := CURRENT_DATE - order_record.expected_return_date;
  
  IF delay_days <= 0 THEN
    RETURN 'ON_TIME';
  ELSIF delay_days BETWEEN 1 AND 3 THEN
    RETURN 'MINOR_DELAY';
  ELSIF delay_days BETWEEN 4 AND 7 THEN
    RETURN 'MODERATE_DELAY';
  ELSE
    RETURN 'CRITICAL_DELAY';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger para criar insight de IA quando pedido atrasar
CREATE OR REPLACE FUNCTION create_insight_on_lab_delay()
RETURNS TRIGGER AS $$
DECLARE
  delay_days integer;
BEGIN
  IF NEW.status IN ('SENT', 'IN_PROGRESS') AND NEW.expected_return_date < CURRENT_DATE THEN
    delay_days := CURRENT_DATE - NEW.expected_return_date;
    
    IF delay_days >= 3 THEN
      INSERT INTO public.ai_insights (
        clinic_id,
        category,
        title,
        explanation,
        priority,
        action_label,
        action_type,
        related_entity_id,
        status
      ) VALUES (
        NEW.clinic_id,
        'operational',
        'Pedido de Laboratório Atrasado',
        format('O pedido #%s do laboratório %s está atrasado há %s dias. Paciente: %s. Contate o laboratório imediatamente.',
          NEW.id, NEW.supplier_name, delay_days, (SELECT name FROM public.patients WHERE id = NEW.patient_id)),
        CASE 
          WHEN delay_days >= 7 THEN 'critico'
          WHEN delay_days >= 5 THEN 'high'
          ELSE 'medium'
        END,
        'Contatar Laboratório',
        'contact_supplier',
        NEW.id,
        'open'
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_insight_on_lab_delay
AFTER INSERT OR UPDATE ON public.lab_orders
FOR EACH ROW
EXECUTE FUNCTION create_insight_on_lab_delay();

-- Comentários para documentação
COMMENT ON TABLE public.lab_orders IS 'Gestão completa de pedidos de laboratório protético';
COMMENT ON COLUMN public.lab_orders.status IS 'Status do pedido: PREPARING, SENT, IN_PROGRESS, READY, RECEIVED, DELIVERED_TO_PATIENT, RETURNED_FOR_CORRECTION, CANCELLED';
COMMENT ON COLUMN public.lab_orders.work_type IS 'Tipo de trabalho: CROWN, BRIDGE, DENTURE, IMPLANT, VENEER, ORTHODONTIC, OTHER';
COMMENT ON COLUMN public.lab_orders.returned_for_correction_count IS 'Número de vezes que o trabalho foi devolvido para correção';
COMMENT ON VIEW overdue_lab_orders_view IS 'View de pedidos atrasados para dashboard de alertas';
COMMENT ON VIEW lab_supplier_performance_view IS 'View de performance de laboratórios (ranking)';
