-- Migration: Add clinic_id to crm_opportunities for multi-clinic support
-- This ensures proper data isolation and easier querying in multi-clinic environments

-- 1. Add clinic_id column to crm_opportunities
ALTER TABLE crm_opportunities 
ADD COLUMN IF NOT EXISTS clinic_id uuid;

-- 2. Populate clinic_id from related lead
UPDATE crm_opportunities o
SET clinic_id = l.clinic_id
FROM leads l
WHERE o.lead_id = l.id
  AND o.clinic_id IS NULL;

-- 3. Add foreign key constraint
ALTER TABLE crm_opportunities
ADD CONSTRAINT crm_opportunities_clinic_id_fkey 
FOREIGN KEY (clinic_id) REFERENCES clinics(id);

-- 4. Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_clinic_id 
ON crm_opportunities(clinic_id);

COMMENT ON COLUMN crm_opportunities.clinic_id IS 
'Clinic ID for multi-clinic data isolation. Denormalized from leads for performance.';
