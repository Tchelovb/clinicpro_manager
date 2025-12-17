-- Add professional_id column to users table
-- Migration to support professional linking functionality

ALTER TABLE users ADD COLUMN IF NOT EXISTS professional_id UUID REFERENCES professionals(id) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_users_professional_id ON users(professional_id);

-- Add comment
COMMENT ON COLUMN users.professional_id IS 'Reference to the professional record for dentists and admins';