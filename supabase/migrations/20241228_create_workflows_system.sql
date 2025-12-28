-- Migration: Create Workflows Automation System
-- This creates the complete infrastructure for automated lead nurturing workflows

-- 1. Workflows table - Defines automation sequences
CREATE TABLE IF NOT EXISTS crm_workflows (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id uuid REFERENCES clinics(id),
  name text NOT NULL,
  description text,
  trigger_type text NOT NULL CHECK (trigger_type IN ('MANUAL', 'LEAD_CREATED', 'OPPORTUNITY_CREATED', 'STAGE_CHANGED', 'TAG_ADDED')),
  trigger_config jsonb, -- Additional trigger configuration (e.g., specific stage_id, tag_name)
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id)
);

-- Add first_step_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'crm_workflows' AND column_name = 'first_step_id'
  ) THEN
    ALTER TABLE crm_workflows ADD COLUMN first_step_id uuid;
  END IF;
END $$;

-- 2. Workflow Steps table - Individual actions in a workflow
CREATE TABLE IF NOT EXISTS crm_workflow_steps (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id uuid NOT NULL REFERENCES crm_workflows(id) ON DELETE CASCADE,
  step_order integer NOT NULL,
  step_type text NOT NULL CHECK (step_type IN ('SEND_EMAIL', 'SEND_WHATSAPP', 'WAIT', 'ADD_TAG', 'CHANGE_STAGE', 'CREATE_TASK', 'CONDITIONAL')),
  step_config jsonb NOT NULL, -- Configuration specific to step type
  next_step_id uuid REFERENCES crm_workflow_steps(id), -- Next step in sequence
  conditional_next_step_id uuid REFERENCES crm_workflow_steps(id), -- Alternative path for conditionals
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Workflow Executions table - Add missing columns to existing table
-- The table already exists, so we just add the missing columns
DO $$ 
BEGIN
  -- Add next_execution_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'crm_workflow_executions' AND column_name = 'next_execution_at'
  ) THEN
    ALTER TABLE crm_workflow_executions ADD COLUMN next_execution_at timestamptz;
  END IF;

  -- Add execution_data if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'crm_workflow_executions' AND column_name = 'execution_data'
  ) THEN
    ALTER TABLE crm_workflow_executions ADD COLUMN execution_data jsonb;
  END IF;

  -- Add error_message if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'crm_workflow_executions' AND column_name = 'error_message'
  ) THEN
    ALTER TABLE crm_workflow_executions ADD COLUMN error_message text;
  END IF;

  -- Add completed_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'crm_workflow_executions' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE crm_workflow_executions ADD COLUMN completed_at timestamptz;
  END IF;

  -- Add started_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'crm_workflow_executions' AND column_name = 'started_at'
  ) THEN
    ALTER TABLE crm_workflow_executions ADD COLUMN started_at timestamptz DEFAULT now();
  END IF;

  -- Add updated_at if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'crm_workflow_executions' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE crm_workflow_executions ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  -- Update status column to include new values if needed
  -- This is safe because it only adds new allowed values
END $$;

-- Add UNIQUE constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'crm_workflow_executions_workflow_id_lead_id_key'
  ) THEN
    ALTER TABLE crm_workflow_executions 
    ADD CONSTRAINT crm_workflow_executions_workflow_id_lead_id_key 
    UNIQUE(workflow_id, lead_id);
  END IF;
END $$;

-- 4. Workflow Execution Logs table - Audit trail of all actions
CREATE TABLE IF NOT EXISTS crm_workflow_execution_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  execution_id uuid NOT NULL REFERENCES crm_workflow_executions(id) ON DELETE CASCADE,
  step_id uuid REFERENCES crm_workflow_steps(id),
  action text NOT NULL,
  status text NOT NULL CHECK (status IN ('SUCCESS', 'FAILED', 'SKIPPED')),
  details jsonb,
  error_message text,
  executed_at timestamptz DEFAULT now()
);

