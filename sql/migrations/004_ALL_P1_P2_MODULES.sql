-- =====================================================
-- MIGRATION CONSOLIDADA: MÓDULOS P1 E P2
-- Prioridade: P1 (Alta) e P2 (Média)
-- Data: 21/12/2025
-- =====================================================

-- =====================================================
-- 004: RESPONSÁVEL FINANCEIRO E ALERTAS MÉDICOS (P1)
-- =====================================================

-- Adicionar campos de responsável financeiro em patients
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS responsible_party_id uuid REFERENCES public.patients(id),
ADD COLUMN IF NOT EXISTS relationship_type text CHECK (relationship_type IN ('SELF', 'PARENT', 'SPOUSE', 'GUARDIAN', 'OTHER')),
ADD COLUMN IF NOT EXISTS profile_photo_url text,
ADD COLUMN IF NOT EXISTS document_photo_front_url text,
ADD COLUMN IF NOT EXISTS document_photo_back_url text;

-- Tabela de Alertas Médicos Críticos
CREATE TABLE IF NOT EXISTS public.medical_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  alert_type text NOT NULL CHECK (alert_type IN ('ALLERGY', 'CONDITION', 'MEDICATION', 'RISK', 'CONTRAINDICATION')),
  description text NOT NULL,
  severity text DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  is_critical boolean DEFAULT false, -- Se true, mostra pop-up bloqueante
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES public.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_medical_alerts_patient ON public.medical_alerts(patient_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_medical_alerts_critical ON public.medical_alerts(patient_id, is_critical) WHERE is_active = true AND is_critical = true;

COMMENT ON TABLE public.medical_alerts IS 'Alertas médicos críticos que aparecem como pop-up ao acessar paciente';

-- =====================================================
-- 006: ANAMNESE DIGITAL ESTRUTURADA (P1)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.patient_anamnesis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id),
  
  -- Dados Médicos Críticos
  has_allergies boolean DEFAULT false,
  allergies_list text[],
  
  has_chronic_diseases boolean DEFAULT false,
  chronic_diseases text[],
  
  current_medications text[],
  
  -- Histórico Cirúrgico
  previous_surgeries text[],
  last_surgery_date date,
  
  -- Contraindicações
  is_pregnant boolean DEFAULT false,
  is_breastfeeding boolean DEFAULT false,
  has_pacemaker boolean DEFAULT false,
  has_bleeding_disorder boolean DEFAULT false,
  has_diabetes boolean DEFAULT false,
  has_hypertension boolean DEFAULT false,
  
  -- Hábitos
  is_smoker boolean DEFAULT false,
  alcohol_consumption text CHECK (alcohol_consumption IN ('NONE', 'OCCASIONAL', 'MODERATE', 'HEAVY')),
  
  -- Odontológico
  last_dental_visit date,
  brushing_frequency integer DEFAULT 2,
  uses_floss boolean DEFAULT false,
  has_dental_sensitivity boolean DEFAULT false,
  
  -- Estético
  previous_aesthetic_procedures text[],
  aesthetic_goals text,
  
  -- Assinatura e Validação
  filled_by uuid REFERENCES public.users(id),
  filled_at timestamp with time zone DEFAULT now(),
  patient_signature_url text,
  patient_signature_date timestamp with time zone,
  
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE(patient_id)
);

CREATE INDEX IF NOT EXISTS idx_anamnesis_contraindications ON public.patient_anamnesis(clinic_id, is_pregnant, has_pacemaker, has_bleeding_disorder);

COMMENT ON TABLE public.patient_anamnesis IS 'Anamnese digital estruturada com campos específicos para alertas automáticos';

