-- =====================================================
-- Migration: Fix CRM Pipeline Structure
-- Date: 2024-12-25
-- Description: Ensures all required columns exist in leads table
--              and fixes relationships with agent_logs
-- =====================================================

-- 1. Ensure all CRM-related columns exist in leads table
DO $$ 
BEGIN
    -- Add pipeline_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'pipeline_id'
    ) THEN
        ALTER TABLE leads ADD COLUMN pipeline_id uuid REFERENCES crm_pipelines(id);
    END IF;

    -- Add stage_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'stage_id'
    ) THEN
        ALTER TABLE leads ADD COLUMN stage_id uuid REFERENCES crm_stages(id);
    END IF;

    -- Add owner_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE leads ADD COLUMN owner_id uuid REFERENCES users(id);
    END IF;

    -- Add stagnation_alert_at if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'stagnation_alert_at'
    ) THEN
        ALTER TABLE leads ADD COLUMN stagnation_alert_at timestamp with time zone;
    END IF;

    -- Add custom_fields_data if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leads' AND column_name = 'custom_fields_data'
    ) THEN
        ALTER TABLE leads ADD COLUMN custom_fields_data jsonb DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 2. Ensure agent_logs table has correct foreign key to leads
DO $$
BEGIN
    -- Check if the foreign key exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'agent_logs_entity_id_fkey' 
        AND table_name = 'agent_logs'
    ) THEN
        -- Add foreign key constraint
        ALTER TABLE agent_logs 
        ADD CONSTRAINT agent_logs_entity_id_fkey 
        FOREIGN KEY (entity_id) REFERENCES leads(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Create index for better performance on agent_logs queries
CREATE INDEX IF NOT EXISTS idx_agent_logs_entity_id 
ON agent_logs(entity_id);

CREATE INDEX IF NOT EXISTS idx_agent_logs_entity_type 
ON agent_logs(entity_type);

CREATE INDEX IF NOT EXISTS idx_leads_stage_id 
ON leads(stage_id);

CREATE INDEX IF NOT EXISTS idx_leads_pipeline_id 
ON leads(pipeline_id);

-- 4. Migrate existing leads to default pipeline if they don't have one
DO $$
DECLARE
    default_pipeline_id uuid;
    default_stage_id uuid;
BEGIN
    -- Get the default pipeline
    SELECT id INTO default_pipeline_id 
    FROM crm_pipelines 
    WHERE is_default = true 
    LIMIT 1;

    IF default_pipeline_id IS NOT NULL THEN
        -- Get the first stage of the default pipeline
        SELECT id INTO default_stage_id 
        FROM crm_stages 
        WHERE pipeline_id = default_pipeline_id 
        ORDER BY stage_order 
        LIMIT 1;

        -- Update leads without pipeline_id
        UPDATE leads 
        SET 
            pipeline_id = default_pipeline_id,
            stage_id = COALESCE(stage_id, default_stage_id)
        WHERE pipeline_id IS NULL;

        RAISE NOTICE 'Migrated % leads to default pipeline', 
            (SELECT COUNT(*) FROM leads WHERE pipeline_id = default_pipeline_id);
    END IF;
END $$;

-- 5. Create a view to easily access leads with their agent_logs
CREATE OR REPLACE VIEW leads_with_logs AS
SELECT 
    l.*,
    COALESCE(
        json_agg(
            json_build_object(
                'id', al.id,
                'agent_name', al.agent_name,
                'event_type', al.event_type,
                'action_taken', al.action_taken,
                'message_sent', al.message_sent,
                'status', al.status,
                'created_at', al.created_at
            ) ORDER BY al.created_at DESC
        ) FILTER (WHERE al.id IS NOT NULL),
        '[]'::json
    ) as agent_logs
FROM leads l
LEFT JOIN agent_logs al ON al.entity_id = l.id AND al.entity_type = 'LEAD'
GROUP BY l.id;

-- 6. Add comment to clarify the relationship
COMMENT ON VIEW leads_with_logs IS 
'View that joins leads with their agent_logs. Use this instead of trying to access agent_logs as a column.';

-- =====================================================
-- Verification Queries (commented out - uncomment to test)
-- =====================================================

-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'leads' 
-- ORDER BY ordinal_position;

-- SELECT * FROM leads_with_logs LIMIT 5;

DO $$
BEGIN
    RAISE NOTICE '✅ CRM Pipeline Structure Migration Completed Successfully!';
END $$;
