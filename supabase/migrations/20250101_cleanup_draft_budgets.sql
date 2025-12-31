-- Migration: Clean Up Draft Budgets - Apply Law of Closure
-- Date: 2025-12-31
-- Purpose: Convert all old DRAFT budgets to WAITING_CLOSING (sent to reception)
-- Rationale: Implementing "Law of Closure" - no more draft limbo

-- 1. Update all DRAFT budgets to WAITING_CLOSING
-- This moves them to the reception queue for proper follow-up
UPDATE public.budgets
SET 
    status = 'WAITING_CLOSING',
    updated_at = NOW()
WHERE 
    status = 'DRAFT'
    AND created_at < NOW() - INTERVAL '1 hour'; -- Only budgets older than 1 hour (avoid touching active sessions)

-- 2. Add a note to track this migration
COMMENT ON COLUMN public.budgets.status IS 
'Budget status: DRAFT (auto-save only), WAITING_CLOSING (sent to reception), APPROVED (sold), REJECTED (lost), EXPIRED (timeout)';

-- 3. Optional: Log the migration for audit
DO $$
DECLARE
    affected_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO affected_count
    FROM public.budgets
    WHERE status = 'WAITING_CLOSING'
    AND updated_at > NOW() - INTERVAL '5 minutes';
    
    RAISE NOTICE 'Draft cleanup completed. % budgets moved to WAITING_CLOSING', affected_count;
END $$;

-- 4. Create a view to monitor abandoned drafts (for future cleanup)
CREATE OR REPLACE VIEW public.abandoned_drafts AS
SELECT 
    b.id,
    b.patient_id,
    p.name as patient_name,
    b.total_value,
    b.created_at,
    b.updated_at,
    EXTRACT(EPOCH FROM (NOW() - b.updated_at))/3600 as hours_abandoned
FROM public.budgets b
LEFT JOIN public.patients p ON b.patient_id = p.id
WHERE 
    b.status = 'DRAFT'
    AND b.updated_at < NOW() - INTERVAL '24 hours'
ORDER BY b.updated_at DESC;

COMMENT ON VIEW public.abandoned_drafts IS 
'Shows budgets stuck in DRAFT for more than 24 hours - candidates for cleanup or conversion';
