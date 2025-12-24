-- Add type and color columns to expense_category
ALTER TABLE public.expense_category 
ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('INCOME', 'EXPENSE')) DEFAULT 'EXPENSE';

ALTER TABLE public.expense_category 
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3B82F6';

COMMENT ON COLUMN public.expense_category.type IS 'Tipo da categoria: RECEITA ou DESPESA';
COMMENT ON COLUMN public.expense_category.color IS 'Cor para identificação visual';
