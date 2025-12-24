-- =====================================================
-- RECEIVABLES KEY UPDATE
-- Date: 2025-12-23
-- Purpose: Link Budgets to Card Machine Profiles for auditing
-- =====================================================

ALTER TABLE public.budgets
ADD COLUMN IF NOT EXISTS card_machine_profile_id UUID REFERENCES public.card_machine_profiles(id);

COMMENT ON COLUMN public.budgets.card_machine_profile_id IS 'Profile of the card machine used for payment approval';
