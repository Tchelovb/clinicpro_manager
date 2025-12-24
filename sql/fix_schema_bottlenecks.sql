-- Ajuste na tabela de Clínicas para o Profit Engine
ALTER TABLE public.clinics 
ADD COLUMN IF NOT EXISTS federal_tax_rate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS target_profit_margin NUMERIC DEFAULT 30,
ADD COLUMN IF NOT EXISTS avg_card_fee NUMERIC DEFAULT 2.5;

-- Ajuste na restrição de honorários para evitar o erro de 'on_conflict'
ALTER TABLE public.professional_procedure_fees 
DROP CONSTRAINT IF EXISTS unique_prof_proc;

ALTER TABLE public.professional_procedure_fees 
ADD CONSTRAINT unique_prof_proc UNIQUE (professional_id, procedure_id);
