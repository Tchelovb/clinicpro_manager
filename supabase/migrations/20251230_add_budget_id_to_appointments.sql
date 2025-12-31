-- ============================================
-- MIGRATION: Connect Appointments to Finance
-- Date: 2025-12-30
-- Objective: Allow linking an appointment to a budget
-- ============================================

-- 1. Add budget_id column to appointments
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS budget_id uuid REFERENCES public.budgets(id);

-- 2. Add comment for documentation
COMMENT ON COLUMN public.appointments.budget_id IS 'Link to the approved budget (Financial Integration)';

-- 3. Create index for performance
CREATE INDEX IF NOT EXISTS idx_appointments_budget_id ON public.appointments(budget_id);

-- 4. Verify/Create appointment_confirmations if missing (Safety check)
CREATE TABLE IF NOT EXISTS public.appointment_confirmations (
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
  CONSTRAINT appointment_confirmations_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id)
);
