-- Migration: Sync lead.value with sum of OPEN opportunities
-- This trigger automatically updates the lead's total value whenever opportunities change

-- Function to calculate and sync lead value
CREATE OR REPLACE FUNCTION sync_lead_value_from_opportunities()
RETURNS TRIGGER AS $$
DECLARE
  target_lead_id uuid;
BEGIN
  -- Determine which lead to update
  IF TG_OP = 'DELETE' THEN
    target_lead_id := OLD.lead_id;
  ELSE
    target_lead_id := NEW.lead_id;
  END IF;

  -- Skip if no lead_id (safety check)
  IF target_lead_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Update lead.value with sum of OPEN opportunities
  UPDATE leads
  SET 
    value = (
      SELECT COALESCE(SUM(monetary_value), 0)
      FROM crm_opportunities
      WHERE lead_id = target_lead_id
      AND status = 'OPEN'
    ),
    updated_at = NOW()
  WHERE id = target_lead_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger on crm_opportunities table
DROP TRIGGER IF EXISTS trigger_sync_lead_value ON crm_opportunities;

CREATE TRIGGER trigger_sync_lead_value
AFTER INSERT OR UPDATE OR DELETE ON crm_opportunities
FOR EACH ROW
EXECUTE FUNCTION sync_lead_value_from_opportunities();

-- Migrate existing leads: create initial opportunity for leads with value but no opportunities
INSERT INTO crm_opportunities (
  lead_id, 
  title, 
  monetary_value, 
  status, 
  pipeline_id, 
  stage_id,
  clinic_id,
  created_at,
  updated_at
)
SELECT 
  l.id,
  COALESCE(l.desired_treatment, 'Interesse Inicial'),
  COALESCE(l.value, 0),
  'OPEN',
  l.pipeline_id,
  l.stage_id,
  l.clinic_id,
  l.created_at,
  NOW()
FROM leads l
WHERE l.id NOT IN (SELECT DISTINCT lead_id FROM crm_opportunities WHERE lead_id IS NOT NULL)
  AND l.pipeline_id IS NOT NULL
  AND l.stage_id IS NOT NULL
  AND (l.value > 0 OR l.desired_treatment IS NOT NULL);

COMMENT ON FUNCTION sync_lead_value_from_opportunities() IS 
'Automatically syncs lead.value with the sum of all OPEN opportunities for that lead';
