-- Add category_id to budgets table if it doesn't exist
-- Corrected relationship: Links to expense_category based on provided schema
ALTER TABLE public.budgets 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.expense_category(id);

-- Ensure sales_rep_id exists
ALTER TABLE public.budgets 
ADD COLUMN IF NOT EXISTS sales_rep_id UUID REFERENCES public.users(id);
