-- Migration: 20260102_master_migration
-- Description: Implements Multi-Role architecture, User Integrations table, and Sales Commission fields.

-- 1. Secure table for tokens (Google/Zoom) - Isolated for security
CREATE TABLE IF NOT EXISTS public.user_integrations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('GOOGLE', 'ZOOM')),
  access_token text,
  refresh_token text, -- Critical for background renewal
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb, -- To store calendar email or extra config
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT user_integrations_user_provider_key UNIQUE (user_id, provider),
  PRIMARY KEY (id)
);

-- 2. Update Role Enum and User Columns
DO $$ BEGIN
    ALTER TYPE public.role ADD VALUE IF NOT EXISTS 'salesperson';
    ALTER TYPE public.role ADD VALUE IF NOT EXISTS 'collection_agent';
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Add Multi-Role and Hybrid Commission columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS roles text[] DEFAULT ARRAY['PROFESSIONAL']::text[], -- Support for multiple roles
ADD COLUMN IF NOT EXISTS sales_commission_percent numeric DEFAULT 0; -- Commission per SALE (independent of clinic execution)

-- 4. Data Migration (Security/Safety)
-- Initialize 'roles' array for existing users based on their single 'role' column
UPDATE public.users 
SET roles = ARRAY[role::text] 
WHERE (roles IS NULL OR roles = ARRAY['PROFESSIONAL']::text[]) 
  AND role IS NOT NULL;
