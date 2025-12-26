-- The professional_ledger table already exists with a different structure
-- We'll add missing columns and update constraints to match our service needs

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add entry_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'professional_ledger' 
                   AND column_name = 'entry_type') THEN
        ALTER TABLE public.professional_ledger 
        ADD COLUMN entry_type text CHECK (entry_type = ANY (ARRAY['CREDIT'::text, 'DEBIT'::text]));
        
        -- Migrate existing 'type' column to 'entry_type'
        UPDATE public.professional_ledger SET entry_type = type WHERE type IS NOT NULL;
    END IF;

    -- Add reference_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'professional_ledger' 
                   AND column_name = 'reference_type') THEN
        ALTER TABLE public.professional_ledger 
        ADD COLUMN reference_type text CHECK (reference_type = ANY (ARRAY['INSTALLMENT'::text, 'BUDGET'::text, 'TREATMENT_ITEM'::text]));
    END IF;

    -- Add reference_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'professional_ledger' 
                   AND column_name = 'reference_id') THEN
        ALTER TABLE public.professional_ledger 
        ADD COLUMN reference_id uuid;
    END IF;

    -- Add created_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'professional_ledger' 
                   AND column_name = 'created_by') THEN
        ALTER TABLE public.professional_ledger 
        ADD COLUMN created_by uuid REFERENCES public.users(id);
    END IF;
END $$;

-- Update category constraint to include our new categories
ALTER TABLE public.professional_ledger DROP CONSTRAINT IF EXISTS professional_ledger_category_check;
ALTER TABLE public.professional_ledger 
ADD CONSTRAINT professional_ledger_category_check 
CHECK (category = ANY (ARRAY['COMMISSION'::text, 'ADVANCE'::text, 'LAB_COST_SHARE'::text, 'TAX_SHARE'::text, 'PAYMENT'::text, 'LAB_COST'::text, 'MATERIAL_COST'::text, 'ADJUSTMENT'::text, 'WITHDRAWAL'::text]));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_professional_ledger_professional_id ON public.professional_ledger(professional_id);
CREATE INDEX IF NOT EXISTS idx_professional_ledger_created_at ON public.professional_ledger(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_professional_ledger_entry_type ON public.professional_ledger(entry_type);
CREATE INDEX IF NOT EXISTS idx_professional_ledger_reference ON public.professional_ledger(reference_type, reference_id);

-- RLS Policies (only create if they don't exist)
ALTER TABLE public.professional_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.professional_ledger;
CREATE POLICY "Enable read access for authenticated users" ON public.professional_ledger
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.professional_ledger;
CREATE POLICY "Enable insert access for authenticated users" ON public.professional_ledger
    FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.professional_ledger;
CREATE POLICY "Enable update access for authenticated users" ON public.professional_ledger
    FOR UPDATE TO authenticated USING (true);

-- Create or replace view for professional balances
CREATE OR REPLACE VIEW public.professional_balances AS
SELECT 
    p.id as professional_id,
    p.name as professional_name,
    p.clinic_id,
    COALESCE(SUM(CASE WHEN pl.entry_type = 'CREDIT' OR pl.type = 'CREDIT' THEN pl.amount ELSE 0 END), 0) as total_credits,
    COALESCE(SUM(CASE WHEN pl.entry_type = 'DEBIT' OR pl.type = 'DEBIT' THEN pl.amount ELSE 0 END), 0) as total_debits,
    COALESCE(SUM(CASE WHEN pl.entry_type = 'CREDIT' OR pl.type = 'CREDIT' THEN pl.amount ELSE -pl.amount END), 0) as current_balance
FROM 
    public.professionals p
LEFT JOIN 
    public.professional_ledger pl ON p.id = pl.professional_id
WHERE 
    p.is_active = true
GROUP BY 
    p.id, p.name, p.clinic_id;

-- Grant access to view
GRANT SELECT ON public.professional_balances TO authenticated;
