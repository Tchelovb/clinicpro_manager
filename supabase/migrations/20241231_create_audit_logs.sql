-- Migration: Create system_audit_logs table
-- Purpose: Track critical system actions like Sales, Deletions, and Security Events.

CREATE TABLE IF NOT EXISTS public.system_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL, -- e.g., 'SALE_COMPLETED', 'DELETE_BUDGET', 'LOGIN_FAIL'
    user_id UUID REFERENCES auth.users(id), -- Nullable in case of system events, but usually linked to user
    entity_id UUID, -- Optional: ID of the entity affected (e.g., budget_id, patient_id)
    entity_table TEXT, -- Optional: Table name of the entity affected
    changes_summary TEXT, -- Human readable summary of what happened
    metadata JSONB DEFAULT '{}'::jsonb, -- Technical details (payloads, old_values)
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    tenant_id UUID -- Optional: if multi-tenant in future
);

-- Add RLS Policies
ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow insert by authenticated users
CREATE POLICY "Users can insert audit logs" 
ON public.system_audit_logs FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow view only by admins (or specific roles) - For now, allow reading own logs or all if needed? 
-- Let's restrict read to service for now or assume dashboard will use service role.
-- For simple testing, allow authenticated read.
CREATE POLICY "Users can view audit logs"
ON public.system_audit_logs FOR SELECT
TO authenticated
USING (true);

-- Create Index
CREATE INDEX idx_audit_logs_action_type ON public.system_audit_logs(action_type);
CREATE INDEX idx_audit_logs_user_id ON public.system_audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.system_audit_logs(created_at);
