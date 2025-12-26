-- Create credit_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.credit_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  clinic_id uuid,
  patient_id uuid,
  lead_id uuid,
  cpf text NOT NULL,
  score integer NOT NULL,
  tier text NOT NULL CHECK (tier = ANY (ARRAY['A'::text, 'B'::text, 'C'::text, 'D'::text])),
  analysis_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT credit_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT credit_profiles_clinic_id_fkey FOREIGN KEY (clinic_id) REFERENCES public.clinics(id),
  CONSTRAINT credit_profiles_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id),
  CONSTRAINT credit_profiles_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id)
);

-- Create index for faster CPF lookups
CREATE INDEX IF NOT EXISTS idx_credit_profiles_cpf ON public.credit_profiles(cpf);
CREATE INDEX IF NOT EXISTS idx_credit_profiles_created_at ON public.credit_profiles(created_at DESC);

-- RLS Policies
ALTER TABLE public.credit_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON public.credit_profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON public.credit_profiles
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON public.credit_profiles
    FOR UPDATE TO authenticated USING (true);