-- =====================================================
-- 007: IMAGENS CLÍNICAS (P1)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.clinical_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  clinic_id uuid NOT NULL REFERENCES public.clinics(id),
  
  image_type text NOT NULL CHECK (image_type IN (
    'XRAY_PERIAPICAL', 'XRAY_PANORAMIC', 'XRAY_BITEWING', 'CBCT',
    'INTRAORAL_PHOTO', 'EXTRAORAL_PHOTO', 'SMILE_PHOTO',
    'SCAN_3D', 'OTHER'
  )),
  
  file_url text NOT NULL,
  thumbnail_url text,
  file_size_kb integer,
  
  tooth_number integer, -- Null se for panorâmica ou foto de rosto
  region text, -- Ex: "Maxila Superior", "Mandíbula"
  
  capture_date timestamp with time zone DEFAULT now(),
  notes text,
  tags text[], -- Ex: ["antes", "implante", "caso-complexo"]
  
  -- Vinculação com tratamento
  treatment_item_id uuid REFERENCES public.treatment_items(id),
  budget_id uuid REFERENCES public.budgets(id),
  is_before_treatment boolean DEFAULT true,
  
  -- Visibilidade
  is_public boolean DEFAULT false, -- Se true, pode usar em marketing (com consentimento)
  patient_consent_signed boolean DEFAULT false,
  
  uploaded_by uuid REFERENCES public.users(id),
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_clinical_images_patient ON public.clinical_images(patient_id, capture_date DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_images_treatment ON public.clinical_images(treatment_item_id, is_before_treatment);
CREATE INDEX IF NOT EXISTS idx_clinical_images_type ON public.clinical_images(clinic_id, image_type);

COMMENT ON TABLE public.clinical_images IS 'Armazenamento de imagens clínicas com suporte a antes/depois';

-- =====================================================
-- 008: CONTRATOS RECORRENTES (P1)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.recurring_contracts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id),
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  budget_id uuid REFERENCES public.budgets(id),
  
  contract_type text NOT NULL CHECK (contract_type IN (
    'BOTOX_CLUB',
    'FILLER_CLUB',
    'ORTHO_MAINTENANCE',
    'PREVENTION_PLAN',
    'AESTHETIC_PLAN',
    'OTHER'
  )),
  
  contract_name text NOT NULL, -- Ex: "Botox Club Premium"
  description text,
  
  start_date date NOT NULL,
  end_date date, -- Null se indeterminado
  
  billing_day integer NOT NULL CHECK (billing_day BETWEEN 1 AND 31),
  monthly_value numeric NOT NULL CHECK (monthly_value > 0),
  
  status text DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'CANCELLED', 'FINISHED')),
  
  -- Cobrança Automática
  auto_charge boolean DEFAULT false,
  payment_method_id uuid, -- FK para método de pagamento salvo
  
  -- Histórico
  total_charged numeric DEFAULT 0,
  total_paid numeric DEFAULT 0,
  months_active integer DEFAULT 0,
  
  -- Notas
  cancellation_reason text,
  cancellation_date timestamp with time zone,
  notes text,
  
  created_by uuid REFERENCES public.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_recurring_contracts_clinic ON public.recurring_contracts(clinic_id, status);
CREATE INDEX IF NOT EXISTS idx_recurring_contracts_patient ON public.recurring_contracts(patient_id);
CREATE INDEX IF NOT EXISTS idx_recurring_contracts_billing_day ON public.recurring_contracts(clinic_id, billing_day) WHERE status = 'ACTIVE';

-- View para MRR (Monthly Recurring Revenue)
CREATE OR REPLACE VIEW mrr_dashboard_view AS
SELECT 
  clinic_id,
  COUNT(*) as active_contracts,
  SUM(monthly_value) as total_mrr,
  AVG(monthly_value) as average_contract_value,
  SUM(CASE WHEN contract_type = 'BOTOX_CLUB' THEN monthly_value ELSE 0 END) as botox_club_mrr,
  SUM(CASE WHEN contract_type = 'FILLER_CLUB' THEN monthly_value ELSE 0 END) as filler_club_mrr,
  SUM(CASE WHEN contract_type = 'ORTHO_MAINTENANCE' THEN monthly_value ELSE 0 END) as ortho_mrr
FROM public.recurring_contracts
WHERE status = 'ACTIVE'
GROUP BY clinic_id;

COMMENT ON TABLE public.recurring_contracts IS 'Contratos recorrentes (Botox Club, planos de manutenção)';
COMMENT ON VIEW mrr_dashboard_view IS 'Dashboard de MRR (Monthly Recurring Revenue) por clínica';

