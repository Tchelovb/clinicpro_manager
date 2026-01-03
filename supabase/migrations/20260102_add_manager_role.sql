-- Migration: 20260102_add_manager_role
-- Description: Adds 'manager' to the UserRole enum.

DO $$ BEGIN
    ALTER TYPE public.role ADD VALUE IF NOT EXISTS 'manager';
EXCEPTION WHEN duplicate_object THEN null; END $$;
