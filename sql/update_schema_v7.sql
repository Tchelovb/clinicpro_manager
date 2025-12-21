-- 1. Melhoria no Funil de Vendas (Inteligência de Objeções)
ALTER TABLE public.budgets 
ADD COLUMN IF NOT EXISTS rejection_reason text,
ADD COLUMN IF NOT EXISTS lost_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS potential_margin numeric;

-- 2. Melhoria no Financeiro (DRE Profissional - Custos Variáveis)
ALTER TABLE public.expense_category 
ADD COLUMN IF NOT EXISTS is_variable_cost boolean DEFAULT false;

-- Atualizar custos de procedimento para incluir impostos e taxas
ALTER TABLE public.procedure_costs 
ADD COLUMN IF NOT EXISTS tax_percent numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS card_fee_percent numeric DEFAULT 0;

-- 3. Melhoria no CRM (Fidelização e Rastreio High-Ticket)
-- Adiciona rastreio de origem e última avaliação estética
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS acquisition_source_id uuid REFERENCES public.lead_source(id),
ADD COLUMN IF NOT EXISTS last_aesthetic_evaluation date,
ADD COLUMN IF NOT EXISTS patient_ranking text DEFAULT 'STANDARD'; -- Valores: 'VIP', 'GOLD', 'STANDARD'

-- 4. Metas por Profissional (Inspirado no ProDent365 / Simples Dental)
CREATE TABLE IF NOT EXISTS public.professional_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid REFERENCES public.professionals(id),
  month date NOT NULL, -- Armazena o primeiro dia do mês (ex: 2025-01-01)
  revenue_goal numeric DEFAULT 0,
  conversion_goal numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS para nova tabela
ALTER TABLE public.professional_goals ENABLE ROW LEVEL SECURITY;

-- Política de RLS para professional_goals (acesso básico para todos autenticados por enquanto)
CREATE POLICY "Users can view professional goals" ON public.professional_goals
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert professional goals" ON public.professional_goals
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update professional goals" ON public.professional_goals
    FOR UPDATE USING (auth.role() = 'authenticated');