-- =====================================================
-- 009: ODONTOGRAMA VISUAL (P1)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.dental_charting (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  tooth_number integer NOT NULL CHECK (tooth_number BETWEEN 11 AND 85), -- Sistema ISO
  
  -- Estado do dente
  status_code text CHECK (status_code IN (
    'SOUND',        -- Hígido
    'DECAYED',      -- Cariado
    'FILLED',       -- Restaurado
    'MISSING',      -- Ausente
    'IMPLANT',      -- Implante
    'CROWN',        -- Coroa
    'VENEER',       -- Faceta/Lente
    'ENDODONTIC',   -- Tratamento de canal
    'FRACTURED',    -- Fraturado
    'EXTRACTED'     -- Extraído
  )),
  
  surfaces jsonb, -- Ex: {"m": true, "o": true, "d": false} para MOD
  existing_material text, -- "RESIN", "AMALGAM", "PORCELAIN", "ZIRCONIA"
  
  condition_notes text,
  last_update timestamp with time zone DEFAULT now(),
  updated_by uuid REFERENCES public.users(id),
  
  UNIQUE(patient_id, tooth_number),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_dental_charting_patient ON public.dental_charting(patient_id);

COMMENT ON TABLE public.dental_charting IS 'Odontograma digital - estado atual da dentição do paciente';

-- =====================================================
-- 010-013: PRESCRIÇÕES ELETRÔNICAS (P2)
-- =====================================================

-- Biblioteca de Medicamentos
CREATE TABLE IF NOT EXISTS public.medication_library (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES public.clinics(id),
  
  name text NOT NULL,
  active_ingredient text,
  dosage text,
  form text CHECK (form IN ('TABLET', 'CAPSULE', 'SYRUP', 'OINTMENT', 'INJECTION', 'DROPS', 'OTHER')),
  
  is_controlled boolean DEFAULT false,
  requires_special_prescription boolean DEFAULT false,
  
  common_usage text,
  common_dosage_instructions text, -- Ex: "1 comprimido de 8 em 8 horas"
  
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

-- Prescrições
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id),
  professional_id uuid NOT NULL REFERENCES public.professionals(id),
  
  prescription_type text DEFAULT 'MEDICATION' CHECK (prescription_type IN ('MEDICATION', 'EXAM', 'PROCEDURE')),
  
  diagnosis text,
  notes text,
  
  status text DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED')),
  
  digital_signature_url text,
  signed_at timestamp with time zone,
  
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

-- Itens da Prescrição
CREATE TABLE IF NOT EXISTS public.prescription_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medication_id uuid REFERENCES public.medication_library(id),
  
  medication_name text NOT NULL,
  dosage text NOT NULL,
  frequency text NOT NULL,
  duration text NOT NULL,
  quantity text,
  instructions text,
  
  PRIMARY KEY (id)
);

-- Atestados Médicos
CREATE TABLE IF NOT EXISTS public.medical_certificates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id),
  professional_id uuid NOT NULL REFERENCES public.professionals(id),
  
  certificate_type text CHECK (certificate_type IN ('ABSENCE', 'COMPANION', 'FITNESS', 'PROCEDURE', 'OTHER')),
  
  days_off integer,
  start_date date NOT NULL,
  end_date date NOT NULL,
  
  reason text,
  cid_code text,
  
  content text NOT NULL,
  
  digital_signature_url text,
  signed_at timestamp with time zone,
  
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON public.prescriptions(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_certificates_patient ON public.medical_certificates(patient_id, created_at DESC);

COMMENT ON TABLE public.prescriptions IS 'Prescrições eletrônicas com medicamentos estruturados';
COMMENT ON TABLE public.medication_library IS 'Biblioteca de medicamentos para prescrições rápidas';

-- =====================================================
-- 014-016: ESTOQUE INTEGRADO COM PROCEDIMENTOS (P2)
-- =====================================================

-- Receitas de Procedimentos (Bill of Materials)
CREATE TABLE IF NOT EXISTS public.procedure_recipes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  procedure_id uuid NOT NULL REFERENCES public.procedure(id),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id),
  
  name text NOT NULL,
  description text,
  is_default boolean DEFAULT true,
  
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id)
);

-- Itens da Receita
CREATE TABLE IF NOT EXISTS public.procedure_recipe_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES public.procedure_recipes(id) ON DELETE CASCADE,
  inventory_item_id uuid NOT NULL REFERENCES public.inventory_items(id),
  
  quantity_needed numeric NOT NULL CHECK (quantity_needed > 0),
  is_optional boolean DEFAULT false,
  notes text,
  
  PRIMARY KEY (id)
);

