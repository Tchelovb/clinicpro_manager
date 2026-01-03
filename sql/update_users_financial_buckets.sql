-- 1. Cria a coluna de Comissão de Cobrança (Recuperação)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS collection_percent numeric DEFAULT 0;

-- 2. Garante a coluna de Comissão de Vendas (Comercial)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS sales_commission_percent numeric DEFAULT 0;

-- 3. Garante as flags de função (caso não existam)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_clinical_provider boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_sales_rep boolean DEFAULT false;

-- 4. Documentação para o futuro (Comentários no banco)
COMMENT ON COLUMN public.users.commission_percent IS 'Repasse Clínico (Mão de obra)';
COMMENT ON COLUMN public.users.sales_commission_percent IS 'Comissão Comercial (Venda)';
COMMENT ON COLUMN public.users.collection_percent IS 'Comissão de Recuperação (Cobrança)';
