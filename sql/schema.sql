-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.
-- Last updated: 2025-12-31 (Item-Level Locking System implemented)

CREATE TABLE public.achievements (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  code text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  icon text,
  category text,
  xp_reward integer DEFAULT 0,
  rarity text DEFAULT 'common'::text CHECK (rarity = ANY (ARRAY['common'::text, 'rare'::text, 'epic'::text, 'legendary'::text])),
  requirements jsonb DEFAULT '{}'::jsonb,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT achievements_pkey PRIMARY KEY (id)
);

CREATE TABLE public.agent_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  agent_name text NOT NULL CHECK (agent_name = ANY (ARRAY['sniper'::text, 'guardian'::text, 'caretaker'::text])),
  event_type text NOT NULL,
  entity_type text NOT NULL CHECK (entity_type = ANY (ARRAY['LEAD'::text, 'PATIENT'::text, 'INSTALLMENT'::text, 'TREATMENT'::text])),
  entity_id uuid NOT NULL,
  action_taken text NOT NULL,
  message_sent text,
  response_received text,
  status text DEFAULT 'PENDING'::text CHECK (status = ANY (ARRAY['PENDING'::text, 'SENT'::text, 'DELIVERED'::text, 'READ'::text, 'FAILED'::text])),
  error_message text,
  execution_time_ms integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT agent_logs_pkey PRIMARY KEY (id),
  CONSTRAINT agent_logs_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id),
  CONSTRAINT agent_logs_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.leads(id)
);

CREATE TABLE public.ai_insights (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  clinic_id uuid,
  category text NOT NULL,
  title text NOT NULL,
  explanation text,
  priority text CHECK (priority = ANY (ARRAY['high'::text, 'medium'::text, 'low'::text, 'critico'::text])),
  action_label text,
  action_type text,
  related_entity_id uuid,
  status text DEFAULT 'open'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_insights_pkey PRIMARY KEY (id)
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

CREATE TABLE public.appointment_confirmations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL UNIQUE,
  clinic_id uuid NOT NULL,
  reminder_sent_at timestamp with time zone,
  reminder_channel text CHECK (reminder_channel = ANY (ARRAY['WHATSAPP'::text, 'SMS'::text, 'EMAIL'::text, 'PHONE'::text])),
  reminder_message text,
  confirmation_status text DEFAULT 'PENDING'::text CHECK (confirmation_status = ANY (ARRAY['PENDING'::text, 'CONFIRMED'::text, 'CANCELLED'::text, 'RESCHEDULED'::text, 'NO_RESPONSE'::text])),
  confirmed_at timestamp with time zone,
  confirmed_by text,
  confirmation_method text CHECK (confirmation_method = ANY (ARRAY['WHATSAPP'::text, 'SMS'::text, 'EMAIL'::text, 'PHONE'::text, 'IN_PERSON'::text])),
  rescheduled_to uuid,
  cancellation_reason text,
  cancellation_notes text,
  auto_reminder_24h_sent boolean DEFAULT false,
  auto_reminder_24h_sent_at timestamp with time zone,
  auto_reminder_2h_sent boolean DEFAULT false,
  auto_reminder_2h_sent_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT appointment_confirmations_pkey PRIMARY KEY (id),
  CONSTRAINT appointment_confirmations_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id),
  CONSTRAINT appointment_confirmations_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id),
  CONSTRAINT appointment_confirmations_rescheduled_to_fkey FOREIGN KEY (rescheduled_to) REFERENCES public.appointments(id)
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
  budget_id uuid,
  CONSTRAINT appointments_pkey PRIMARY KEY (id),
  CONSTRAINT appointments_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id),
  CONSTRAINT appointments_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id),
  CONSTRAINT appointments_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.users(id),
  CONSTRAINT appointments_budget_id_fkey FOREIGN KEY (budget_id) REFERENCES public.budgets(id)
);

CREATE TABLE public.attendance_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  professional_id uuid NOT NULL,
  appointment_id uuid,
  status text DEFAULT 'WAITING'::text CHECK (status = ANY (ARRAY['WAITING'::text, 'IN_PROGRESS'::text, 'FINISHED'::text, 'CANCELLED'::text])),
  type text DEFAULT 'TREATMENT'::text CHECK (type = ANY (ARRAY['EVALUATION'::text, 'TREATMENT'::text, 'URGENCY'::text])),
  arrival_time timestamp with time zone DEFAULT now(),
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  deletion_reason text,
  authorized_by uuid,
  evolution_confirmed boolean DEFAULT false,
  professional_signature_token text,
  created_at timestamp with time zone DEFAULT now(),
  transaction_id uuid,
  billing_verified boolean DEFAULT false,
  verified_by uuid,
  CONSTRAINT attendance_queue_pkey PRIMARY KEY (id),
  CONSTRAINT attendance_queue_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id),
  CONSTRAINT attendance_queue_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id),
  CONSTRAINT attendance_queue_professional_id_fkey FOREIGN KEY (professional_id) REFERENCES public.users(id),
  CONSTRAINT attendance_queue_appointment_id_fkey FOREIGN KEY (appointment_id) REFERENCES public.appointments(id),
  CONSTRAINT attendance_queue_authorized_by_fkey FOREIGN KEY (authorized_by) REFERENCES public.users(id),
  CONSTRAINT attendance_queue_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id),
  CONSTRAINT attendance_queue_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id)
);

