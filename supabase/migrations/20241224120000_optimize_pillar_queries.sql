-- Performance Optimization: Add Indexes for ClinicHealth Queries
-- Migration: 20241224120000_optimize_pillar_queries
-- Description: Creates composite indexes to accelerate pillar score calculations

-- Index for lead counting (Atração pillar)
-- Speeds up: SELECT COUNT(*) FROM patients WHERE clinic_id = X AND created_at > Y
CREATE INDEX IF NOT EXISTS idx_patients_clinic_created 
ON patients(clinic_id, created_at DESC);

-- Index for budget counting and conversion metrics (Conversão pillar)
-- Speeds up: SELECT COUNT(*) FROM budgets WHERE clinic_id = X AND status = Y AND created_at > Z
CREATE INDEX IF NOT EXISTS idx_budgets_clinic_status_created 
ON budgets(clinic_id, status, created_at DESC);

-- Index for profit margin calculations (Lucro pillar)
-- Speeds up: SELECT AVG(margin) FROM budgets WHERE clinic_id = X AND status = 'APPROVED' AND final_value > 0
CREATE INDEX IF NOT EXISTS idx_budgets_clinic_approved_value 
ON budgets(clinic_id, status, final_value) 
WHERE status = 'APPROVED' AND final_value > 0;

-- Add comment for documentation
COMMENT ON INDEX idx_patients_clinic_created IS 'Optimizes lead counting for Atração pillar in 10x50 radar';
COMMENT ON INDEX idx_budgets_clinic_status_created IS 'Optimizes conversion rate calculations for Conversão pillar';
COMMENT ON INDEX idx_budgets_clinic_approved_value IS 'Optimizes profit margin calculations for Lucro pillar';
