-- 1. Adicionar coluna de Categoria com restrição de tipos (Safe with IF NOT EXISTS logic via DO block or just simple check)
ALTER TABLE public.crm_opportunities 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'GENERAL' 
CHECK (category IN ('NEW_LEAD', 'BUDGET', 'RETENTION', 'RECOVERY', 'GENERAL'));

-- 2. Adicionar coluna de vínculo com Orçamento (Budget)
ALTER TABLE public.crm_opportunities 
ADD COLUMN IF NOT EXISTS budget_id uuid REFERENCES public.budgets(id);

-- 3. Criar índice para filtrar o pipeline rapidamente por categoria
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_category ON public.crm_opportunities(category);

-- 4. Comentário para documentação
COMMENT ON COLUMN public.crm_opportunities.category IS 'Define a origem/tipo da oportunidade para automação (GHL Style)';