-- Consumo Real de Materiais
CREATE TABLE IF NOT EXISTS public.procedure_material_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  treatment_item_id uuid NOT NULL REFERENCES public.treatment_items(id),
  inventory_item_id uuid NOT NULL REFERENCES public.inventory_items(id),
  
  quantity_used numeric NOT NULL CHECK (quantity_used > 0),
  unit_cost numeric NOT NULL,
  
  used_at timestamp with time zone DEFAULT now(),
  used_by uuid REFERENCES public.users(id),
  
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_material_usage_treatment ON public.procedure_material_usage(treatment_item_id);
CREATE INDEX IF NOT EXISTS idx_material_usage_inventory ON public.procedure_material_usage(inventory_item_id, used_at DESC);

COMMENT ON TABLE public.procedure_recipes IS 'Receitas de materiais necessários para cada procedimento';
COMMENT ON TABLE public.procedure_material_usage IS 'Consumo real de materiais por procedimento executado';

-- =====================================================
-- 017: PRODUTIVIDADE POR PROFISSIONAL (P2)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.professional_monthly_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id),
  
  period_month date NOT NULL,
  
  -- Métricas de Produção
  procedures_completed integer DEFAULT 0,
  total_production_value numeric DEFAULT 0,
  
  -- Métricas de Conversão
  evaluations_performed integer DEFAULT 0,
  budgets_created integer DEFAULT 0,
  budgets_approved integer DEFAULT 0,
  conversion_rate numeric DEFAULT 0,
  
  -- Métricas de Tempo
  total_hours_worked numeric DEFAULT 0,
  average_procedure_duration numeric DEFAULT 0,
  
  -- Métricas de Satisfação
  nps_score numeric,
  complaints_count integer DEFAULT 0,
  compliments_count integer DEFAULT 0,
  
  -- Métricas Financeiras
  commission_earned numeric DEFAULT 0,
  average_ticket numeric DEFAULT 0,
  
  -- Ranking
  clinic_rank integer,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  PRIMARY KEY (id),
  UNIQUE(professional_id, period_month)
);

-- View de Ranking
CREATE OR REPLACE VIEW professional_ranking AS
SELECT 
  pmm.professional_id,
  p.name,
  pmm.period_month,
  pmm.total_production_value,
  pmm.conversion_rate,
  pmm.nps_score,
  RANK() OVER (PARTITION BY pmm.clinic_id, pmm.period_month ORDER BY pmm.total_production_value DESC) as rank_by_production,
  RANK() OVER (PARTITION BY pmm.clinic_id, pmm.period_month ORDER BY pmm.conversion_rate DESC) as rank_by_conversion
FROM public.professional_monthly_metrics pmm
JOIN public.professionals p ON pmm.professional_id = p.id
WHERE pmm.period_month >= date_trunc('month', CURRENT_DATE - INTERVAL '12 months');

COMMENT ON TABLE public.professional_monthly_metrics IS 'Métricas mensais consolidadas por profissional';
COMMENT ON VIEW professional_ranking IS 'Ranking de profissionais por produção e conversão';

-- =====================================================
-- 018: AUDITORIA E COMPLIANCE (P2)
-- =====================================================

-- Já existe system_audit_logs no schema.sql
-- Adicionar apenas índices adicionais se necessário

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.system_audit_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON public.system_audit_logs(user_id, action_type, created_at DESC);

-- =====================================================
-- 019: KPIs HISTÓRICOS (P2)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.clinic_kpis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES public.clinics(id),
  
  period_start date NOT NULL,
  period_end date NOT NULL,
  
  -- Métricas Financeiras
  total_revenue numeric DEFAULT 0,
  total_expenses numeric DEFAULT 0,
  net_profit numeric DEFAULT 0,
  
  -- Métricas de Pacientes
  new_patients_count integer DEFAULT 0,
  returning_patients_count integer DEFAULT 0,
  lost_patients_count integer DEFAULT 0,
  
  -- Métricas de Conversão
  budgets_created_count integer DEFAULT 0,
  budgets_approved_count integer DEFAULT 0,
  conversion_rate numeric DEFAULT 0,
  
  -- Métricas de Produtividade
  appointments_scheduled integer DEFAULT 0,
  appointments_completed integer DEFAULT 0,
  no_show_rate numeric DEFAULT 0,
  
  -- Ticket Médio
  average_budget_value numeric DEFAULT 0,
  average_treatment_value numeric DEFAULT 0,
  
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE(clinic_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_clinic_kpis_period ON public.clinic_kpis(clinic_id, period_start, period_end);

COMMENT ON TABLE public.clinic_kpis IS 'KPIs históricos consolidados por período para análise de tendências';

-- =====================================================
-- FIM DAS MIGRATIONS
-- =====================================================