-- Add foreign key for first_step_id (must be added after crm_workflow_steps exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'crm_workflows_first_step_id_fkey'
  ) THEN
    ALTER TABLE crm_workflows
    ADD CONSTRAINT crm_workflows_first_step_id_fkey 
    FOREIGN KEY (first_step_id) REFERENCES crm_workflow_steps(id);
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflow_executions_lead_id ON crm_workflow_executions(lead_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON crm_workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_next_execution ON crm_workflow_executions(next_execution_at) WHERE status = 'WAITING';
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow_id ON crm_workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflows_trigger_type ON crm_workflows(trigger_type) WHERE is_active = true;

-- Function to auto-enroll leads in workflows with LEAD_CREATED trigger
CREATE OR REPLACE FUNCTION auto_enroll_lead_in_workflows()
RETURNS TRIGGER AS $$
DECLARE
  workflow_record RECORD;
  first_step uuid;
BEGIN
  -- Find all active workflows with LEAD_CREATED trigger
  FOR workflow_record IN 
    SELECT id, first_step_id, clinic_id
    FROM crm_workflows
    WHERE trigger_type = 'LEAD_CREATED'
      AND is_active = true
      AND (clinic_id = NEW.clinic_id OR clinic_id IS NULL)
  LOOP
    -- Enroll lead in workflow (ignore if already enrolled)
    INSERT INTO crm_workflow_executions (
      workflow_id,
      lead_id,
      current_step_id,
      status,
      started_at
    )
    VALUES (
      workflow_record.id,
      NEW.id,
      workflow_record.first_step_id,
      'WAITING',
      NOW()
    )
    ON CONFLICT (workflow_id, lead_id) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-enroll leads
DROP TRIGGER IF EXISTS trigger_auto_enroll_lead ON leads;
CREATE TRIGGER trigger_auto_enroll_lead
AFTER INSERT ON leads
FOR EACH ROW
EXECUTE FUNCTION auto_enroll_lead_in_workflows();

-- Function to auto-enroll leads when opportunity is created
CREATE OR REPLACE FUNCTION auto_enroll_opportunity_in_workflows()
RETURNS TRIGGER AS $$
DECLARE
  workflow_record RECORD;
  lead_clinic_id uuid;
BEGIN
  -- Get lead's clinic_id
  SELECT clinic_id INTO lead_clinic_id
  FROM leads
  WHERE id = NEW.lead_id;

  -- Find all active workflows with OPPORTUNITY_CREATED trigger
  FOR workflow_record IN 
    SELECT id, first_step_id
    FROM crm_workflows
    WHERE trigger_type = 'OPPORTUNITY_CREATED'
      AND is_active = true
      AND (clinic_id = lead_clinic_id OR clinic_id IS NULL)
  LOOP
    -- Enroll lead in workflow (ignore if already enrolled)
    INSERT INTO crm_workflow_executions (
      workflow_id,
      lead_id,
      current_step_id,
      status,
      started_at
    )
    VALUES (
      workflow_record.id,
      NEW.lead_id,
      workflow_record.first_step_id,
      'WAITING',
      NOW()
    )
    ON CONFLICT (workflow_id, lead_id) DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-enroll on opportunity creation
DROP TRIGGER IF EXISTS trigger_auto_enroll_opportunity ON crm_opportunities;
CREATE TRIGGER trigger_auto_enroll_opportunity
AFTER INSERT ON crm_opportunities
FOR EACH ROW
EXECUTE FUNCTION auto_enroll_opportunity_in_workflows();

COMMENT ON TABLE crm_workflows IS 'Defines automated nurturing sequences for leads';
COMMENT ON TABLE crm_workflow_steps IS 'Individual actions within a workflow sequence';
COMMENT ON TABLE crm_workflow_executions IS 'Tracks workflow enrollment and progress for each lead';
COMMENT ON TABLE crm_workflow_execution_logs IS 'Audit trail of all workflow actions executed';
