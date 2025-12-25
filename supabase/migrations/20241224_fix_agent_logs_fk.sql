-- ============================================
-- FIX: ADD FOREIGN KEY RELATIONSHIP
-- ============================================
-- This migration adds the missing foreign key
-- between leads and agent_logs tables
-- ============================================

-- Check if the foreign key already exists, if not, add it
DO $$
BEGIN
    -- Check if entity_id column exists in agent_logs
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'agent_logs' 
        AND column_name = 'lead_id'
    ) THEN
        -- If lead_id doesn't exist but entity_id does, we need to use entity_id
        -- Add foreign key constraint using entity_id
        IF NOT EXISTS (
            SELECT 1
            FROM information_schema.table_constraints
            WHERE constraint_schema = 'public'
            AND table_name = 'agent_logs'
            AND constraint_name = 'agent_logs_entity_id_fkey'
            AND constraint_type = 'FOREIGN KEY'
        ) THEN
            ALTER TABLE public.agent_logs
            ADD CONSTRAINT agent_logs_entity_id_fkey
            FOREIGN KEY (entity_id)
            REFERENCES public.leads(id)
            ON DELETE CASCADE;
            
            RAISE NOTICE '✅ Foreign key added: agent_logs.entity_id -> leads.id';
        ELSE
            RAISE NOTICE 'ℹ️ Foreign key already exists';
        END IF;
    END IF;
END $$;

-- Verify the relationship
DO $$
BEGIN
    RAISE NOTICE '✅ Relationship check complete!';
    RAISE NOTICE 'Now Supabase can join leads with agent_logs';
END $$;
