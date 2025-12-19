-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.ai_insights (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  type USER-DEFINED NOT NULL,
  priority USER-DEFINED NOT NULL DEFAULT 'MEDIUM'::ai_insight_priority,
  category USER-DEFINED NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  explanation text,
  action_label text,
  action_link text,
  action_payload jsonb,
  is_read boolean DEFAULT false,
  is_archived boolean DEFAULT false,
  is_pinned boolean DEFAULT false,
  generated_at timestamp with time zone DEFAULT now(),
  valid_until timestamp with time zone,
  metadata jsonb,
  CONSTRAINT ai_insights_pkey PRIMARY KEY (id),
  CONSTRAINT ai_insights_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id)
);
CREATE TABLE public.api_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid,
  name text NOT NULL,
  key_hash text NOT NULL,
  prefix text NOT NULL,
  scopes ARRAY DEFAULT ARRAY['read_only'::text],
  last_used_at timestamp with time zone,
  expires_at timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT api_keys_pkey PRIMARY KEY (id),
  CONSTRAINT api_keys_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id)
);
CREATE TABLE public.appointments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  clinic_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  doctor_id uuid NOT NULL,
  date timestamp with time zone NOT NULL,
  duration integer NOT NULL,
  type USER-DEFINED DEFAULT 'EVALUATION'::appointment_type,
  status USER-DEFINED DEFAULT 'PENDING'::appointment_status,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT appointments_pkey PRIMARY KEY (id),
  CONSTRAINT appointments_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id),
  CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id),
  CONSTRAINT appointments_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.users(id)
);
CREATE TABLE public.budget_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  budget_id uuid NOT NULL,
  procedure_id uuid,
  procedure_name text NOT NULL,
  region text,
  quantity integer DEFAULT 1,
  unit_value numeric NOT NULL,
  total_value numeric NOT NULL,
  CONSTRAINT budget_items_pkey PRIMARY KEY (id),
  CONSTRAINT budget_items_budget_id_fkey FOREIGN KEY (budget_id) REFERENCES public.budgets(id),
  CONSTRAINT budget_items_procedure_id_fkey FOREIGN KEY (procedure_id) REFERENCES public.procedure(id)
);
CREATE TABLE public.budgets (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  patient_id uuid NOT NULL,
  doctor_id uuid,
  price_table_id uuid,
  status USER-DEFINED DEFAULT 'DRAFT'::budget_status,
  total_value numeric NOT NULL,
  discount numeric DEFAULT 0,
  final_value numeric NOT NULL,
  payment_config jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  clinic_id uuid,
  CONSTRAINT budgets_pkey PRIMARY KEY (id),
  CONSTRAINT budgets_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id),
  CONSTRAINT budgets_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.users(id),
  CONSTRAINT budgets_price_table_id_fkey FOREIGN KEY (price_table_id) REFERENCES public.price_tables(id),
  CONSTRAINT budgets_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id)
);
CREATE TABLE public.cash_registers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  clinic_id uuid NOT NULL,
  user_id uuid NOT NULL,
  opened_at timestamp with time zone DEFAULT now(),
  closed_at timestamp with time zone,
  opening_balance numeric NOT NULL,
  closing_balance numeric,
  calculated_balance numeric NOT NULL,
  status text NOT NULL CHECK (status = ANY (ARRAY['OPEN'::text, 'CLOSED'::text, 'AUDIT_PENDING'::text])),
  observations text,
  declared_balance numeric,
  difference_amount numeric,
  difference_reason text,
  CONSTRAINT cash_registers_pkey PRIMARY KEY (id),
  CONSTRAINT cash_registers_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id),
  CONSTRAINT cash_registers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.clinic_financial_settings (
  clinic_id uuid NOT NULL,
  force_cash_opening boolean DEFAULT true,
  force_daily_closing boolean DEFAULT true,
  allow_negative_balance boolean DEFAULT false,
  blind_closing boolean DEFAULT true,
  default_change_fund numeric DEFAULT 100.00,
  max_difference_without_approval numeric DEFAULT 50.00,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT clinic_financial_settings_pkey PRIMARY KEY (clinic_id),
  CONSTRAINT clinic_financial_settings_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id)
);
CREATE TABLE public.clinical_form_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid,
  template_id uuid,
  patient_id uuid,
  responses jsonb NOT NULL DEFAULT '{}'::jsonb,
  filled_by uuid,
  filled_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  patient_signature_url text,
  professional_signature_url text,
  CONSTRAINT clinical_form_responses_pkey PRIMARY KEY (id),
  CONSTRAINT clinical_form_responses_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id),
  CONSTRAINT clinical_form_responses_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.clinical_form_templates(id),
  CONSTRAINT clinical_form_responses_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id),
  CONSTRAINT clinical_form_responses_filled_by_fkey FOREIGN KEY (filled_by) REFERENCES public.users(id)
);
CREATE TABLE public.clinical_form_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid,
  name text NOT NULL,
  description text,
  category text DEFAULT 'ANAMNESIS'::text CHECK (category = ANY (ARRAY['ANAMNESIS'::text, 'CONSENT'::text, 'EVALUATION'::text, 'FOLLOW_UP'::text, 'OTHER'::text])),
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  required_for_first_appointment boolean DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT clinical_form_templates_pkey PRIMARY KEY (id),
  CONSTRAINT clinical_form_templates_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id),
  CONSTRAINT clinical_form_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.clinical_notes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  patient_id uuid NOT NULL,
  doctor_id uuid NOT NULL,
  type text NOT NULL,
  content text NOT NULL,
  date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT clinical_notes_pkey PRIMARY KEY (id),
  CONSTRAINT clinical_notes_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id),
  CONSTRAINT clinical_notes_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.users(id)
);
CREATE TABLE public.clinics (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  cnpj text,
  address text,
  phone text,
  email text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  code text NOT NULL,
  opening_time time without time zone,
  closing_time time without time zone,
  slot_duration integer DEFAULT 30,
  working_days ARRAY DEFAULT ARRAY['monday'::text, 'tuesday'::text, 'wednesday'::text, 'thursday'::text, 'friday'::text],
  status text DEFAULT 'ACTIVE'::text CHECK (status = ANY (ARRAY['ACTIVE'::text, 'SUSPENDED'::text])),
  logo_light_url text,
  logo_dark_url text,
  favicon_url text,
  primary_color character varying DEFAULT '#3B82F6'::character varying,
  secondary_color character varying DEFAULT '#10B981'::character varying,
  document_footer text DEFAULT '{{CLINIC_NAME}} - CNPJ: {{CNPJ}}
{{ADDRESS}} - Tel: {{PHONE}}
Responsável Técnico: {{RT_NAME}} - {{CRO}}'::text,
  auto_logout_minutes integer DEFAULT 30,
  require_password_on_unlock boolean DEFAULT true,
  enable_audit_log boolean DEFAULT true,
  max_failed_login_attempts integer DEFAULT 5,
  lockout_duration_minutes integer DEFAULT 15,
  block_debtors_scheduling boolean DEFAULT false,
  debtor_block_days integer DEFAULT 30,
  debtor_warning_message text DEFAULT 'Paciente possui débitos em atraso. Regularize os pagamentos antes de agendar.'::text,
  max_discount_without_approval numeric DEFAULT 5.00,
  require_manager_password_for_discount boolean DEFAULT true,
  discount_approval_message text DEFAULT 'Desconto acima do limite permitido. Solicite aprovação do gestor.'::text,
  backup_frequency text DEFAULT 'WEEKLY'::text CHECK (backup_frequency = ANY (ARRAY['DAILY'::text, 'WEEKLY'::text, 'MONTHLY'::text, 'NEVER'::text])),
  backup_email text,
  last_backup_at timestamp with time zone,
  goals jsonb DEFAULT '{"new_patients": 20, "no_show_rate": 5, "average_ticket": 2000, "occupancy_rate": 80, "conversion_rate": 30, "monthly_revenue": 50000, "monthly_net_result": 25000}'::jsonb,
  CONSTRAINT clinics_pkey PRIMARY KEY (id)
);
CREATE TABLE public.commission_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid,
  professional_id uuid,
  period_start date NOT NULL,
  period_end date NOT NULL,
  total_procedures_value numeric DEFAULT 0,
  commission_value numeric DEFAULT 0,
  procedures_count integer DEFAULT 0,
  details jsonb,
  status text DEFAULT 'PENDING'::text CHECK (status = ANY (ARRAY['PENDING'::text, 'PAID'::text, 'CANCELLED'::text])),
  paid_at timestamp with time zone,
  paid_by uuid,
  payment_method text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT commission_payments_pkey PRIMARY KEY (id),
  CONSTRAINT commission_payments_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id),
  CONSTRAINT commission_payments_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id),
  CONSTRAINT commission_payments_paid_by_fkey FOREIGN KEY (paid_by) REFERENCES public.users(id)
);
CREATE TABLE public.conventions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid,
  name text NOT NULL,
  code text,
  price_table_id uuid,
  status text NOT NULL DEFAULT 'Ativo'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT conventions_pkey PRIMARY KEY (id),
  CONSTRAINT conventions_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id),
  CONSTRAINT conventions_price_table_id_fkey FOREIGN KEY (price_table_id) REFERENCES public.price_tables(id)
);
CREATE TABLE public.custom_lead_status (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  name text NOT NULL,
  status_order integer NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT custom_lead_status_pkey PRIMARY KEY (id),
  CONSTRAINT custom_lead_status_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id)
);
CREATE TABLE public.document_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid,
  name text NOT NULL,
  document_type text NOT NULL CHECK (document_type = ANY (ARRAY['PRESCRIPTION'::text, 'CERTIFICATE'::text, 'DECLARATION'::text, 'TREATMENT_PLAN'::text, 'BUDGET'::text, 'OTHER'::text])),
  content text NOT NULL,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT document_templates_pkey PRIMARY KEY (id),
  CONSTRAINT document_templates_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id),
  CONSTRAINT document_templates_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.expense_category (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT expense_category_pkey PRIMARY KEY (id),
  CONSTRAINT expense_category_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id)
);
CREATE TABLE public.expenses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  clinic_id uuid NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  provider text,
  amount numeric NOT NULL,
  amount_paid numeric DEFAULT 0,
  due_date date NOT NULL,
  status USER-DEFINED DEFAULT 'PENDING'::payment_status,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT expenses_pkey PRIMARY KEY (id),
  CONSTRAINT expenses_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id)
);
CREATE TABLE public.financial_installments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  patient_id uuid NOT NULL,
  clinic_id uuid NOT NULL,
  description text NOT NULL,
  due_date date NOT NULL,
  amount numeric NOT NULL,
  amount_paid numeric DEFAULT 0,
  status USER-DEFINED DEFAULT 'PENDING'::payment_status,
  payment_method text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT financial_installments_pkey PRIMARY KEY (id),
  CONSTRAINT financial_installments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id),
  CONSTRAINT financial_installments_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id)
);
CREATE TABLE public.insurance_plans (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  clinic_id uuid,
  price_table_id uuid NOT NULL,
  name text NOT NULL,
  code text,
  active boolean DEFAULT true,
  CONSTRAINT insurance_plans_pkey PRIMARY KEY (id),
  CONSTRAINT insurance_plans_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id),
  CONSTRAINT insurance_plans_price_table_id_fkey FOREIGN KEY (price_table_id) REFERENCES public.price_tables(id)
);
CREATE TABLE public.integration_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid,
  integration_type text CHECK (integration_type = ANY (ARRAY['WEBHOOK'::text, 'API'::text, 'BACKUP'::text])),
  status text CHECK (status = ANY (ARRAY['SUCCESS'::text, 'FAILURE'::text])),
  details jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT integration_logs_pkey PRIMARY KEY (id),
  CONSTRAINT integration_logs_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id)
);
CREATE TABLE public.lead_interactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  lead_id uuid NOT NULL,
  user_id uuid NOT NULL,
  type text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT lead_interactions_pkey PRIMARY KEY (id),
  CONSTRAINT lead_interactions_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id),
  CONSTRAINT lead_interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.lead_source (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT lead_source_pkey PRIMARY KEY (id),
  CONSTRAINT lead_source_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id)
);
CREATE TABLE public.lead_tasks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  lead_id uuid NOT NULL,
  title text NOT NULL,
  due_date date NOT NULL,
  completed boolean DEFAULT false,
  CONSTRAINT lead_tasks_pkey PRIMARY KEY (id),
  CONSTRAINT lead_tasks_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id)
);
CREATE TABLE public.leads (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  clinic_id uuid NOT NULL,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  source text NOT NULL,
  status USER-DEFINED DEFAULT 'NEW'::lead_status,
  interest text,
  value numeric,
  patient_id uuid,
  budget_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_interaction timestamp with time zone DEFAULT now(),
  campaign_id uuid,
  lead_score integer DEFAULT 0,
  priority text DEFAULT 'MEDIUM'::text CHECK (priority = ANY (ARRAY['HIGH'::text, 'MEDIUM'::text, 'LOW'::text])),
  desired_treatment text,
  CONSTRAINT leads_pkey PRIMARY KEY (id),
  CONSTRAINT leads_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id),
  CONSTRAINT leads_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id),
  CONSTRAINT leads_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.marketing_campaigns(id)
);
CREATE TABLE public.marketing_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid,
  name text NOT NULL,
  channel text NOT NULL,
  status text DEFAULT 'ACTIVE'::text CHECK (status = ANY (ARRAY['ACTIVE'::text, 'PAUSED'::text, 'COMPLETED'::text])),
  budget numeric DEFAULT 0,
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT marketing_campaigns_pkey PRIMARY KEY (id),
  CONSTRAINT marketing_campaigns_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id)
);
CREATE TABLE public.notification_channels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid,
  channel_type text NOT NULL CHECK (channel_type = ANY (ARRAY['WHATSAPP'::text, 'EMAIL'::text, 'SMS'::text])),
  provider_name text,
  api_key text,
  api_secret text,
  sender_id text,
  is_active boolean DEFAULT false,
  daily_limit integer DEFAULT 100,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notification_channels_pkey PRIMARY KEY (id),
  CONSTRAINT notification_channels_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id)
);
CREATE TABLE public.notification_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid,
  patient_id uuid,
  recipient_contact text NOT NULL,
  channel_type text NOT NULL,
  template_id uuid,
  content_sent text,
  status text DEFAULT 'PENDING'::text CHECK (status = ANY (ARRAY['PENDING'::text, 'SENT'::text, 'DELIVERED'::text, 'READ'::text, 'FAILED'::text])),
  error_message text,
  sent_at timestamp with time zone DEFAULT now(),
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notification_logs_pkey PRIMARY KEY (id),
  CONSTRAINT notification_logs_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id),
  CONSTRAINT notification_logs_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id),
  CONSTRAINT notification_logs_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.notification_templates(id)
);
CREATE TABLE public.notification_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid,
  name text NOT NULL,
  trigger_event text NOT NULL CHECK (trigger_event = ANY (ARRAY['APPOINTMENT_CREATED'::text, 'APPOINTMENT_REMINDER'::text, 'APPOINTMENT_MISSED'::text, 'BIRTHDAY'::text, 'RECALL_6_MONTHS'::text, 'PAYMENT_DUE'::text, 'CUSTOM'::text])),
  channel_type text DEFAULT 'WHATSAPP'::text CHECK (channel_type = ANY (ARRAY['WHATSAPP'::text, 'EMAIL'::text, 'SMS'::text])),
  content text NOT NULL,
  schedule_offset_minutes integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notification_templates_pkey PRIMARY KEY (id),
  CONSTRAINT notification_templates_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id)
);
CREATE TABLE public.patient_documents (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  patient_id uuid NOT NULL,
  template_id uuid,
  title text NOT NULL,
  type USER-DEFINED NOT NULL,
  content text NOT NULL,
  status text DEFAULT 'DRAFT'::text,
  created_at timestamp with time zone DEFAULT now(),
  signed_at timestamp with time zone,
  clinic_id uuid,
  print_status text DEFAULT 'PENDING'::text CHECK (print_status = ANY (ARRAY['PENDING'::text, 'PRINTED'::text, 'SIGNED'::text, 'ARCHIVED'::text])),
  generated_from_budget_id uuid,
  CONSTRAINT patient_documents_pkey PRIMARY KEY (id),
  CONSTRAINT patient_documents_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id),
  CONSTRAINT patient_documents_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id),
  CONSTRAINT patient_documents_generated_from_budget_id_fkey FOREIGN KEY (generated_from_budget_id) REFERENCES public.budgets(id)
);
CREATE TABLE public.patients (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  clinic_id uuid NOT NULL,
  name text NOT NULL,
  cpf text,
  phone text NOT NULL,
  email text,
  birth_date date,
  gender text,
  address text,
  status text DEFAULT 'Em Tratamento'::text,
  total_approved numeric DEFAULT 0,
  total_paid numeric DEFAULT 0,
  balance_due numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT patients_pkey PRIMARY KEY (id),
  CONSTRAINT patients_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id)
);
CREATE TABLE public.payment_history (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  installment_id uuid NOT NULL,
  amount numeric NOT NULL,
  date date NOT NULL,
  method text NOT NULL,
  notes text,
  transaction_id uuid UNIQUE,
  CONSTRAINT payment_history_pkey PRIMARY KEY (id),
  CONSTRAINT payment_history_installment_id_fkey FOREIGN KEY (installment_id) REFERENCES public.financial_installments(id),
  CONSTRAINT fk_payment_transaction FOREIGN KEY (transaction_id) REFERENCES public.transactions(id)
);
CREATE TABLE public.payment_method (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payment_method_pkey PRIMARY KEY (id),
  CONSTRAINT payment_method_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id)
);
CREATE TABLE public.payment_method_fees (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid,
  payment_method_name text NOT NULL,
  payment_type text DEFAULT 'CREDIT'::text CHECK (payment_type = ANY (ARRAY['CREDIT'::text, 'DEBIT'::text, 'PIX'::text, 'BOLETO'::text, 'CASH'::text, 'OTHER'::text])),
  fee_type text DEFAULT 'PERCENTAGE'::text CHECK (fee_type = ANY (ARRAY['PERCENTAGE'::text, 'FIXED'::text])),
  fee_percent numeric DEFAULT 0,
  fee_fixed_amount numeric DEFAULT 0,
  installments_allowed boolean DEFAULT false,
  max_installments integer DEFAULT 1,
  min_installment_value numeric DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payment_method_fees_pkey PRIMARY KEY (id),
  CONSTRAINT payment_method_fees_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id)
);
CREATE TABLE public.price_table_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  price_table_id uuid NOT NULL,
  procedure_id uuid NOT NULL,
  price numeric NOT NULL,
  CONSTRAINT price_table_items_pkey PRIMARY KEY (id),
  CONSTRAINT price_table_items_price_table_id_fkey FOREIGN KEY (price_table_id) REFERENCES public.price_tables(id),
  CONSTRAINT price_table_items_procedure_id_fkey FOREIGN KEY (procedure_id) REFERENCES public.procedure(id)
);
CREATE TABLE public.price_tables (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  clinic_id uuid NOT NULL,
  name text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  global_adjustment_percent numeric DEFAULT 0.00,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now(),
  type text DEFAULT 'PARTICULAR'::text CHECK (type = ANY (ARRAY['PARTICULAR'::text, 'CONVENIO'::text, 'PARCERIA'::text, 'OUTROS'::text])),
  external_code text,
  contact_phone text,
  notes text,
  CONSTRAINT price_tables_pkey PRIMARY KEY (id),
  CONSTRAINT price_tables_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id)
);
CREATE TABLE public.procedure (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  clinic_id uuid NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  base_price numeric NOT NULL,
  duration integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  total_sessions integer NOT NULL DEFAULT 1,
  duration_min integer DEFAULT 30,
  sessions integer DEFAULT 1,
  code_tuss text,
  description text,
  CONSTRAINT procedure_pkey PRIMARY KEY (id),
  CONSTRAINT procedure_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id)
);
CREATE TABLE public.procedure_costs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  procedure_id uuid NOT NULL UNIQUE,
  material_cost numeric DEFAULT 0,
  professional_cost numeric DEFAULT 0,
  comission_cost numeric DEFAULT 0,
  operational_overhead numeric DEFAULT 0,
  total_cost numeric DEFAULT ((material_cost + professional_cost) + operational_overhead),
  notes text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT procedure_costs_pkey PRIMARY KEY (id),
  CONSTRAINT procedure_costs_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id),
  CONSTRAINT procedure_costs_procedure_id_fkey FOREIGN KEY (procedure_id) REFERENCES public.procedure(id)
);
CREATE TABLE public.professional_commissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid,
  professional_id uuid,
  commission_percent numeric DEFAULT 30.00,
  payment_rule text DEFAULT 'ON_RECEIPT'::text CHECK (payment_rule = ANY (ARRAY['ON_RECEIPT'::text, 'ON_EXECUTION'::text])),
  procedure_category text,
  custom_commission_percent numeric,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT professional_commissions_pkey PRIMARY KEY (id),
  CONSTRAINT professional_commissions_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id),
  CONSTRAINT professional_commissions_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id)
);
CREATE TABLE public.professional_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL,
  clinic_id uuid NOT NULL,
  day_of_week text NOT NULL CHECK (day_of_week = ANY (ARRAY['monday'::text, 'tuesday'::text, 'wednesday'::text, 'thursday'::text, 'friday'::text, 'saturday'::text, 'sunday'::text])),
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT professional_schedules_pkey PRIMARY KEY (id),
  CONSTRAINT professional_schedules_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.users(id),
  CONSTRAINT professional_schedules_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id)
);
CREATE TABLE public.professionals (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  clinic_id uuid NOT NULL,
  name text NOT NULL,
  crc text UNIQUE,
  specialty text,
  council text,
  is_active boolean DEFAULT true,
  photo_url text,
  color text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT professionals_pkey PRIMARY KEY (id),
  CONSTRAINT professionals_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id)
);
CREATE TABLE public.revenue_category (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT revenue_category_pkey PRIMARY KEY (id),
  CONSTRAINT revenue_category_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id)
);
CREATE TABLE public.sales_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid,
  period_month date NOT NULL,
  target_revenue numeric DEFAULT 0,
  target_leads integer DEFAULT 0,
  target_conversion_rate numeric,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sales_goals_pkey PRIMARY KEY (id),
  CONSTRAINT sales_goals_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id)
);
CREATE TABLE public.sales_scripts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid,
  title text NOT NULL,
  stage text NOT NULL CHECK (stage = ANY (ARRAY['NEW'::text, 'CONTACT'::text, 'BUDGET'::text, 'NEGOTIATION'::text, 'RECOVERY'::text, 'RETENTION'::text])),
  content text NOT NULL,
  tags ARRAY,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sales_scripts_pkey PRIMARY KEY (id),
  CONSTRAINT sales_scripts_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id)
);
CREATE TABLE public.system_audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid,
  user_id uuid,
  user_name text NOT NULL,
  user_email text,
  action_type text NOT NULL CHECK (action_type = ANY (ARRAY['CREATE'::text, 'UPDATE'::text, 'DELETE'::text, 'LOGIN'::text, 'LOGOUT'::text, 'LOGIN_FAILED'::text, 'EXPORT'::text, 'IMPORT'::text])),
  entity_type text NOT NULL CHECK (entity_type = ANY (ARRAY['PATIENT'::text, 'BUDGET'::text, 'APPOINTMENT'::text, 'EXPENSE'::text, 'TRANSACTION'::text, 'CASH_REGISTER'::text, 'USER'::text, 'PROFESSIONAL'::text, 'PROCEDURE'::text, 'LEAD'::text, 'DOCUMENT'::text, 'CLINICAL_NOTE'::text, 'TREATMENT'::text])),
  entity_id uuid,
  entity_name text,
  old_value jsonb,
  new_value jsonb,
  changes_summary text,
  ip_address inet,
  user_agent text,
  session_id text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT system_audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT system_audit_logs_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id),
  CONSTRAINT system_audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.transactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  clinic_id uuid NOT NULL,
  cash_register_id uuid,
  description text NOT NULL,
  amount numeric NOT NULL,
  type USER-DEFINED NOT NULL,
  category text NOT NULL,
  date date NOT NULL,
  payment_method text NOT NULL,
  expense_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id),
  CONSTRAINT transactions_cash_register_id_fkey FOREIGN KEY (cash_register_id) REFERENCES public.cash_registers(id),
  CONSTRAINT transactions_expense_id_fkey FOREIGN KEY (expense_id) REFERENCES public.expenses(id)
);
CREATE TABLE public.treatment_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  patient_id uuid NOT NULL,
  budget_id uuid NOT NULL,
  procedure_name text NOT NULL,
  region text,
  status USER-DEFINED DEFAULT 'NOT_STARTED'::treatment_status,
  doctor_id uuid,
  execution_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT treatment_items_pkey PRIMARY KEY (id),
  CONSTRAINT treatment_items_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id),
  CONSTRAINT treatment_items_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id),
  CONSTRAINT treatment_items_budget_id_fkey FOREIGN KEY (budget_id) REFERENCES public.budgets(id),
  CONSTRAINT treatment_items_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  can_view_financial boolean DEFAULT false,
  can_give_discount boolean DEFAULT false,
  max_discount_percent numeric DEFAULT 0,
  can_delete_transaction boolean DEFAULT false,
  can_close_cash boolean DEFAULT false,
  can_open_cash boolean DEFAULT false,
  can_view_dre boolean DEFAULT false,
  can_create_patient boolean DEFAULT true,
  can_edit_patient boolean DEFAULT true,
  can_delete_patient boolean DEFAULT false,
  can_view_all_patients boolean DEFAULT true,
  can_export_patient_data boolean DEFAULT false,
  can_create_budget boolean DEFAULT true,
  can_approve_budget boolean DEFAULT false,
  can_edit_price boolean DEFAULT false,
  can_delete_budget boolean DEFAULT false,
  can_create_appointment boolean DEFAULT true,
  can_cancel_appointment boolean DEFAULT true,
  can_view_all_schedules boolean DEFAULT true,
  can_edit_others_appointments boolean DEFAULT false,
  can_access_settings boolean DEFAULT false,
  can_manage_users boolean DEFAULT false,
  can_view_audit_logs boolean DEFAULT false,
  can_manage_professionals boolean DEFAULT false,
  can_manage_procedures boolean DEFAULT false,
  can_view_crm boolean DEFAULT true,
  can_convert_lead boolean DEFAULT true,
  can_delete_lead boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT user_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.user_roles_lookup (
  user_id uuid NOT NULL,
  role USER-DEFINED NOT NULL,
  clinic_id uuid,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_roles_lookup_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_roles_lookup_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT user_roles_lookup_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  clinic_id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  role USER-DEFINED DEFAULT 'DENTIST'::role,
  color text,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  phone text,
  professional_id uuid,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id),
  CONSTRAINT users_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.professionals(id)
);
CREATE TABLE public.webhooks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid,
  name text NOT NULL,
  url text NOT NULL,
  event text NOT NULL CHECK (event = ANY (ARRAY['PATIENT_CREATED'::text, 'APPOINTMENT_CREATED'::text, 'TRANSACTION_CREATED'::text, 'STATUS_CHANGED'::text, 'ALL_EVENTS'::text])),
  secret_key text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  last_triggered_at timestamp with time zone,
  failure_count integer DEFAULT 0,
  CONSTRAINT webhooks_pkey PRIMARY KEY (id),
  CONSTRAINT webhooks_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id)
);
