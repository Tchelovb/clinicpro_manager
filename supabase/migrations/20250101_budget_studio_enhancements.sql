-- ============================================================================
-- MIGRATION: Budget Studio & Sales Terminal Enhancements
-- Version: 1.0
-- Date: 2025-01-01
-- Author: ClinicPro Development Team
-- ============================================================================
-- Purpose: Add fields to support:
--   1. Showroom Mode (visual presentation to patients)
--   2. Discount Authorization Tracking (security & audit)
--   3. Item-Level Sales Control (partial budget sales)
--   4. Treatment-to-Sale Linkage (full traceability)
-- ============================================================================

-- ============================================================================
-- SECTION 1: PROCEDURE ENHANCEMENTS (SHOWROOM MODE)
-- ============================================================================
-- Add visual presentation fields for the Budget Studio "Showroom Mode"
-- These fields allow displaying beautiful, patient-friendly content instead
-- of technical procedure names and codes.

COMMENT ON TABLE public.procedure IS 
'Catalog of dental/medical procedures with pricing, duration, and presentation data for Budget Studio';

ALTER TABLE public.procedure
ADD COLUMN IF NOT EXISTS showroom_image_url text,
ADD COLUMN IF NOT EXISTS benefits_description text;

COMMENT ON COLUMN public.procedure.showroom_image_url IS 
'URL to illustrative image for patient presentation (e.g., before/after photos, procedure visualization)';

COMMENT ON COLUMN public.procedure.benefits_description IS 
'Patient-friendly description of benefits and outcomes (e.g., "Recover your confidence with a perfect smile")';

-- ============================================================================
-- SECTION 2: TRANSACTION ENHANCEMENTS (DISCOUNT AUTHORIZATION)
-- ============================================================================
-- Track who authorized aggressive discounts for security and audit purposes.
-- This prevents unauthorized discounts and maintains a clear audit trail.

COMMENT ON TABLE public.transactions IS 
'Financial transactions with full audit trail including discount authorization tracking';

ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS discount_authorized_by uuid REFERENCES public.users(id);

COMMENT ON COLUMN public.transactions.discount_authorized_by IS 
'User ID of the manager/supervisor who authorized a discount above the standard limit (for security and audit)';

-- Create index for performance on audit queries
CREATE INDEX IF NOT EXISTS idx_transactions_discount_authorized_by 
ON public.transactions(discount_authorized_by) 
WHERE discount_authorized_by IS NOT NULL;

-- ============================================================================
-- SECTION 3: TREATMENT ITEMS ENHANCEMENTS (SALES TRACEABILITY)
-- ============================================================================
-- Link clinical treatment items to specific budget items and sales transactions
-- for complete end-to-end traceability from sale to clinical execution.

COMMENT ON TABLE public.treatment_items IS 
'Clinical treatment items with full linkage to budget items and sales transactions for complete traceability';

ALTER TABLE public.treatment_items
ADD COLUMN IF NOT EXISTS budget_item_id uuid REFERENCES public.budget_items(id),
ADD COLUMN IF NOT EXISTS sales_transaction_id uuid REFERENCES public.transactions(id);

COMMENT ON COLUMN public.treatment_items.budget_item_id IS 
'Links to the specific budget item that was sold (enables partial budget sales tracking)';

COMMENT ON COLUMN public.treatment_items.sales_transaction_id IS 
'Links to the financial transaction that paid for this treatment (complete financial traceability)';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_treatment_items_budget_item_id 
ON public.treatment_items(budget_item_id);

CREATE INDEX IF NOT EXISTS idx_treatment_items_sales_transaction_id 
ON public.treatment_items(sales_transaction_id);

-- ============================================================================
-- SECTION 4: BUDGET ITEMS ENHANCEMENTS (CHECKOUT CONTROL)
-- ============================================================================
-- Track which budget items have been sold individually, enabling partial
-- budget sales where patients can pay for specific items over time.

COMMENT ON TABLE public.budget_items IS 
'Individual items within a budget with granular sales tracking for partial budget checkout';

ALTER TABLE public.budget_items
ADD COLUMN IF NOT EXISTS is_sold boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sold_at timestamp with time zone;

COMMENT ON COLUMN public.budget_items.is_sold IS 
'Indicates if this specific item has been sold/paid for (enables partial budget sales)';

COMMENT ON COLUMN public.budget_items.sold_at IS 
'Timestamp when this item was sold (for audit and tracking purposes)';

-- Create index for filtering sold/unsold items
CREATE INDEX IF NOT EXISTS idx_budget_items_is_sold 
ON public.budget_items(budget_id, is_sold);

-- ============================================================================
-- SECTION 5: DATA INTEGRITY & AUDIT
-- ============================================================================

-- Add audit log entry for this migration
INSERT INTO public.system_audit_logs (
    clinic_id,
    user_id,
    user_name,
    action_type,
    entity_type,
    changes_summary
)
SELECT 
    id as clinic_id,
    NULL as user_id,
    'SYSTEM' as user_name,
    'UPDATE' as action_type,
    'PROCEDURE' as entity_type,
    'Applied Budget Studio & Sales Terminal schema enhancements: Added showroom fields, discount authorization tracking, and item-level sales control' as changes_summary
FROM public.clinics
LIMIT 1;

-- ============================================================================
-- VERIFICATION QUERIES (For Testing)
-- ============================================================================
-- Uncomment these to verify the migration was successful:

-- Check procedure columns
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'procedure' 
-- AND column_name IN ('showroom_image_url', 'benefits_description');

-- Check transactions columns
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'transactions' 
-- AND column_name = 'discount_authorized_by';

-- Check treatment_items columns
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'treatment_items' 
-- AND column_name IN ('budget_item_id', 'sales_transaction_id');

-- Check budget_items columns
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'budget_items' 
-- AND column_name IN ('is_sold', 'sold_at');

-- ============================================================================
-- ROLLBACK SCRIPT (Emergency Use Only)
-- ============================================================================
-- In case of issues, uncomment and run this to rollback:

-- DROP INDEX IF EXISTS idx_transactions_discount_authorized_by;
-- DROP INDEX IF EXISTS idx_treatment_items_budget_item_id;
-- DROP INDEX IF EXISTS idx_treatment_items_sales_transaction_id;
-- DROP INDEX IF EXISTS idx_budget_items_is_sold;

-- ALTER TABLE public.procedure
-- DROP COLUMN IF EXISTS showroom_image_url,
-- DROP COLUMN IF EXISTS benefits_description;

-- ALTER TABLE public.transactions
-- DROP COLUMN IF EXISTS discount_authorized_by;

-- ALTER TABLE public.treatment_items
-- DROP COLUMN IF EXISTS budget_item_id,
-- DROP COLUMN IF EXISTS sales_transaction_id;

-- ALTER TABLE public.budget_items
-- DROP COLUMN IF EXISTS is_sold,
-- DROP COLUMN IF EXISTS sold_at;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
