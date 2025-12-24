-- Add role flags to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_sales_rep boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_clinical_provider boolean DEFAULT true;

-- Update existing professionals to be clinical providers by default (if they are professionals)
UPDATE public.users
SET is_clinical_provider = true
WHERE professional_id IS NOT NULL;

-- Create index for performance on filtering
CREATE INDEX IF NOT EXISTS idx_users_is_sales_rep ON public.users(is_sales_rep);
CREATE INDEX IF NOT EXISTS idx_users_is_clinical_provider ON public.users(is_clinical_provider);