CREATE TABLE public.bank_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid,
  bank_name text NOT NULL,
  account_number text,
  agency text,
  name text NOT NULL,
  initial_balance numeric DEFAULT 0,
  current_balance numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bank_accounts_pkey PRIMARY KEY (id),
  CONSTRAINT bank_accounts_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id)
);

CREATE TABLE public.bank_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  bank_account_id uuid,
  date date NOT NULL,
  amount numeric NOT NULL,
  description text,
  doc_number text,
  is_reconciled boolean DEFAULT false,
  matched_transaction_id uuid,
  import_batch_id text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT bank_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT bank_transactions_bank_account_id_fkey FOREIGN KEY (bank_account_id) REFERENCES public.bank_accounts(id),
  CONSTRAINT bank_transactions_matched_transaction_id_fkey FOREIGN KEY (matched_transaction_id) REFERENCES public.transactions(id)
);

-- UPDATED: Item-Level Locking System (2025-12-31)
CREATE TABLE public.budget_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  budget_id uuid NOT NULL,
  procedure_id uuid,
  procedure_name text NOT NULL,
  region text,
  quantity integer DEFAULT 1,
  unit_value numeric NOT NULL,
  total_value numeric NOT NULL,
  amount_paid numeric,
  payment_date date,
  payment_method text,
  payment_notes text,
  face text,
  tooth_number integer,
  is_sold boolean DEFAULT false,
  sold_at timestamp with time zone,
  transaction_id uuid,
  CONSTRAINT budget_items_pkey PRIMARY KEY (id),
  CONSTRAINT budget_items_budget_id_fkey FOREIGN KEY (budget_id) REFERENCES public.budgets(id),
  CONSTRAINT budget_items_procedure_id_fkey FOREIGN KEY (procedure_id) REFERENCES public.procedure(id),
  CONSTRAINT budget_items_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id)
);

CREATE TABLE public.budget_negotiation_logs (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  budget_id uuid,
  previous_status text,
  new_status text,
  notes text,
  changed_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT budget_negotiation_logs_pkey PRIMARY KEY (id),
  CONSTRAINT budget_negotiation_logs_budget_id_fkey FOREIGN KEY (budget_id) REFERENCES public.budgets(id),
  CONSTRAINT budget_negotiation_logs_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id)
);

CREATE TABLE public.budget_payment_simulations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  budget_id uuid,
  label text,
  total_value numeric,
  down_payment numeric,
  installments integer,
  installment_value numeric,
  is_selected boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT budget_payment_simulations_pkey PRIMARY KEY (id),
  CONSTRAINT budget_payment_simulations_budget_id_fkey FOREIGN KEY (budget_id) REFERENCES public.budgets(id)
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
  rejection_reason text,
  lost_at timestamp with time zone,
  potential_margin numeric,
  expires_at timestamp with time zone,
  option_group_id uuid,
  option_label text,
  last_follow_up_at timestamp with time zone,
  follow_up_count integer DEFAULT 0,
  discount_type text DEFAULT 'PERCENTAGE'::text,
  discount_value numeric DEFAULT 0,
  down_payment_value numeric DEFAULT 0,
  installments_count integer DEFAULT 1,
  payment_method_id uuid,
  sales_rep_id uuid,
  card_machine_profile_id uuid,
  category_id uuid,
  margin_status text DEFAULT 'SAFE'::text,
  margin_lock_status text DEFAULT 'UNLOCKED'::text CHECK (margin_lock_status = ANY (ARRAY['LOCKED'::text, 'UNLOCKED'::text, 'OVERRIDDEN'::text])),
  calculated_margin_percent numeric,
  pin_override_by uuid,
  pin_override_at timestamp with time zone,
  pin_override_reason text,
  created_by_id uuid,
  assigned_to_id uuid,
  handoff_notes text,
  handoff_at timestamp with time zone,
  CONSTRAINT budgets_pkey PRIMARY KEY (id),
  CONSTRAINT budgets_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id),
  CONSTRAINT budgets_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.users(id),
  CONSTRAINT budgets_price_table_id_fkey FOREIGN KEY (price_table_id) REFERENCES public.price_tables(id),
  CONSTRAINT budgets_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id),
  CONSTRAINT budgets_sales_rep_id_fkey FOREIGN KEY (sales_rep_id) REFERENCES public.users(id),
  CONSTRAINT budgets_card_machine_profile_id_fkey FOREIGN KEY (card_machine_profile_id) REFERENCES public.card_machine_profiles(id),
  CONSTRAINT budgets_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.expense_category(id),
  CONSTRAINT budgets_pin_override_by_fkey FOREIGN KEY (pin_override_by) REFERENCES public.users(id),
  CONSTRAINT budgets_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id),
  CONSTRAINT budgets_assigned_to_id_fkey FOREIGN KEY (assigned_to_id) REFERENCES public.users(id)
);

-- Continue with remaining tables...
-- (Due to length constraints, the full schema continues with all remaining tables)
-- The complete schema includes all tables from your provided schema.

-- Note: budget_status enum now includes PARTIALLY_PAID and PAID for item-level locking support
